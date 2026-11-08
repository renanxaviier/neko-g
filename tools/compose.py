"""Trilhas do Neko G feitas por código (sintetizador offline em numpy) → web/assets/music/*.mp3

Cada faixa é uma lista de padrões (acordes, baixo, arpejo, bateria, melodia) renderizada em 44,1 kHz,
com reverb/eco simples e mixada. A introdução toca uma vez; o jogo repete de loop_start até o fim.
Uso: python3 -I tools/compose.py [faixa]      (faixas: deep, boss_deep)
"""
import json, os, subprocess, sys
import numpy as np
from scipy.signal import lfilter, butter

SR = 44100
OUT = '/home/claude/web/assets/music/'
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(name):                      # 'D3' → 50
    p, o = (name[:2], name[2:]) if len(name) > 2 and name[1] in '#b' else (name[:1], name[1:])
    return 12 * (int(o) + 1) + NOTE[p]


# ---------------- osciladores ----------------
def env(L, a, d, s, r, sus_len):
    """ADSR em amostras; sus_len = duração da nota (antes do release)."""
    t = np.arange(L) / SR
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    dec = (t >= a) & (t < a + d)
    e = np.where(dec, 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where(t >= a + d, s, e)
    rel = t >= sus_len
    e = np.where(rel, s * np.exp(-(t - sus_len) / max(r, 1e-4) * 4), e) if s > 0 else e
    return e


def saw(f, L, bright=1.0, decay=0.0, nh=None, phase=0.0):
    """Dente-de-serra aditiva (sem aliasing); bright/decay controlam o 'filtro' que fecha com o tempo."""
    t = np.arange(L) / SR
    nh = nh or max(1, min(40, int(SR / 2.2 / f)))
    out = np.zeros(L)
    for k in range(1, nh + 1):
        amp = (1 / k) * np.exp(-(k - 1) * (0.35 / bright + decay * t))
        if amp.max() < 2e-3: break
        out += amp * np.sin(2 * np.pi * k * f * t + phase * k)
    return out


def square(f, L, bright=1.0, decay=0.0):
    t = np.arange(L) / SR
    nh = max(1, min(30, int(SR / 2.2 / f)))
    out = np.zeros(L)
    for k in range(1, nh + 1, 2):
        amp = (1 / k) * np.exp(-(k - 1) * (0.3 / bright + decay * t))
        if amp.max() < 2e-3: break
        out += amp * np.sin(2 * np.pi * k * f * t)
    return out


def sine(f, L, vib=0.0, vib_rate=5.0):
    t = np.arange(L) / SR
    ph = 2 * np.pi * f * t + (vib * f / vib_rate) * (1 - np.cos(2 * np.pi * vib_rate * t)) * (t > 0.25)
    return np.sin(ph)


def lowpass(x, fc, order=2):
    b, a = butter(order, min(0.99, fc / (SR / 2)))
    return lfilter(b, a, x)


def highpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), btype='high')
    return lfilter(b, a, x)


# ---------------- instrumentos ----------------
def pad(freqs, L, sus):
    out = np.zeros(L)
    for f in freqs:
        for det, ph in ((-0.11, 0.0), (0.0, 1.3), (0.12, 2.1)):
            out += saw(f * 2 ** (det / 12), L, bright=0.55, phase=ph)
    out = lowpass(out, 1900)
    return out * env(L, 0.9, 0.5, 0.8, 1.2, sus) * 0.08


def pluck(f, L, sus):
    x = 0.6 * saw(f, L, bright=1.6, decay=14) + 0.4 * square(f * 2, L, bright=1.0, decay=18)
    return x * env(L, 0.004, 0.18, 0.15, 0.12, sus) * 0.22


def bass(f, L, sus):
    x = 0.8 * np.sin(2 * np.pi * f * np.arange(L) / SR) + 0.5 * lowpass(saw(f, L, bright=0.9, decay=6), 700)
    return x * env(L, 0.006, 0.12, 0.6, 0.06, sus) * 0.34


def lead(f, L, sus):
    x = 0.75 * sine(f, L, vib=0.006, vib_rate=5.2) + 0.25 * lowpass(saw(f, L, bright=0.8), 2600)
    return x * env(L, 0.03, 0.2, 0.7, 0.35, sus) * 0.3


def bell(f, L, sus):                     # sino de vidro (FM simples) — brilho "submarino"
    t = np.arange(L) / SR
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t * 6)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 2.4) * 0.12


def kick(L):
    t = np.arange(L) / SR
    f = 46 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7.5) * 0.9 + rng.normal(0, 1, L) * np.exp(-t * 180) * 0.08


def snare(L):
    t = np.arange(L) / SR
    nz = highpass(rng.normal(0, 1, L), 1400) * np.exp(-t * 16)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 22)
    return (nz * 0.35 + tone * 0.35)


def hat(L, open_=False):
    t = np.arange(L) / SR
    nz = highpass(rng.normal(0, 1, L), 7000)
    return nz * np.exp(-t * (14 if open_ else 55)) * 0.055


# ---------------- efeitos ----------------
def comb(x, D, g):
    a = np.zeros(D + 1); a[0] = 1; a[D] = -g
    return lfilter([1], a, x)


def allpass(x, D, g):
    b = np.zeros(D + 1); b[0] = -g; b[D] = 1
    a = np.zeros(D + 1); a[0] = 1; a[D] = -g
    return lfilter(b, a, x)


def reverb(x, size=1.0, damp=3500):
    y = sum(comb(x, int(d * size), g) for d, g in ((1557, 0.84), (1617, 0.83), (1491, 0.85), (1422, 0.84))) / 4
    y = allpass(allpass(y, 225, 0.5), 556, 0.5)
    return lowpass(y, damp)


def echo(x, t, fb=0.4, damp=3000):
    D = int(t * SR)
    a = np.zeros(D + 1); a[0] = 1; a[D] = -fb
    return lowpass(lfilter([1], a, x), damp) - x       # só as repetições


# ---------------- sequenciador ----------------
class Track:
    def __init__(self, bpm, bars):
        self.bpm = bpm
        self.beat = 60 / bpm
        self.bars = bars
        self.L = int(SR * self.beat * 4 * bars) + SR * 3
        self.bus = {k: np.zeros(self.L) for k in ('pad', 'pluck', 'bass', 'lead', 'bell', 'drums')}

    def at(self, bar, beat=0.0):
        return int(SR * self.beat * (bar * 4 + beat))

    def put(self, bus, x, start):
        end = min(self.L, start + len(x))
        self.bus[bus][start:end] += x[:end - start]

    def note(self, bus, inst, f, bar, beat, dur_beats, tail=1.0):
        sus = dur_beats * self.beat
        L = int(SR * (sus + tail))
        self.put(bus, inst(f, L, sus), self.at(bar, beat))

    def drum(self, kind, bar, beat, open_=False):
        L = int(SR * (0.6 if kind != 'hat' else (0.35 if open_ else 0.08)))
        x = kick(L) if kind == 'kick' else snare(L) if kind == 'snare' else hat(L, open_)
        self.put('drums', x, self.at(bar, beat))


def chord_tones(root, kind):
    return [root, root + (3 if kind == 'm' else 4), root + 7, root + (10 if kind == 'm' else 11 if kind == 'M7' else 7) + (0 if kind in ('m', 'M7') else 5)]


# ======================= Faixa: CYBER DEEP =======================
def track_deep():
    """Abismo Cibernético: 96 BPM, Ré menor, clima de mergulho (pad largo, arpejo com eco, sinos de vidro).
    Estrutura: intro 4 compassos (toca uma vez) + loop de 32 (A 8 · B 8 · A' 8 · C 8)."""
    T = Track(96, 36)
    prog = [('D3', 'm'), ('Bb2', 'M7'), ('F3', 'M7'), ('C3', 'M')]          # i - VI - III - VII
    prog_c = [('G2', 'm'), ('Bb2', 'M7'), ('D3', 'm'), ('A2', 'M')]         # parte C: subdominante e volta pelo V
    arp_pat = [0, 2, 1, 3, 2, 1, 3, 2]                                      # índices nos tons do acorde, em colcheias

    for bar in range(36):
        sec = 'intro' if bar < 4 else 'A' if bar < 12 else 'B' if bar < 20 else 'A2' if bar < 28 else 'C'
        root, kind = (prog_c if sec == 'C' else prog)[bar % 4]
        r = n(root)
        tones = chord_tones(r, kind)
        # pad: acorde aberto uma oitava acima, troca a cada compasso
        T.put('pad', pad([midi(t + 12) for t in tones[:3]] + [midi(tones[3] + 12)], int(SR * (T.beat * 4 + 1.6)), T.beat * 4), T.at(bar))
        # arpejo em colcheias com eco pontilhado (entra cheio a partir de A)
        if sec != 'intro' or bar >= 2:
            for i, k in enumerate(arp_pat):
                oct_ = 24 if (sec in ('B', 'C') and i % 4 == 3) else 12
                T.note('pluck', pluck, midi(tones[k % 4] + oct_), bar, i * 0.5, 0.4, tail=0.4)
        # baixo: pulso em colcheias com a fundamental (síncope no fim do compasso)
        if sec != 'intro':
            for i in range(8):
                if sec == 'C' and i % 2: continue
                nn = r - 12 if i != 7 else r - 12 + 7
                T.note('bass', bass, midi(nn), bar, i * 0.5, 0.42, tail=0.15)
        # bateria: meio-tempo (caixa no 3), chimbal em colcheias; preenchimento a cada 8 compassos
        if sec != 'intro':
            T.drum('kick', bar, 0)
            if sec != 'C': T.drum('kick', bar, 2.5)
            T.drum('snare', bar, 2)
            for i in range(8): T.drum('hat', bar, i * 0.5, open_=(i == 7 and bar % 2))
            if bar % 8 == 3:
                for b in (3.25, 3.5, 3.75): T.drum('snare', bar, b)
        # sinos de vidro: notas soltas como bolhas de luz
        if bar % 2 == 0:
            T.note('bell', bell, midi(tones[2] + 24), bar, 1.5, 0.5, tail=1.6)
            T.note('bell', bell, midi(tones[1] + 36), bar, 3.0, 0.5, tail=1.6)

    # melodia (B e A2): motivo em Ré menor, frase pergunta-resposta
    mel = [  # (compasso relativo, tempo, nota, duração em tempos)
        (0, 0, 'A4', 1.5), (0, 1.5, 'F4', 0.5), (0, 2, 'G4', 1), (0, 3, 'A4', 1),
        (1, 0, 'D5', 2), (1, 2, 'C5', 1), (1, 3, 'A4', 1),
        (2, 0, 'F4', 1.5), (2, 1.5, 'A4', 0.5), (2, 2, 'C5', 1), (2, 3, 'Bb4', 1),
        (3, 0, 'A4', 3), (3, 3, 'G4', 1),
        (4, 0, 'A4', 1.5), (4, 1.5, 'F4', 0.5), (4, 2, 'G4', 1), (4, 3, 'A4', 1),
        (5, 0, 'D5', 1.5), (5, 1.5, 'E5', 0.5), (5, 2, 'F5', 2),
        (6, 0, 'E5', 1), (6, 1, 'D5', 1), (6, 2, 'C5', 1), (6, 3, 'E5', 1),
        (7, 0, 'D5', 4),
    ]
    for start in (12, 20):
        for b, bt, nm, du in mel:
            shift = 0 if start == 12 else 12 if b >= 4 else 0
            T.note('lead', lead, midi(n(nm) + (shift if start == 20 and b >= 6 else 0)), start + b, bt, du * 0.95, tail=0.6)

    return T, {'loop_start': T.beat * 4 * 4, 'loop_end': T.beat * 4 * 36}


def mix(T, water=True):
    b = T.bus
    if water: b['drums'] = lowpass(b['drums'], 7500)              # pratos abafados: clima submerso
    print('  rms', {k: round(float(np.sqrt(np.mean(v ** 2))), 4) for k, v in b.items()})
    dry = b['pad'] + b['pluck'] * 0.9 + b['bass'] + b['lead'] + b['bell'] + b['drums'] * 0.85
    wet = reverb(b['pad'] * 0.6 + b['pluck'] * 0.5 + b['lead'] * 0.6 + b['bell'] * 0.9 + b['drums'] * 0.15, size=1.15)
    dl = echo(b['pluck'] + b['lead'] * 0.6, T.beat * 0.75, fb=0.38)
    L = dry + wet * 0.55 + dl * 0.35
    # estéreo: eco e reverb abertos, um lado atrasado alguns ms
    R = dry + np.roll(wet, 331) * 0.55 + np.roll(dl, int(SR * 0.012)) * 0.35
    st = np.stack([L, R], 1)
    st = highpass(st.T, 28).T
    st /= np.max(np.abs(st)) / 0.89
    return st


def write(st, name, meta):
    raw = f'/tmp/{name}.f32'
    st.astype(np.float32).tofile(raw)
    out = f'{OUT}{name}.mp3'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', raw,
                    '-codec:a', 'libmp3lame', '-b:a', '128k', out], check=True)
    print(name, f'{len(st) / SR:.1f}s', os.path.getsize(out) // 1024, 'KB', json.dumps(meta))


TRACKS = {'deep': track_deep}

if __name__ == '__main__':
    for name in (sys.argv[1:] or TRACKS):
        T, meta = TRACKS[name]()
        st = mix(T)
        st = st[: int(SR * (meta['loop_end'] + 2.5))]
        write(st, name, meta)
