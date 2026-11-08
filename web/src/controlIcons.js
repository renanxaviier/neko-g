// Ícones dos botões de toque (SVG vetorial, traço neon). Cada desenho é feito duas vezes:
// uma camada larga e transparente (brilho) e uma fina por cima (núcleo), sem filtros caros.

const P = {
  // Direcionais: seta dupla
  left: '<path d="M27 10 L13 24 L27 38"/><path d="M37 14 L27 24 L37 34" class="t"/>',
  right: '<path d="M21 10 L35 24 L21 38"/><path d="M11 14 L21 24 L11 34" class="t"/>',
  // Pulo: pata com seta para cima
  jump: '<path d="M16 12 L24 5 L32 12"/><ellipse cx="24" cy="34" rx="8" ry="6.5" class="f"/>'
      + '<circle cx="13" cy="25" r="3.2" class="f"/><circle cx="19.5" cy="19.5" r="3.2" class="f"/>'
      + '<circle cx="28.5" cy="19.5" r="3.2" class="f"/><circle cx="35" cy="25" r="3.2" class="f"/>',
  // Planar (Guaxinim no ar): asa-delta + seta suave para baixo
  glide: '<path d="M5 22 Q24 8 43 22 Q33 18 24 25 Q15 18 5 22 Z" class="f"/><path d="M24 29 V40 M19 35 L24 40 L29 35" class="t"/>',
  // Dash: raio + linhas de velocidade
  dash: '<path d="M28 4 L14 26 H24 L20 44 L36 20 H26 Z" class="f"/><path d="M3 17 H9 M1 25 H8 M4 33 H10" class="t"/>',
  // Queda pesada (Pug no ar): seta para baixo batendo no chão
  slam: '<path d="M24 4 V28 M15 20 L24 29 L33 20"/><path d="M8 40 H40"/><path d="M11 35 L6 30 M37 35 L42 30 M24 36 V33" class="t"/>',
  // Ataques por personagem
  gato: '<path d="M11 9 Q20 21 15 40"/><path d="M21 6 Q30 20 25 42"/><path d="M31 9 Q40 21 35 40"/>',
  guaxinim: '<path d="M11 37 L35 13 L41 7 L39 15 L15 39 Z" class="f"/><path d="M7 33 L15 41 M9 41 L5 45"/><path d="M27 15 h4 M22 20 v4 M33 25 h3" class="t"/>',
  pug: '<path d="M10 17 h18 a5 5 0 0 1 5 5 v9 a8 8 0 0 1 -8 8 h-8 a7 7 0 0 1 -7 -7 z" class="f"/>'
     + '<path d="M16 17 v6 M22 17 v6 M28 18 v5" class="k"/><path d="M38 14 L44 10 M39 24 H46 M38 34 L44 38" class="t"/>',
};

export function iconSvg(name) {
  const d = P[name] || '';
  return `<svg viewBox="0 0 48 48" class="ic" aria-hidden="true"><g class="gl">${d}</g><g class="co">${d}</g></svg>`;
}

export const ATTACK_LABEL = { gato: 'GARRAS', guaxinim: 'LÂMINA', pug: 'SOCO' };
// Cor do botão de ataque por personagem (o rosa fica reservado ao Pulo)
export const ATTACK_COLOR = { gato: '#ffd84d', guaxinim: '#4dffa6', pug: '#ff9a3c' };
