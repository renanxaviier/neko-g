# Jogabilidade subaquática: arquitetura (proposta v0.1)

> Status (v0.9): **setor Cyber Deep jogável** — física de nado, torpedo, Âncora do Pug, Flutuar do Guaxinim, inimigos e baterias na água, efeito visual e som abafado. Decidido pelo produtor: **sem oxigênio**, setor **depois do Porto**.
> Ainda não feito: bloco `WATER` (poças em outros cenários), adaptação das skills (arpões, corrente elétrica), cardume de peixes-drone, quadros de nado dos personagens.
> Código: `WATER` (config.js), `Player._swimStep/_stroke/_swimMove/_tryTorpedo` (player.js), `setWaterPhysics` + IA `swim` do Tubarão (enemies.js), `WaterFx` (water.js), `AudioSys.setUnderwater` (audio.js), `Game._setWater` (game.js).

## 1. Ideia em uma frase
Os mesmos controles (◀ ▶, PULO, DASH, ATAQUE) passam a significar **nadar**: o personagem afunda devagar, cada toque em PULO é uma braçada para cima e o DASH vira um **torpedo**. Isso traz combate em 360° (inimigos vindo de cima e de baixo), sem precisar de controle novo.

## 2. Onde a água aparece
A água é um **tipo de bloco** (`WATER`), e não só um tipo de cenário. Assim o mesmo sistema serve para três casos:

| Caso | Exemplo | O que muda |
|---|---|---|
| Setor inteiro submerso | **Abismo Neon** (setor novo, entre Porto e Fábrica) **[DECIDIR posição]** | O mundo todo é água, com superfície no topo, fundo de areia, corais e destroços |
| Poças e áreas alagadas | Lago da cachoeira no **Glow Jungle**, túnel alagado no **Data Subway** | Entrar na água troca a física; sair volta ao normal |
| Mergulhos curtos | Orla (Cyber-Coast): cair no mar por baixo do calçadão | Atalho com Baterias e baús, risco de inimigos aquáticos |

Recomendo começar pelas **poças**: elas testam a física sem precisar de um setor inteiro pronto.

## 3. Física de nado (perfil `WATER` aplicado sobre o personagem)
Valores iniciais para ajustar jogando:

| Parâmetro | Em terra | Na água |
|---|---|---|
| Gravidade | 1350 | **300** (afunda devagar) |
| Queda máxima | rápida | **110 px/s** |
| Velocidade horizontal | 225 | **160**, com arrasto (desacelera sozinho) |
| PULO | pulo / pulo duplo | **Braçada**: impulso de 230 para cima, recarga de 0,18 s, sem limite. Segurar = sobe devagar |
| DASH | dash com invencibilidade | **Torpedo**: avanço rápido de 0,25 s na direção do movimento (diagonal para cima se PULO estiver apertado); continua dando invencibilidade |
| Pulo na parede | sim | não (empurra na parede para se soltar) |

**Por personagem** (mantém a identidade de cada um):
- **Gato:** braçada mais forte (é o mais ágil).
- **Guaxinim:** "Planar" vira **Flutuar**: segurando PULO, ele para no lugar (bom para mirar).
- **Pug:** pesado, afunda 40% mais rápido; a "Queda" vira **Âncora**, uma descida rápida que dá dano em área no fundo.

**Saída da água:** ao chegar à superfície com velocidade para cima, ele salta para fora (dá para pular para plataformas acima da água).

## 4. Oxigênio **[DECIDIR]**
- **Opção A (recomendada): sem oxigênio.** Num jogo de hordas, um cronômetro de ar extra mais irrita do que diverte. Bolhas no cenário dão bônus (velocidade ou cura) em vez de evitar morte.
- **Opção B: oxigênio leve.** Barra de 30 s, recarregada em bolsões de ar e na superfície; sem ar, perde 2% de HP por segundo (nunca morte instantânea).

## 5. Inimigos aquáticos (sprites que já existem nas folhas)
| Inimigo | Folha | Movimento |
|---|---|---|
| **Medusa** | inimigos_folha3 | Sobe em pulsos e desce devagar; o choque em volta dela é um anel de dano que liga e desliga |
| **Caranguejo** | inimigos_folha3 | Anda no fundo e atira a pinça em arco (como o Esquilo, mas pela água) |
| **Leão-marinho** | inimigos_folha3 | Investida em curva (avisa, depois nada rápido em arco até o jogador) |
| **Peixes-drone** (arte nova) | **[pedir folha]** | Cardume: 6 a 10 peixes que se movem juntos e desviam uns dos outros |
| **Polvo de Neon** (chefão) | inimigos_folha1 | Já existe; na água ganha o habitat certo: tentáculos vindo de baixo e nuvem de tinta que escurece a tela |

Novo tipo de IA: **`swim`**, que não sofre gravidade, tem arrasto e persegue em 2D, com variações (`pulse`, `school`, `arc`).

## 6. Skills na água
- **Garras / ataque básico:** iguais.
- **Shurikens:** viram **arpões**: mais lentos, atravessam mais inimigos.
- **Drones:** iguais (são robôs à prova d'água).
- **Rastro de fogo:** vira **Corrente Elétrica**: o rastro dá choque e fica 30% maior na água.
- **G Batty e Sucata:** flutuam devagar para cima em vez de cair.

## 7. Visual e som (pensado para celular fraco)
- **Tom azul** por cima da tela (um retângulo com cor) e **feixes de luz** de cima (imagem pré-desenhada, só desliza).
- **Cáusticas** (reflexos de luz ondulando): uma textura pequena pré-gerada, repetida e deslizando; nada de efeito pixel a pixel.
- **Bolhas:** saem do personagem a cada braçada e dos inimigos ao morrer (no máximo 40 na tela).
- **Superfície:** linha de ondas animada; ao atravessá-la, espirro e som de "splash".
- **Som abafado:** filtro passa-baixa na música e nos efeitos enquanto submerso (WebAudio `BiquadFilter`, custo quase zero). É o detalhe que mais vende a sensação de estar debaixo d'água.
- **Corpo:** leve balanço do sprite enquanto nada. Pedir à arte **animação de nado** (2 a 4 quadros) para os 3 personagens **[pedir folha]**.

## 8. Arquitetura no código
| Peça | Onde | O que faz |
|---|---|---|
| `medium: 'air' \| 'water'` | `biomes.js` (cada cenário) | Setor submerso por inteiro. **Gancho já existe.** |
| Bloco `WATER` | `world.js` / `chunks.js` | Água em parte do mapa (poças, túneis alagados) |
| `player.setMedium(m)` e `inWater` | `player.js` | Troca o perfil de física; novos estados `Swim`, `Stroke`, `Torpedo`, `Float`. **Gancho já existe (ainda não muda nada).** |
| `PHYSICS_WATER` | `config.js` | Os números da seção 3 |
| IA `swim` | `enemies.js` | Movimento sem gravidade, com arrasto; variações `pulse`, `school`, `arc` |
| `fx.bubbles()`, `fx.splash()` | `fx.js` | Partículas da água |
| `_waterOverlay()` | `render.js` | Tom azul, cáusticas, feixes e linha da superfície |
| `audio.setUnderwater(on)` | `audio.js` | Filtro passa-baixa |
| Gerador de layout `water` | `chunks.js` | Peças com mais espaço vertical, poucas plataformas, corais e destroços como obstáculos |

## 9. Ordem de implementação sugerida
1. Física de nado + bloco `WATER` + visual básico (tom azul, bolhas, superfície), testados numa poça no Glow Jungle.
2. Som abafado, cáusticas, feixes de luz.
3. IA `swim` com Medusa, Caranguejo e Leão-marinho.
4. Setor **Abismo Neon** completo, com o Polvo de Neon como chefão.
5. Adaptação das skills (arpões, corrente elétrica).

## 10. Arte que vou precisar **[pedir folha]**
- Cenário subaquático: fundo de areia, rochas, corais neon, algas, destroços (contêineres e um navio afundado), faixa da superfície com ondas, bolsão de ar.
- Personagens: nado (2 a 4 quadros) e torpedo para Gato, Guaxinim e Pug.
- Inimigos: cardume de peixes-drone; quadros de nado para Leão-marinho.
- Efeitos: bolhas, espirro de água.
