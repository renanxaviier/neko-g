import { STORY, STORY_CYCLE, STORY_SECTOR_BOSS } from './story.mjs';
import { BOSS_TYPES } from './boss.mjs';
const NAMES = { distrito: 'Distrito Neon', coast: 'Cyber-Coast', favelas: 'Favelas de Dados', porto: 'Porto Automatizado', deep: 'Cyber Deep', fabrica: 'Fábrica de Robôs', subway: 'Data Subway', genelab: 'GeneLab', mall: 'Neon Mall', casino: 'Cyber Casino', cage: 'The Cage', jungle: 'Glow Jungle', torre: 'Torre Corporativa' };
const WHO = { hero: '**{herói}**', radio: '**{rádio}**', ally: '**{aliado}**', sinal: '**O Sinal**', boss: '**{chefe}**', narr: '_Narração_' };
let out = `# Roteiro do modo história (Jornada, 1º ciclo) — aprovado em 08/11/2026\n\n> Gerado de \`web/src/story.js\` (a fonte é o código: para mudar uma fala, edite lá).\n> {herói} = personagem escolhido · {rádio} = Guaxinim (ou Macaco, se o herói for o Guaxinim) · {aliado} = alguém do bando · {chefe} = chefe do capítulo.\n> Cada cena aparece uma vez; no Mapa da Jornada, o botão **📜 REVER** mostra de novo as cenas já vistas.\n\n`;
let i = 1;
for (const [id, S] of Object.entries(STORY)) {
  const b = STORY_SECTOR_BOSS[id];
  out += `## Capítulo ${i++} · ${NAMES[id]} — "${S.title}"\nChefe: ${b ? BOSS_TYPES[b].name : 'chefe aquático (Mecha-Povoador ou O Grande Glitch-serpente, sorteado)'}\n\n`;
  for (const [k, lbl] of [['intro', 'Abertura (ao entrar no mapa)'], ['boss', 'Antes do chefe'], ['outro', 'Depois da vitória']]) {
    out += `**${lbl}**\n`;
    for (const [w, t] of S[k]) out += `- ${WHO[w]}: ${t.replace(/\{hero\}/g, '{herói}').replace(/\{radio\}/g, '{rádio}').replace(/\{ally\}/g, '{aliado}').replace(/\{boss\}/g, '{chefe}')}\n`;
    out += '\n';
  }
}
out += `## Início do 2º ciclo (mapa 14) — "${STORY_CYCLE.title}"\n`;
for (const [w, t] of STORY_CYCLE.intro) out += `- ${WHO[w]}: ${t.replace(/\{hero\}/g, '{herói}').replace(/\{radio\}/g, '{rádio}')}\n`;
process.stdout.write(out);
