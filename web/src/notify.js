// Central de notificações (v0.19): em vez de abrir janelas sozinho, o jogo junta os avisos num sino na tela inicial.
// Os avisos são calculados na hora a partir do save (somem sozinhos quando o jogador age); só "Novidades" é marcado como visto.

import { CHARS, CHAR_ORDER } from './chars.js';
import { WEAPONS, VERSION } from './config.js';
import { UPGRADES, upgradeCost } from './meta.js';
import { checkinState, hasClaimable, CHECKIN_REWARDS } from './missions.js';
import { pointsLeft } from './talents.js';

// Novidades da versão atual (aparece uma vez por versão)
export const CHANGELOG = [
  'Sino de notificações: nada mais abre sozinho ao entrar',
  'Ataque automático e opções de botões (tamanho, transparência, canhoto)',
  'Câmera mais aberta, tutorial e botão de Feedback',
  'Coelho, Macaco e Tatu jogáveis; 3 chefões novos',
  'Jornada com estrelas, modificadores, mapa e talentos',
];

// Cada aviso: { id, icon, title, sub, color, action, arg }. action é tratada pela interface.
export function notifications(meta) {
  const out = [];
  const ck = checkinState(meta);
  if (ck.canClaim) {
    out.push({ id: 'checkin', icon: '🎁', color: '#ffd84d', title: 'Recompensa diária disponível',
      sub: `Dia ${ck.day} de 7 · ◆ ${CHECKIN_REWARDS[ck.day - 1]} Cyber-Moedas`, action: 'checkin' });
  }
  if (hasClaimable(meta)) out.push({ id: 'missions', icon: '◆', color: '#c04dff', title: 'Missão concluída', sub: 'Resgate a recompensa em Missões', action: 'missions' });
  if (meta.seenVer !== VERSION) out.push({ id: 'news', icon: '✨', color: '#5ef0ff', title: `Novidades da v${VERSION}`, sub: 'Toque para marcar como lido', action: 'news' });
  if ((meta.jMax || 0) > (meta.seenJ || 0)) {
    out.push({ id: 'map', icon: '🗺', color: '#4dffa6', title: `Mapa ${meta.jMax + 1} liberado`, sub: 'Veja o caminho da Jornada', action: 'maps' });
  }
  for (const id of CHAR_ORDER) {
    if (!meta.chars.includes(id)) continue;
    const pts = pointsLeft(meta, id);
    if (pts > 0) out.push({ id: 'tal-' + id, icon: '★', color: CHARS[id].color, title: `${CHARS[id].name}: ${pts} ponto${pts > 1 ? 's' : ''} de talento`, sub: 'Gaste na árvore de talentos', action: 'talents', arg: id });
  }
  const sel = CHARS[meta.selected];
  if (sel && sel.weapon) {
    const lvl = (meta.weapons || {})[sel.weapon] || 0, cost = WEAPONS.costs[lvl];
    if (cost !== undefined && meta.scrap >= cost) {
      out.push({ id: 'weapon', icon: WEAPONS[sel.weapon].icon, color: WEAPONS[sel.weapon].color, title: `${lvl ? 'Evolua' : 'Compre'}: ${WEAPONS[sel.weapon].name}`, sub: `⚙ ${cost} · arma exclusiva do ${sel.name}`, action: 'char', arg: sel.id });
    }
  }
  const cheap = UPGRADES.map((u) => upgradeCost((meta.upgrades || {})[u.id] || 0)).filter((c) => c !== null);
  if (cheap.length && meta.scrap >= Math.min(...cheap)) out.push({ id: 'lab', icon: '⚙', color: '#ffd84d', title: 'Upgrade disponível no Laboratório', sub: `Você tem ⚙ ${meta.scrap} de Sucata`, action: 'hideout' });
  const buy = CHAR_ORDER.find((id) => !meta.chars.includes(id) && meta.cyberCoins >= CHARS[id].price);
  if (buy) out.push({ id: 'buychar', icon: '🐾', color: CHARS[buy].color, title: `Dá para liberar o ${CHARS[buy].name}`, sub: `◆ ${CHARS[buy].price} Cyber-Moedas`, action: 'char', arg: buy });
  return out;
}
