// Contas, progresso na nuvem e ranking global.
//
// Três modos:
//  - 'firebase': Firebase Auth + Firestore (quando firebaseConfig.js está preenchido). SDK carregado sob demanda.
//  - 'demo':     sem configuração (ou ?cloud=demo). Imita o Firebase guardando tudo NESTE navegador,
//                para testar as telas na prévia do Claude, que bloqueia conexões externas.
//  - 'offline':  o Firebase não carregou (sem internet). O jogo segue com o save local e tenta de novo depois.
//
// O jogador sempre começa como CONVIDADO (login anônimo, sem cadastro). Ao criar conta com Google ou
// e-mail, a conta de convidado é VINCULADA: o id não muda e nenhum progresso se perde.
// Coleções: players/{uid} = { save (JSON), rev, nick, updatedAt } · leaderboard/{uid} = { nick, best, char, kills, updatedAt }

import { FIREBASE_CONFIG, FIREBASE_SDK } from './firebaseConfig.js';

const SAVE_DEBOUNCE = 2500;
const NICK_RE = /^[A-Za-z0-9À-ÿ_\- ]{3,16}$/;

export const AUTH_ERRORS = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/missing-email': 'Digite o e-mail.',
  'auth/missing-password': 'Digite a senha.',
  'auth/weak-password': 'A senha precisa de pelo menos 6 caracteres.',
  'auth/email-already-in-use': 'Esse e-mail já tem conta. Toque em "Entrar".',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'Não existe conta com esse e-mail.',
  'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/cancelled-popup-request': 'Login cancelado.',
  'auth/popup-blocked': 'O navegador bloqueou a janela de login. Libere pop-ups e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/operation-not-allowed': 'Esse tipo de login ainda não foi ativado no Firebase.',
  'auth/requires-recent-login': 'Por segurança, entre de novo e repita.',
  offline: 'Sem conexão: o progresso fica salvo neste aparelho por enquanto.',
  'bad-nick': 'Apelido: 3 a 16 letras, números, espaço, _ ou -.',
};
export const errorText = (e) => {
  const msg = String((e && e.message) || '');
  // Login nativo do Google recusado pelo Google Play Services (chave do app ou cliente OAuth ainda não reconhecidos)
  if (/reauth failed|\[16\]|ApiException: ?10/i.test(msg)) return 'O Google recusou o login neste aparelho (código 16). Tente de novo em alguns minutos; se continuar, use e-mail e senha.';
  if (/cancel/i.test(msg)) return 'Login com Google cancelado.';
  return AUTH_ERRORS[e && e.code] || `Não deu certo (${(e && (e.code || e.message)) || 'erro'}).`;
};

// ======================= Firebase =======================

class FirebaseBackend {
  constructor(cfg) { this.cfg = cfg; this.mode = 'firebase'; }

  async init(onUser) {
    const v = FIREBASE_SDK;
    const [app, A, F] = await Promise.all([import(v + 'firebase-app.js'), import(v + 'firebase-auth.js'), import(v + 'firebase-firestore.js')]);
    this.A = A; this.F = F;
    this.app = app.initializeApp(this.cfg);
    this.auth = A.getAuth(this.app);
    this.db = F.getFirestore(this.app);
    this.auth.languageCode = 'pt';
    this.onUser = onUser;
    A.onAuthStateChanged(this.auth, (u) => {
      if (!u) { A.signInAnonymously(this.auth).catch((e) => console.warn('[cloud] anônimo', e)); return; }
      onUser(this._map(u));
    });
  }

  _map(u) {
    const pids = (u.providerData || []).map((p) => p.providerId);
    const provider = u.isAnonymous ? 'anon' : pids.includes('google.com') ? 'google' : 'password';
    return { uid: u.uid, guest: u.isAnonymous, provider, email: u.email || '', name: u.displayName || '' };
  }

  async _refresh() { await this.auth.currentUser.reload(); this.onUser(this._map(this.auth.currentUser)); }

  // No app Android o login do Google é nativo (plugin @capacitor-firebase/authentication, skipNativeAuth: true):
  // o plugin devolve o idToken e a sessão é criada no Firebase JS. No navegador, janela pop-up.
  async _googleCredential() {
    const C = window.Capacitor;
    const FA = C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.FirebaseAuthentication;
    if (!FA) return null;
    const r = await FA.signInWithGoogle();
    return this.A.GoogleAuthProvider.credential(r.credential && r.credential.idToken);
  }

  async google() {
    const A = this.A, u = this.auth.currentUser;
    const cred = await this._googleCredential();
    if (u && u.isAnonymous) {
      try {
        if (cred) await A.linkWithCredential(u, cred);
        else await A.linkWithPopup(u, new A.GoogleAuthProvider());
        return this._refresh();
      } catch (e) {
        if (e.code === 'auth/credential-already-in-use') {
          const c = cred || A.GoogleAuthProvider.credentialFromError(e);
          throw { code: 'in-use', proceed: () => A.signInWithCredential(this.auth, c) };
        }
        throw e;
      }
    }
    if (cred) await A.signInWithCredential(this.auth, cred);
    else await A.signInWithPopup(this.auth, new A.GoogleAuthProvider());
  }

  async signUp(email, pass) {
    const A = this.A, u = this.auth.currentUser;
    if (u && u.isAnonymous) { await A.linkWithCredential(u, A.EmailAuthProvider.credential(email, pass)); return this._refresh(); }
    await A.createUserWithEmailAndPassword(this.auth, email, pass);
  }

  signIn(email, pass) { return this.A.signInWithEmailAndPassword(this.auth, email, pass); }
  reset(email) { return this.A.sendPasswordResetEmail(this.auth, email); }
  async signOut() {
    const C = window.Capacitor, FA = C && C.Plugins && C.Plugins.FirebaseAuthentication;
    if (FA && C.isNativePlatform && C.isNativePlatform()) { try { await FA.signOut(); } catch { /* ok */ } }
    await this.A.signOut(this.auth);                 // onAuthStateChanged(null) cria um novo convidado
  }

  // Conta de desenvolvedor: existe o documento admins/{uid} (criado à mão no Console; ninguém escreve pelo app)
  async isDev(uid) {
    const s = await this.F.getDoc(this.F.doc(this.db, 'admins', uid));
    return s.exists();
  }

  async loadPlayer(uid) {
    const s = await this.F.getDoc(this.F.doc(this.db, 'players', uid));
    return s.exists() ? s.data() : null;
  }
  savePlayer(uid, data) {
    const F = this.F;
    return F.setDoc(F.doc(this.db, 'players', uid), { ...data, updatedAt: F.serverTimestamp() });
  }
  async getScore(uid) {
    const s = await this.F.getDoc(this.F.doc(this.db, 'leaderboard', uid));
    return s.exists() ? s.data() : null;
  }
  putScore(uid, e) {
    const F = this.F;
    return F.setDoc(F.doc(this.db, 'leaderboard', uid), { ...e, updatedAt: F.serverTimestamp() });
  }
  async top(n) {
    const F = this.F;
    const q = F.query(F.collection(this.db, 'leaderboard'), F.orderBy('best', 'desc'), F.limit(n));
    return (await F.getDocs(q)).docs.map((d) => ({ uid: d.id, ...d.data() }));
  }
  async rankOf(best) {
    const F = this.F;
    const q = F.query(F.collection(this.db, 'leaderboard'), F.where('best', '>', best));
    return (await F.getCountFromServer(q)).data().count + 1;
  }
}

// ======================= Demonstração (local) =======================

const DEMO_KEY = 'neonpaws.demo.cloud.v1';
// Conta master na demonstração: só o hash da senha fica no código (a senha em si não).
const DEMO_MASTER = { email: 'renanmaster@nekog.dev', uid: 'demo-master', hash: '79caca04f72fa55f280b8ec08f5f600892b67a9e34a7ea43ae154ed60ac7e18a' };
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const err = (code) => Object.assign(new Error(code), { code });

class DemoBackend {
  constructor() { this.mode = 'demo'; }

  _load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEMO_KEY)); } catch { /* sem armazenamento */ }
    if (!d) {
      d = { emails: {}, google: null, accounts: {}, players: {}, board: {}, session: null, n: 0 };
      // Jogadores fictícios para o ranking da demonstração não ficar vazio
      const bots = [['NeoGato', 912, 'gato'], ['PugDeFerro', 788, 'pug'], ['Glitch_BR', 701, 'guaxinim'], ['Zé Byte', 655, 'gato'],
        ['RaccoonX', 590, 'guaxinim'], ['Lia_Neon', 512, 'gato'], ['TurboPug', 466, 'pug'], ['Hacker42', 401, 'guaxinim'],
        ['Mia Volt', 333, 'gato'], ['Ratão', 270, 'pug'], ['Pixel', 214, 'gato'], ['Novato', 128, 'pug']];
      bots.forEach(([nick, best, char], i) => { d.board['bot' + i] = { nick, best, char, kills: Math.round(best * 1.3) }; });
    }
    if (!d.accounts[DEMO_MASTER.uid]) d.accounts[DEMO_MASTER.uid] = { provider: 'password', email: 'renanmaster', role: 'dev' };
    return d;
  }
  _save(d) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(d)); } catch { /* sem armazenamento */ } }
  _newGuest(d) { d.n++; const uid = 'demo-' + Date.now().toString(36) + d.n; d.accounts[uid] = { provider: 'anon', email: '' }; d.session = uid; return uid; }
  _emit(d) {
    const a = d.accounts[d.session] || { provider: 'anon', email: '' };
    this.onUser({ uid: d.session, guest: a.provider === 'anon', provider: a.provider, email: a.email, name: a.provider === 'google' ? 'Conta Google (demo)' : '' });
  }

  async init(onUser) {
    this.onUser = onUser;
    const d = this._load();
    if (!d.session || !d.accounts[d.session]) this._newGuest(d);
    this._save(d);
    await wait(50);
    this._emit(d);
  }

  async google() {
    await wait(400);
    const d = this._load(), me = d.accounts[d.session];
    if (d.google && d.google !== d.session) {
      if (me.provider === 'anon') throw { code: 'in-use', proceed: async () => { const d2 = this._load(); d2.session = d2.google; this._save(d2); this._emit(d2); } };
      d.session = d.google; this._save(d); return this._emit(d);
    }
    d.google = d.session; me.provider = 'google'; me.email = 'jogador.demo@gmail.com';
    this._save(d); this._emit(d);
  }

  async signUp(email, pass) {
    await wait();
    email = (email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw err('auth/invalid-email');
    if (!pass || pass.length < 6) throw err('auth/weak-password');
    const d = this._load();
    if (d.emails[email]) throw err('auth/email-already-in-use');
    const me = d.accounts[d.session];
    if (me.provider !== 'anon') this._newGuest(d);
    d.emails[email] = { pass, uid: d.session };
    d.accounts[d.session] = { provider: 'password', email };
    this._save(d); this._emit(d);
  }

  async signIn(email, pass) {
    await wait();
    email = (email || '').trim().toLowerCase();
    if (!email) throw err('auth/missing-email');
    if (!pass) throw err('auth/missing-password');
    const d = this._load();
    if (email === DEMO_MASTER.email) {
      if ((await sha256('neonpaws-dev:' + pass)) !== DEMO_MASTER.hash) throw err('auth/invalid-credential');
      d.session = DEMO_MASTER.uid; this._save(d); return this._emit(d);
    }
    const a = d.emails[email];
    if (!a || a.pass !== pass) throw err('auth/invalid-credential');
    d.session = a.uid; this._save(d); this._emit(d);
  }

  async reset(email) {
    await wait();
    if (!this._load().emails[(email || '').trim().toLowerCase()]) throw err('auth/user-not-found');
  }

  async isDev(uid) { const a = this._load().accounts[uid]; return !!(a && a.role === 'dev'); }
  async signOut() { await wait(150); const d = this._load(); this._newGuest(d); this._save(d); this._emit(d); }

  async loadPlayer(uid) { await wait(80); return this._load().players[uid] || null; }
  async savePlayer(uid, data) { await wait(60); const d = this._load(); d.players[uid] = data; this._save(d); }
  async getScore(uid) { return this._load().board[uid] || null; }
  async putScore(uid, e) { const d = this._load(); d.board[uid] = e; this._save(d); }
  async top(n) {
    await wait(200);
    const b = this._load().board;
    return Object.entries(b).map(([uid, e]) => ({ uid, ...e })).sort((a, c) => c.best - a.best).slice(0, n);
  }
  async rankOf(best) { return Object.values(this._load().board).filter((e) => e.best > best).length + 1; }
}

// ======================= Camada usada pelo jogo =======================

export class Cloud {
  constructor(game) {
    this.game = game;
    this.user = null;
    this.mode = 'off';
    this.status = '';
    this.listeners = new Set();
    this._timer = 0;
    this._syncing = false;
  }

  get ready() { return !!this.user && this.mode !== 'offline'; }
  get isDemo() { return this.mode === 'demo'; }
  get isDev() { return !!(this.user && this.user.dev); }
  onChange(fn) { this.listeners.add(fn); }
  _emit() { for (const fn of this.listeners) fn(this); }

  async init(params) {
    const hasCfg = !!FIREBASE_CONFIG.apiKey;
    this.backend = hasCfg && params.get('cloud') !== 'demo' ? new FirebaseBackend(FIREBASE_CONFIG) : new DemoBackend();
    this.mode = this.backend.mode;
    try {
      await this.backend.init((u) => this._onUser(u));
    } catch (e) {
      console.warn('[cloud] indisponível', e);
      // Fora do app (ex.: protótipo no navegador que bloqueia rede externa): cai para a demonstração local
      const native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
      if (this.backend.mode === 'firebase' && !native) {
        try { this.backend = new DemoBackend(); this.mode = 'demo'; await this.backend.init((u) => this._onUser(u)); return; } catch { /* segue offline */ }
      }
      this.mode = 'offline';
      this.status = AUTH_ERRORS.offline;
      this._emit();
    }
  }

  // Troca de usuário (início, login, criar conta, sair): decide entre o save local e o da nuvem.
  async _onUser(u) {
    const prev = this.user;
    u.dev = !u.guest && await this.backend.isDev(u.uid).catch(() => false);
    if (!u.dev && this.game.devOff) this.game.devOff();   // antes de carregar o save de outra conta
    this.user = u;
    this._emit();
    if (prev && prev.uid === u.uid) return;          // vinculou conta: mesmo id, só mudou o tipo
    await this._sync();
  }

  async _sync() {
    if (!this.user || this._syncing) return;
    this._syncing = true;
    const g = this.game, uid = this.user.uid;
    try {
      const remote = await this.backend.loadPlayer(uid);
      const local = g.meta;
      const mine = !local.owner || local.owner === uid;   // save local é deste usuário (ou nunca teve dono)
      if (remote && remote.save && (!mine || (remote.rev || 0) > (local.rev || 0))) {
        const data = JSON.parse(remote.save);
        data.owner = uid; data.nick = remote.nick || data.nick;
        g.replaceMeta(data);
      } else if (!mine) {
        g.replaceMeta({ owner: uid });                    // conta nova neste aparelho: começa do zero
      }
      if (!g.meta.nick) g.meta.nick = defaultNick(g.meta.selected);
      g.meta.owner = uid;
      g.save();                                         // grava local (com dono) e agenda o envio
      await this.flush();
      if (g.meta.bestTime > 0) await this.submitScore();
      g.applyDev();
      this.status = '';
    } catch (e) {
      console.warn('[cloud] sincronização', e);
      this.status = AUTH_ERRORS.offline;
    }
    this._syncing = false;
    this._emit();
  }

  // Chamado a cada saveGame(): junta várias gravações seguidas em uma só.
  queueSave() {
    if (!this.ready) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._push().catch((e) => console.warn('[cloud] save', e)), SAVE_DEBOUNCE);
  }

  async flush() { if (this._timer) { clearTimeout(this._timer); this._timer = 0; await this._push(); } }

  async _push() {
    if (!this.ready) return;
    const m = this.game.meta;
    if (m.owner && m.owner !== this.user.uid) return;
    await this.backend.savePlayer(this.user.uid, { save: JSON.stringify(m), rev: m.rev || 0, nick: m.nick || '' });
  }

  // Ranking: guarda só o melhor tempo de cada jogador (as regras do Firestore também impedem piorar).
  async submitScore(run) {
    if (!this.ready || this.isDev) return false;          // conta DEV joga sem limites: fica fora do ranking
    const m = this.game.meta, uid = this.user.uid;
    try {
      const cur = await this.backend.getScore(uid);
      const best = Math.floor(m.bestTime);
      if (cur && cur.best >= best && cur.nick === m.nick) return false;
      const entry = cur && cur.best >= best
        ? { nick: m.nick, best: cur.best, char: cur.char, kills: cur.kills }
        : { nick: m.nick, best, char: (run && run.char) || m.selected, kills: (run && run.kills) || (cur && cur.kills) || 0 };
      await this.backend.putScore(uid, entry);
      return entry.best === best;
    } catch (e) { console.warn('[cloud] ranking', e); return false; }
  }

  async leaderboard(n = 50) {
    const list = await this.backend.top(n);
    const me = this.user && this.user.uid;
    let rank = null;
    const best = Math.floor(this.game.meta.bestTime);
    if (best > 0) rank = list.findIndex((e) => e.uid === me) + 1 || await this.backend.rankOf(best);
    return { list, me, rank, best };
  }

  async setNick(nick) {
    nick = (nick || '').trim().replace(/\s+/g, ' ');
    if (!NICK_RE.test(nick)) throw { code: 'bad-nick' };
    this.game.meta.nick = nick;
    this.game.save();
    await this._push();
    if (this.game.meta.bestTime > 0) await this.submitScore();
    this._emit();
  }

  // Ações de conta (a UI mostra os erros com errorText)
  async google() { await this.game.flushSave(); return this.backend.google(); }
  async signUp(email, pass) { await this.game.flushSave(); return this.backend.signUp((email || '').trim(), pass); }
  // Aceita e-mail ou nome de usuário (ex.: renanmaster → renanmaster@nekog.dev)
  async signIn(id, pass) {
    await this.game.flushSave();
    id = (id || '').trim();
    if (id && !id.includes('@')) id = id.toLowerCase() + '@nekog.dev';
    return this.backend.signIn(id, pass);
  }
  reset(email) { return this.backend.reset((email || '').trim()); }
  async signOut() { await this.flush().catch(() => {}); return this.backend.signOut(); }

  label() {
    if (this.mode === 'offline') return 'OFFLINE';
    if (!this.user) return '…';
    if (this.isDev) return `DEV · ${this.game.meta.nick || 'MASTER'}`;
    return this.user.guest ? 'CONVIDADO' : (this.game.meta.nick || 'CONTA');
  }
}

export function defaultNick(charId = 'gato') {
  const base = { gato: 'Gato', guaxinim: 'Guaxinim', pug: 'Pug' }[charId] || 'Jogador';
  return `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
}
