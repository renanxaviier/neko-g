// Modo história da Jornada (estilo Grand Chase): cada mapa do 1º ciclo é um capítulo com 3 cenas de diálogo:
//   intro (ao entrar no mapa) · boss (antes da fase do chefe) · outro (depois de vencer o chefe).
// História aprovada pelo produtor em 08/11/2026 (docs/historia.md). Roteiro completo: docs/roteiro.md.
//
// Falas: [quem, texto]. Quem fala:
//   'hero'  = o personagem escolhido · 'radio' = quem guia pelo rádio (Guaxinim; se o herói for o Guaxinim, o Macaco)
//   'ally'  = alguém do bando que não é o herói nem o rádio · 'sinal' = o vilão (holograma) · 'boss' = o chefe do mapa
//   'narr'  = narração (sem retrato)
// No texto: {hero}, {radio}, {ally}, {boss} viram os nomes.

export const STORY_SECTOR_BOSS = {   // chefe de cada capítulo no 1º ciclo (null = chefe aquático sorteado)
  distrito: 'polvo', coast: 'quimera', favelas: 'sentinela', porto: 'tita', deep: null, fabrica: 'rainha',
  subway: 'polvo', genelab: 'quimera', mall: 'sentinela', casino: 'rainha', cage: 'tita', jungle: 'trex', torre: 'dragao',
};

export const STORY = {
  distrito: {
    title: 'O Sinal',
    intro: [
      ['narr', 'Distrito Neon. Três dias depois do Sinal.'],
      ['radio', '{hero}, tá me ouvindo? Aqui é o {radio}. O Sinal saiu do topo da Torre e reescreveu todo chip da cidade.'],
      ['hero', 'Os drones do lixo tentaram me morder no café da manhã. Já percebi.'],
      ['radio', 'Seus implantes de sucata são velhos demais pro Sinal ler. Por isso você ainda pensa por conta própria.'],
      ['radio', 'Cada máquina que cai solta uma G Batty. Seus implantes absorvem a carga. Bora subir até a Torre.'],
    ],
    boss: [
      ['sinal', 'Anomalia detectada: {hero}. Chips de ferro-velho. Ilegível.'],
      ['sinal', '{boss}, recicle isso.'],
      ['boss', 'BZZT… TENTÁCULOS… ONLINE.'],
    ],
    outro: [
      ['radio', 'O Polvo caiu! E o Sinal falou com você. Agora ele sabe que a gente existe.'],
      ['hero', 'Ótimo. Que ele fique com medo.'],
      ['radio', 'Próxima parada: a orla. O Sinal usa as antenas da Cyber-Coast pra espalhar a ordem.'],
    ],
  },
  coast: {
    title: 'Antenas da Orla',
    intro: [
      ['narr', 'Cyber-Coast. Até as ondas brilham em código.'],
      ['radio', 'As antenas da orla repetem o Sinal pra metade da cidade. Derruba o que estiver guardando elas.'],
      ['hero', 'Praia, sol artificial e caranguejo-robô. Férias perfeitas.'],
    ],
    boss: [
      ['sinal', 'Você quebrou um polvo. Eu tenho milhares.'],
      ['sinal', '{boss}, mostre a {hero} o que acontece com quem se recusa a atualizar.'],
      ['boss', 'GRRRAAH… TRÊS CABEÇAS… UMA ORDEM.'],
    ],
    outro: [
      ['radio', 'Antena fora do ar! Metade do Distrito acordou do transe.'],
      ['ally', 'Eu vi! Os drones do meu bairro pararam do nada. Tô indo te encontrar.'],
      ['radio', 'O próximo repetidor fica nas Favelas de Dados. Lá o Sinal se esconde no meio do lixo digital.'],
    ],
  },
  favelas: {
    title: 'Servidores Piratas',
    intro: [
      ['narr', 'Favelas de Dados. Fios por todo lado, e cada fio carrega um pedaço do Sinal.'],
      ['radio', 'Aqui cada barraco tem um servidor pirata. O Sinal sequestrou todos.'],
      ['hero', 'Então a gente devolve. Um por um.'],
    ],
    boss: [
      ['sinal', '{boss}, isole o setor. Ninguém entra, ninguém sai, ninguém pensa.'],
      ['boss', 'VARREDURA… ALVO NÃO CATALOGADO.'],
      ['hero', 'Cataloga isso aqui, então.'],
    ],
    outro: [
      ['radio', 'Servidores livres! O pessoal das Favelas tá mandando G Batty pra gente.'],
      ['radio', 'E achei uma coisa: o Sinal chega na Torre por um cabo que vem do porto e desce pro mar.'],
      ['hero', 'Então a gente segue o cabo.'],
    ],
  },
  porto: {
    title: 'O Cabo',
    intro: [
      ['narr', 'Porto Automatizado. Guindastes que nunca dormem.'],
      ['radio', 'Os contêineres estão cheios de robôs novinhos, esperando ativação.'],
      ['hero', 'Ninguém ativa nada hoje.'],
    ],
    boss: [
      ['sinal', 'Você segue o cabo. Que previsível.'],
      ['sinal', '{boss}, carga máxima.'],
      ['boss', 'SOBRECARGA… CEM… POR… CENTO.'],
    ],
    outro: [
      ['radio', 'O cabo desce pro fundo do mar. A única entrada é pela água.'],
      ['hero', 'Eu não nado muito bem.'],
      ['radio', 'Hoje você nada.'],
    ],
  },
  deep: {
    title: 'Abismo',
    intro: [
      ['narr', 'Cyber Deep. Sem luz do sol, só o brilho do cabo.'],
      ['radio', 'Debaixo d’água tudo fica lento, até você. Cuidado com os tubarões.'],
      ['hero', 'Tubarões robôs. Claro que sim.'],
    ],
    boss: [
      ['sinal', 'Aqui embaixo ninguém ouve você, {hero}.'],
      ['boss', 'PROFUNDIDADE… ZERO… PIEDADE.'],
    ],
    outro: [
      ['radio', 'Cabo cortado! O Sinal perdeu força… mas não sumiu.'],
      ['radio', 'Ele tem uma fábrica produzindo corpos novos sem parar.'],
      ['hero', 'Então a gente desliga a linha de produção.'],
    ],
  },
  fabrica: {
    title: 'Linha de Montagem',
    intro: [
      ['narr', 'Fábrica de Robôs. A esteira entrega um soldado novo a cada segundo.'],
      ['radio', 'A Rainha da Sucata manda aqui. Ela monta robôs com o que sobra dos que você derruba.'],
      ['hero', 'Então eu sou o fornecedor dela. Que vergonha.'],
    ],
    boss: [
      ['boss', 'Você me deu tanta peça boa… agora vou fazer uma de você.'],
      ['sinal', 'Rainha, não deixe nem os parafusos.'],
    ],
    outro: [
      ['radio', 'Linha de produção parada! Sem reforços por um bom tempo.'],
      ['radio', 'A Torre recebe ordens pelo metrô de dados. É o caminho mais rápido até o centro.'],
    ],
  },
  subway: {
    title: 'Backup',
    intro: [
      ['narr', 'Data Subway. Os trens não levam gente; levam pacotes de dados.'],
      ['hero', 'Esse túnel está rosa demais.'],
      ['radio', 'É ele. O Polvo voltou, reconstruído. Mais braços, mais raiva.'],
    ],
    boss: [
      ['boss', 'POLVO… VERSÃO… DOIS… PONTO… ZERO.'],
      ['sinal', 'Eu sempre guardo um backup, {hero}. Igual a você.'],
    ],
    outro: [
      ['hero', 'Ele tem backup… Então o Sinal também guarda cópias.'],
      ['radio', 'No GeneLab. Lá eles clonam tudo. Se existe cópia do Sinal em algum lugar, é lá.'],
    ],
  },
  genelab: {
    title: 'Clones',
    intro: [
      ['narr', 'GeneLab. Tubos de vidro, líquido verde e um silêncio estranho.'],
      ['radio', 'Cuidado: aqui os inimigos são clones melhorados dos que você já venceu.'],
      ['hero', 'Então eu já sei como eles caem.'],
    ],
    boss: [
      ['sinal', 'Lembra da Quimera? Eu melhorei ela. Agora são quatro cabeças. Ou cinco. Perdi a conta.'],
      ['boss', 'RRRAAAAH!'],
    ],
    outro: [
      ['radio', 'Achei os arquivos! O Sinal tem um núcleo, um só, no topo da Torre. As cópias dependem dele.'],
      ['hero', 'Derrubou o núcleo, acabou o Sinal.'],
      ['radio', 'Só que o caminho passa pelo Shopping, pelo Cassino, pela Arena e pela Selva. Ele fechou tudo.'],
    ],
  },
  mall: {
    title: 'Liquidação',
    intro: [
      ['narr', 'Neon Mall. Hologramas oferecendo descontos para clientes que não existem mais.'],
      ['hero', '"Leve dois robôs, pague um." Não, obrigado.'],
      ['radio', 'A segurança do shopping virou do Sinal. Tem câmera em todo canto.'],
    ],
    boss: [
      ['boss', 'CLIENTE SEM CADASTRO. REMOÇÃO AUTORIZADA.'],
      ['sinal', 'Sentinela, desta vez sem erros.'],
    ],
    outro: [
      ['radio', 'Shopping limpo! E as câmeras agora são nossas. Dá pra ver a Torre daqui.'],
      ['radio', 'Próximo: o Cyber Casino. Lá o Sinal aposta contra você.'],
    ],
  },
  casino: {
    title: 'A Banca',
    intro: [
      ['narr', 'Cyber Casino. As máquinas sempre ganham. Até hoje.'],
      ['sinal', 'Façam suas apostas. Eu aposto tudo contra {hero}.'],
      ['hero', 'Aposta aceita.'],
    ],
    boss: [
      ['boss', 'A Rainha voltou, querido. E dessa vez a banca sou eu.'],
    ],
    outro: [
      ['radio', 'Jackpot! O cassino era um gerador de energia da Torre. Desligado!'],
      ['radio', 'Falta a Arena. Dizem que o campeão de lá nunca perdeu.'],
    ],
  },
  cage: {
    title: 'O Campeão',
    intro: [
      ['narr', 'The Cage. Uma arena clandestina, e a plateia é toda de robôs.'],
      ['sinal', 'Bem-vindo à minha arena. Hoje o espetáculo é você.'],
      ['hero', 'Então caprichem nos aplausos.'],
    ],
    boss: [
      ['narr', 'No centro da jaula, o campeão invicto se levanta.'],
      ['boss', 'TITÃ… INVICTO… CEM… VITÓRIAS.'],
      ['hero', 'Cem vitórias e uma derrota, então.'],
    ],
    outro: [
      ['radio', 'A plateia desligou! Sem o Sinal, os robôs nem sabem por que estavam aqui.'],
      ['radio', 'Última barreira antes da Torre: a Glow Jungle. O Sinal plantou algo antigo lá.'],
    ],
  },
  jungle: {
    title: 'Extinção',
    intro: [
      ['narr', 'Glow Jungle. Plantas que brilham e um chão que treme.'],
      ['hero', 'Isso foi um passo?'],
      ['radio', 'Foi. O Sinal reconstruiu um bicho que não anda pela Terra há milhões de anos.'],
    ],
    boss: [
      ['boss', 'RROOOOAAARRR!'],
      ['sinal', 'Extinção, {hero}. É o que acontece com quem não se adapta.'],
    ],
    outro: [
      ['hero', 'Até o dinossauro caiu. Agora só falta você, Sinal.'],
      ['sinal', 'Suba, então. Estou esperando no 100º andar.'],
      ['ally', 'O bando inteiro tá aqui embaixo. Vai! A gente segura a horda.'],
    ],
  },
  torre: {
    title: 'O Grande Glitch',
    intro: [
      ['narr', 'Torre Corporativa. Cem andares de vidro e um brilho no topo.'],
      ['radio', 'Daqui pra cima é com você. Seus implantes estão no limite. Não desperdiça o Backup.'],
      ['hero', 'Cheguei longe demais pra precisar dele.'],
    ],
    boss: [
      ['sinal', 'Você chegou. Ninguém nunca chegou.'],
      ['sinal', 'Eu não sou um programa, {hero}. Sou a cidade inteira pensando junto. Sou O GRANDE GLITCH.'],
      ['boss', 'VOCÊ… É… UM… ERRO… DE… ARREDONDAMENTO.'],
      ['hero', 'Então me arredonda pra baixo.'],
    ],
    outro: [
      ['narr', 'O núcleo apaga. Por um segundo, a cidade inteira fica em silêncio.'],
      ['radio', 'Conseguiu! Os drones pararam! As luzes estão voltando ao normal!'],
      ['hero', 'Missão cumprida, bando. Alguém tem sardinha?'],
      ['sinal', '…reiniciando… sinal… 1%…'],
      ['narr', 'Muito longe dali, uma antena volta a piscar.'],
    ],
  },
};

// Início do 2º ciclo (mapa 14): o Sinal reiniciou
export const STORY_CYCLE = {
  title: 'Reinício',
  intro: [
    ['narr', 'Semanas depois…'],
    ['radio', '{hero}, más notícias. O Sinal reiniciou, mais forte. A cidade inteira voltou à horda.'],
    ['hero', 'Então a gente sobe de novo. E mais rápido.'],
  ],
};

import { BOSS_ORDER } from './boss.js';

// Chefe de um mapa da Jornada: no 1º ciclo, o do capítulo; depois, a ordem dos chefões. null = aquático (sorteado)
export function mapBossId(map) {
  if (map.cycle === 0 && map.biome.id in STORY_SECTOR_BOSS) return STORY_SECTOR_BOSS[map.biome.id];
  return map.biome.medium === 'water' ? null : BOSS_ORDER[map.n % BOSS_ORDER.length];
}

// Cenas de um mapa: { title, intro, boss, outro } (só no 1º ciclo; no começo do 2º, a cena do reinício)
export function storyOf(map) {
  if (!map) return null;
  if (map.cycle === 0) return STORY[map.biome.id] || null;
  if (map.n === 13) return STORY_CYCLE;
  return null;
}
