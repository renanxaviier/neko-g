# Pedidos de arte para cenários (para o gerador de imagens)

As folhas atuais funcionam, mas foram feitas como "vitrine" (vários elementos soltos, alguns em vista isométrica, com rótulos de texto). Para o jogo, o ideal é cada cenário vir em **camadas separadas e contínuas**. Mandando nesse formato, eu encaixo sem cortes nem emendas.

## Regras gerais (valem para todas as imagens)
1. **Vista lateral (2D de plataforma)**, nunca isométrica nem em perspectiva.
2. **Repetição horizontal sem emenda (seamless / tileable):** a borda direita deve continuar exatamente na borda esquerda.
3. **Fundo preto puro (#000000) ou transparente** em tudo que não for a camada de céu.
4. **Sem textos de rótulo** ("1. DATA SUBWAY", títulos). Letreiros dentro do cenário podem existir.
5. **Linha do chão reta e na mesma altura** de ponta a ponta (a camada próxima "pisa" no chão do jogo).
6. Mesma paleta neon e o mesmo estilo de pixel art das folhas atuais.

## O que mandar por cenário (5 imagens)
| Arquivo | Tamanho | O que é |
|---|---|---|
| `ceu` | 1080 × 1920 (retrato) | Céu/teto de fundo, sem chão. Pode ter gradiente, estrelas, nuvens, teto do túnel. |
| `longe` | 2048 × 512 | Silhueta distante (prédios, árvores, galpões), repetível, base reta embaixo, fundo preto. |
| `perto` | 2048 × 512 | Faixa de cenário próxima (fachadas, máquinas, cerca, palmeiras), repetível, base reta, fundo preto. |
| `chao` | 128 × 128 | Textura do bloco sólido, repetível nos 4 lados (seamless tile). |
| `borda` | 256 × 32 | Faixa da superfície do chão (o que o personagem pisa), repetível na horizontal. |

E, se quiser, uma **folha de peças** (objetos soltos sobre fundo preto, separados uns dos outros por pelo menos 20 px): máquinas, placas, plantas, móveis.

## Prompt base (em inglês funciona melhor nos geradores)
> 2D side-view pixel art game background layer, cyberpunk neon style, **seamless horizontally tileable**, flat straight ground line at the bottom, **pure black background**, no text labels, no isometric perspective, 2048x512, consistent with retro 16-bit neon palette, [DESCRIÇÃO DO CENÁRIO]

Para o chão:
> seamless tileable 128x128 pixel art ground texture, side-view platformer, cyberpunk neon, [MATERIAL], no perspective

### Descrições prontas ([DESCRIÇÃO DO CENÁRIO])
- **Data Subway:** underground data center subway tunnel, server racks with blinking LEDs, tangled cables, rail tracks, cyan and green neon strip lights
- **GeneLab:** genetic cloning laboratory, glass tubes with glowing liquid and creatures, robotic arms, lab consoles, green and magenta neon
- **Neon Mall:** hologram shopping mall interior, shop windows with holographic mannequins, arcade machines, escalators seen from the side, pink and cyan neon
- **The Cage:** underground fight arena, chain-link electric fence, bleachers with crowd silhouettes, warning signs, stacked tires, yellow spotlights
- **Glow Jungle:** biocybernetic jungle, giant twisted roots with glowing veins, bioluminescent plants and mushrooms, small waterfall, purple and cyan glow
- **Cyber Casino:** casino district street, casino facades with bulb marquees, slot machines, red carpet, gold and red neon
- **Fábrica de Robôs:** robot assembly factory, conveyor belts, hydraulic presses, sparks, hazard stripes, orange neon
- **Torre Corporativa:** top floors of a corporate skyscraper, glass windows over a night city, server walls, helipad lights, white and blue neon
- **Distrito Neon (inicial):** neon city street, apartment buildings, ramen shop signs, pink and cyan neon

## Animação (como no seu vídeo)
As animações de ambiente (trem, holofotes, plateia, fogos, vaga-lumes, hologramas, bolhas, raios, cachoeira) já são feitas por código, em cima das camadas. Se quiser quadros desenhados, mande **4 a 8 quadros lado a lado** do mesmo elemento (ex.: cachoeira, letreiro piscando, tubo borbulhando) sobre fundo preto.
