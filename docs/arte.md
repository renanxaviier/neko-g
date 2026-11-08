# Guia de Arte e Status dos Assets (v0.1)

> Arte conceitual recebida em `assets/concept/`:
> `personagens_jogaveis.jpg`, `inimigos_folha1.jpg`, `inimigos_folha2.jpg`, `inimigos_folha3.jpg` (2576×1438, JPG).

## 1. Estilo
- **Pixel art** com tema **cyberpunk neon**: animais com roupas e implantes tecnológicos, brilhos em ciano, magenta, verde e laranja sobre fundo escuro azul-marinho.
- Contorno escuro nos personagens e inimigos, o que ajuda na legibilidade.
- Personagens e inimigos desenhados olhando para a **direita** (a engine espelha para a esquerda).

## 2a. Sprites no jogo (07/11/2026)
- As folhas conceituais (JPG) são recortadas automaticamente por `tools/extract_sprites.py` (remove o fundo azul-marinho, separa os quadros) e montadas num atlas por `tools/build_atlas.py` → `web/assets/sprites/atlas.png` + `web/src/atlasData.js`.
- Já no jogo: **Gato** (parado, correndo, pulo, pulo duplo com jatos, queda, wall slide, dash, ataque, dano, morte) e os inimigos **Cyber-Rato, Esquilo (+ bolota), Drone Olho, Morcego, Scrap-Hound, Vespa e Urso**.
- Recortados e guardados para depois: Guaxinim, Pug e os demais inimigos das folhas.
- **Folha extra (`assets/concept/extras_efeitos_itens.jpg`, fundo preto)** — já no jogo: Cyber-Lobo, Panda de Guerra, Drone Voador (com quadro de destruição); golpes de garra (rosa, crescente ciano, corte diagonal), faíscas de impacto, shuriken-estrela, tiro de canhão e laser, explosão de pixels, destroços, fumaça, falha (glitch), emblema de Level Up; baterias em 4 níveis, moeda de Sucata (girando), Cyber-Moeda, cápsula de vida; caixa destrutível e caixa especial. Efeitos luminosos foram recortados com transparência pelo brilho (sem borda escura).
- **Ainda não usados:** plataformas (grade metálica e enferrujada) e os elementos de cenário dos biomas Cyber-Coast, Favelas de Dados e Porto Automatizado — ideais para a próxima etapa de biomas.
- O atlas é salvo em **WebP** (~670 KB, 3× menor que PNG).
- Limitações do recorte a partir de JPG: algumas bordas escuras somem, efeitos (rastros, faíscas) às vezes grudam no quadro, e o visor do Gato muda de cor entre folhas (ciano na folha 1, rosa nas folhas novas). Quando houver PNGs transparentes definitivos, basta trocar os arquivos e rodar o `build_atlas.py` de novo.

## 2. Situação das folhas recebidas
As folhas são ótimas como **arte conceitual e referência**, mas **ainda não estão prontas para entrar na engine**:

| Problema | Por que importa | O que precisa |
|---|---|---|
| Formato JPG | A compressão borra as bordas dos pixels e cria "sujeira" de cor | PNG |
| Fundo e textos embutidos | A engine precisa de fundo transparente e sem rótulos | Fundo transparente, sem textos |
| Quadros com tamanhos e posições irregulares | A animação "tremeria" | Grade com quadro de tamanho fixo por personagem/inimigo |
| Tamanho do pixel pode variar entre sprites | Mistura de resoluções fica estranha na tela | Mesma escala de pixel em todo o jogo |
| Escala entre inimigos não definida | Um tanque deve ser bem maior que um rato | Tabela de tamanhos (seção 4) |
| Origem e licença não informadas | Necessário para publicar na Google Play com segurança | Confirmar origem e direitos de uso comercial |

## 3. Especificação de entrega **[PROPOSTA]**
- PNG com fundo transparente, uma folha por personagem/inimigo (ou por animação), quadros em grade de tamanho fixo.
- Ponto de apoio (pivô) consistente: **centro dos pés**, na mesma posição em todos os quadros.
- Nomeação: `personagem_animacao.png` (ex.: `gato_run.png`), com número de quadros e FPS anotados.
- Efeitos grandes (lasers, explosões, rastros) separados do corpo, como sprites de efeito próprios.

## 4. Resolução e tamanhos **[PROPOSTA]**
Diretriz do produtor: **visual pixel art, mas com animações fluidas e sempre com efeitos.** Por isso:
- **Renderização na resolução nativa do aparelho**, com os sprites em filtro "nearest" (pixels nítidos). O jogo **não** fica preso a uma grade de pixels baixa: posições, câmera, rotações e escalas se movem de forma suave (sub-pixel), e os efeitos de luz, partículas e brilho são desenhados em alta resolução por cima da pixel art.
- **Câmera:** mostra o equivalente a ~540 pixels de arte na largura (retrato). Em telas mais altas (ex.: 20:9) mostra mais altura em vez de esticar.
- Todos os sprites usam a **mesma densidade de pixel** (1 pixel de arte = mesmo tamanho na tela para todos).
- Tamanhos de quadro (o nível de detalhe da arte conceitual pede quadros maiores que o clássico 32×32):

| Categoria | Quadro |
|---|---|
| Personagens jogáveis | 48×48 a 64×64 |
| Inimigos fracos | 24×24 a 32×32 |
| Inimigos médios | 48×48 |
| Tanques | 64×64 a 96×96 |
| Chefes | 160×160 a 256×256 (até ~60% da largura da tela) |
| G Batty / projéteis | 8×8 a 16×16 |

Validar com protótipo de legibilidade (horda cheia na tela) antes de produzir tudo.

## 5. Personagens jogáveis — checklist de animações
Conjunto necessário pelo GDD: idle, run, jump (subida), fall (queda), dash, wall slide, hurt, death, e a habilidade própria de cada um.

| Animação | Gato | Guaxinim Hacker | Pug |
|---|---|---|---|
| Idle | ✅ 4 quadros | ✅ 4 | ✅ 4 |
| Run | ✅ 6 | ✅ 6 | ✅ 6 |
| Jump / Fall | ✅ pulo e pulo duplo (3) | ✅ paraquedas (3) | ✅ pulo e queda pesada (2) |
| Dash | ✅ 4 | ❌ | ❌ |
| Wall slide / Wall jump | ❌ | ❌ | ❌ |
| Hurt | ❌ | ✅ (glitch) | ❌ |
| Death | ❌ | ✅ | ❌ |
| Ataque / habilidade | — | — | ✅ escudo/soco de energia (4) |

**Faltam:** wall slide em todos; dash no Guaxinim e no Pug; hurt e death no Gato e no Pug. O efeito de "glitch" do Guaxinim ao levar dano é uma ótima referência para padronizar o hurt de todos.

## 6. Inimigos — animações mínimas
- **Mover** (andar/voar), **antecipação do ataque** (telegrafia), **ataque**.
- **Dano:** piscar branco por código (shader), sem quadros extras.
- **Morte [PROPOSTA]:** efeito genérico compartilhado (explosão de sucata + faíscas + G Batty), sem precisar de animação de morte para cada um dos 34 inimigos.
- Chefes: animações por fase + telegrafia de cada ataque.

## 7. Fluidez e efeitos (pilar visual)
A fluidez vem de três camadas somadas:

**1. Mais quadros nas animações principais [PROPOSTA]**
| Animação | Quadros | Velocidade |
|---|---|---|
| Idle | 6–8 | 8–10 fps |
| Run | 8–10 | 12–15 fps |
| Jump / Fall / transição | 3–4 cada | 12 fps |
| Dash | 4–6 + quadro de "smear" (borrão de movimento) | 15–20 fps |
| Wall slide | 2–4 | 10 fps |
| Hurt / Death | 3–4 / 6–8 | 12 fps |
| Inimigos (mover) | 4–6 | 10–12 fps |

O jogo roda a 60 fps; os quadros de sprite trocam mais devagar, mas posição, câmera e efeitos atualizam todo quadro.

**2. Animação por código (sem custo de arte)**
- Squash & stretch ao pular, aterrissar e dar dash.
- Inclinação do corpo na direção do movimento; balanço suave no idle.
- Transições interpoladas (easing) em UI, cartas de level up e câmera.
- Pisca branco ao levar dano; tremor leve nos inimigos atingidos.

**3. Efeitos sempre presentes**
- **Movimento:** poeira ao correr e aterrissar, faíscas no wall slide, rastro/afterimages no dash, chama dos propulsores (Gato, Bode).
- **Combate:** hit stop curto (micropausa ao acertar), tremor de tela proporcional ao impacto, números de dano opcionais, faíscas e estilhaços de sucata.
- **Neon:** brilho (bloom/glow) e luz 2D dos elementos neon iluminando o cenário.
- **Coleta:** G Batty pulsando e voando até o jogador com rastro; barra de XP enchendo com brilho.
- **Momentos grandes:** level up (onda de luz + câmera lenta breve), revive (efeito "Protocolo de Backup" com glitch e onda de choque), entrada de chefe, novo recorde.
- **Hurt/glitch:** distorção, aberração cromática e linhas de scan curtas (seguindo a referência do Guaxinim).

**Performance no Android (jogo "democrático"):** efeitos com object pooling e níveis de qualidade Baixa/Média/Alta (ver `docs/arquitetura.md` §2.3). Para isso, a arte deve entregar:
- **Halos de brilho pré-desenhados** (sprites aditivos) para cada elemento neon. Eles fazem o "neon falso" da qualidade Baixa e somam ao bloom nas demais.
- Partículas pequenas e com poucas camadas transparentes sobrepostas (o celular sofre com sobreposição de transparências).
- Atlas organizados por grupo (personagem, bioma, tier de inimigos, UI, efeitos).
- O feedback essencial (hit stop, pisca de dano, telegrafia) nunca depende da qualidade gráfica.

## 8. Legibilidade e cores **[PROPOSTA]**
- **Vermelho reservado para perigo:** projéteis e ataques inimigos em vermelho/vermelho-alaranjado (como os lasers do Drone Olho e da Coruja).
- **Skills do jogador em ciano/magenta/branco.** Atenção: o efeito laranja do ataque do Pug fica perto da cor de perigo; sugerir ajustar para dourado claro ou ciano.
- G Batty com cor e pulsação próprias, que não se confundam com projéteis.
- Fundo menos saturado e mais escuro que o primeiro plano.
- Opção de reduzir flashes e tremor de tela (acessibilidade).

## 9. Música
### 9.1 Tema principal: "Steel Laced Pursuit" (`assets/audio/music/steel_laced_pursuit.mp3`)
**É a referência de direção musical do jogo (regra do produtor): as demais faixas devem seguir este caminho.**

Medições do arquivo (análise automática; confirmar de ouvido):
| Item | Valor |
|---|---|
| Duração | 2:59 (som até ~2:57) |
| Andamento | **~140 BPM** (ou 70 BPM se contado em meio tempo) |
| Tonalidade | Inconclusiva na análise (Fá maior / Dó maior / Dó menor). Confirmar com o compositor |
| Volume integrado | −12,4 LUFS (alto; deixar espaço para os efeitos sonoros na mixagem) |
| Formato | MP3 192 kbps, 44,1 kHz, estéreo |

Estrutura de energia:
| Trecho | O que acontece |
|---|---|
| 0:00–0:25 | Introdução mais baixa e escura (pouco grave) |
| 0:25–1:00 | Entra a energia total: grave forte e brilho alto |
| 1:00–1:10 | Pequeno respiro |
| 1:15–2:00 | Trecho mais intenso e brilhante da faixa |
| 2:00–2:30 | Ponte/redução de brilho, energia ainda alta |
| 2:30–2:57 | **Fade-out** até o silêncio |

### 9.2 Uso no jogo **[PROPOSTA]**
- **Loop sem emenda:** como a faixa termina em fade-out, ela não pode simplesmente repetir. Plano: a introdução toca uma vez e depois um trecho de loop (ex.: ~0:25 → ~2:30) repete, cortado exatamente no início dos compassos (a 140 BPM, 1 compasso de 4 tempos ≈ 1,714 s). O ideal é o compositor exportar **Intro** e **Loop** como arquivos separados.
- **Na Unity:** Vorbis com *Streaming*; transição intro → loop com `AudioSource.PlayScheduled` para não haver falha.
- **Música adaptativa:** pedir as camadas separadas (base, percussão, leads) para aumentar a intensidade conforme a horda cresce, nos chefes e no Protocolo de Backup (abafar a música durante a contagem).
- **Efeitos no ritmo:** usar o BPM para pulsar neons, G Batty e o HUD no tempo da música, reforçando o pilar "sempre com efeitos" quase sem custo.
- **Outras faixas** (Esconderijo/menu, cada bioma, chefes, fim de partida) seguem o mesmo timbre e energia; o menu pode usar uma versão mais calma do tema.
- **Origem e licença:** confirmar quem compôs e se o uso comercial é permitido (registrar em `docs/creditos.md`).

## Cenários dos biomas (v0.4, folha `assets/concept/cenarios_biomas.jpg`)
Gerados por `tools/build_biomes.py` (rodar antes de `tools/build_atlas.py`):
- **Camada próxima de parallax** por bioma (`web/assets/biomes/{bioma}_near.webp`, 75–105 KB): orla com coqueiros/postes/placas, fachadas da favela, guindastes/contêineres/portão do porto. Carrega só quando o bioma aparece; desenhada com um véu da cor do céu para não competir com os inimigos.
- **Texturas em escala de mundo** (`{bioma}_tex.webp`, ~6 KB): preenchimento repetível dos blocos (painéis da orla, concreto rachado da favela, parede do cais), faixa de superfície (calçadão com neon, laje rachada, grade metálica) e plataforma de mão única. Os blocos escurecem com a profundidade.
- **Peças de cenário** no atlas (`prop.*`): bancos e lixeira (orla); andaime (favela, semitransparente para não parecer plataforma); contêineres, portão, esteira, canos, painéis, semáforos (porto).
- O Distrito Neon continua com o visual procedural (a folha não tem peças dele).
- **v0.5 (reenvio da folha):** novas peças recortadas da mesma folha — coqueiros neon azul e rosa, placas de neon penduradas (horizontal e verticais) na orla; placas verticais e antenas parabólicas na favela; passarela com escada e torres no porto (semitransparente, atrás dos blocos). Peças podem ter `lift` (altura acima do chão) em `biomes.js` para ficarem penduradas. Atlas: ~1,66 MB.


## Folha 2 de cenários (v0.7) — `assets/concept/cenarios_biomas2.jpg`
- 6 cenários: Data Subway, GeneLab, Neon Mall, The Cage, Glow Jungle, Cyber Casino. Mesmo processo da folha 1 (`tools/build_biomes.py`, dicionários `BIOMES2` e `PROPS2`): faixa próxima de paralaxe, texturas de bloco/superfície/plataforma e peças de cenário.
- Peças sobre piso que não é preto usam `cut_key` (remove a cor do piso amostrada num ponto da folha).
- Rótulos da folha ("2. GENELAB" etc.) são apagados antes do recorte (`clear`).
- As peças da folha 2 entram no atlas automaticamente via `tools/bio_props.json`.
- Atlas agora ~2 MB (1536×3400). **Otimização futura:** carregar as peças de cada setor só quando ele começa.
