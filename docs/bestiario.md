# Bestiário — Inimigos (v0.1)

> Arte conceitual em `assets/concept/inimigos_folha1.jpg`, `inimigos_folha2.jpg` e `inimigos_folha3.jpg`.
> Nomes e aparência vêm da arte enviada pelo produtor. **Comportamentos, tiers e ordem de entrada são [PROPOSTA]** baseadas no visual de cada inimigo.
> Regra geral: todo ataque tem **telegrafia** (sinal visual antes do golpe) para a morte nunca parecer injusta.

**No protótipo jogável (07/11):** Cyber-Rato, Esquilo Bombardeiro, Drone Olho, Morcego, Scrap-Hound, Cyber-Lobo (min 2,5), Vespa, Drone Voador (atira laser, min 5), Urso (min 5), Panda de Guerra (canhão, min 6).

Total: **34 inimigos** = 7 fracos + 12 médios + 10 tanques + 1 elite + 4 chefes.

---

## Tier 1 — Fracos (enxame, desde o início)
| Inimigo | Tipo | Comportamento | Telegrafia |
|---|---|---|---|
| Drone Olho | Voador | Persegue o jogador e dispara laser curto | Olho brilha antes do disparo |
| Morcego Cibernético | Voador | Voo ondulado; mergulho rasante no jogador | Para no ar por um instante antes do mergulho |
| Cyber-Rato | Terrestre | Corre rápido pelas plataformas; frágil | — |
| Esquilo Bombardeiro | À distância | Arremessa bolotas explosivas em arco | Ergue a bolota acesa |
| Vaga-lume Estático | Voador | Enxame lento; choque ao contato | — |
| Aranha-Drone | Teto | Desce do teto por um fio e sobe de novo | Fio aparece antes da descida |
| Ouriço-Espinho | Terrestre | Lento; espinhos eriçam periodicamente e ferem ao contato | Espinhos clareiam antes de eriçar |

## Tier 2 — Médios e rápidos
| Inimigo | Tipo | Comportamento | Telegrafia |
|---|---|---|---|
| Scrap-Hound (Cachorro Sucata) | Terrestre | Investida curta em linha reta | Abaixa e rosna |
| Cyber-Lobo | Terrestre | Surge em matilha; salta entre plataformas | Uivo ao entrar na tela |
| Macaco Cibernético | Escalador | Sobe paredes, pula entre plataformas, soco elétrico | Punho acende |
| Texugo de Choque | Terrestre | Avança e deixa um rastro elétrico no chão por alguns segundos | Tanque nas costas brilha |
| Coruja de Vigilância | Voador | Mantém distância, mira laser e solta mini-drones | Linha de mira visível antes do tiro |
| Ornitorrinco Lançador | À distância | Atira projéteis retos e em arco | Arma carrega |
| Canguru Boxeador | Saltador | Salta alto entre plataformas e soca ao aterrissar | Agacha antes do salto; sombra no ponto de queda |
| Rato-Asa | Voador | Sobrevoa e solta bombas para baixo | Marca no chão onde a bomba vai cair |
| Vespa Zangão | Voador | Investida rápida com ferrão | Corpo brilha amarelo |
| Sapo Tóxico | Saltador | Cospe ácido que forma poça no chão por alguns segundos | Bochecha infla |
| Camaleão Hacker | Emboscada | Fica camuflado (nunca 100% invisível: distorção visível) e ataca com a língua | Para de se camuflar antes do ataque |
| Medusa Cibernética | Voador | Flutua devagar; pulso elétrico em área | Tentáculos faíscam antes do pulso |
| Peixe-Lanterna Glitch (v0.10, Cyber Deep) | Nadador (fraco) | Cardume: fica a ~110 px do jogador e cospe uma bola de luz | A lanterna acende e a boca abre |
| Cyber-Lula (v0.10, Cyber Deep) | Nadador (médio) | Nada em jatos; alinha na altura do jogador e solta um raio horizontal (~170 px) | Linha rosa piscando antes do raio |
| Querubim-Tubarão (v0.10, mini-chefe do Cyber Deep) | Nadador (tanque) | Ronda e dá bote com mordida; aparece garantido na metade do setor | Para e abre a boca |
| Tubarão-Torpedo (v0.9, Cyber Deep) | Nadador | Ronda em ondas ao lado do jogador e dá um bote rápido em linha reta | Para e abre a boca (0,5 s) antes do bote |

## Tier 3 — Tanques e pesados
| Inimigo | Tipo | Comportamento | Telegrafia |
|---|---|---|---|
| Urso Cibernético | Tanque | Soco no chão com onda de choque nas plataformas | Ergue o braço |
| Crocodilo Mecânico | Tanque rasteiro | Blindado na frente; vulnerável por cima e por trás | Abre a boca antes da mordida |
| Gorila de Sucata | Tanque | Salta e esmaga; arremessa sucata | Bate no peito |
| Rinoceronte de Demolição | Investida | Investida longa que **quebra plataformas frágeis** | Raspa a pata no chão |
| Touro Blindado | Investida | Investida que fica **atordoado ao bater na parede** (janela de dano) | Chifres brilham e raspa o chão |
| Tubarão Terrestre | Emboscada | "Nada" sob o chão e emerge embaixo do jogador | Barbatana visível se movendo no chão |
| Bode Quebra-Muralhas | Saltador | Salto com propulsores e investida; quebra paredes | Propulsores acendem |
| Leão-Marinho de Combate | Terrestre rápido | Desliza com propulsores e atira | Propulsores acendem |
| Caranguejo Mecânico | Defensivo | Anda de lado; pinças bloqueiam projéteis frontais; vulnerável ao abrir as pinças | Pinças se abrem |
| Panda de Guerra | Tanque à distância | Canhão de plasma de tiro carregado | Braço-canhão brilha |

## Elites
| Inimigo | Comportamento |
|---|---|
| Alce Gerador | Cria campo elétrico ao redor e **fortalece inimigos próximos**; prioridade para o jogador derrotar. Telegrafia: chifres brilham |
| Variantes "Glitch" | **[PROPOSTA]** Qualquer tanque pode surgir como elite "glitch": efeito visual de falha, mais HP, garante baú/level up ao morrer. Reaproveita sprites |

## Chefes
| Chefe | Comportamento |
|---|---|
| Polvo de Neon | Flutua no alto da arena; tentáculos elétricos varrem áreas; invoca Vaga-lumes |
| Quimera Cibernética | Multifase: as cores da arte (dourado → verde → ciano/magenta) marcam cada fase; garras, investida e cauda de escorpião |
| O Grande Glitch (Dragão Cyber) | Serpenteia pela arena; laser magenta que varre a tela; cubos de glitch como projéteis |
| T-Rex Cibernético | Fase 1: pisadas e rugido (onda de choque). Fase 2: visor vermelho ativado → investida e laser |

### Chefões implementados (v0.5, `web/src/boss.js`)
- **Quando:** primeiro aos **3:00**, depois a cada 3 min, na ordem Polvo → Quimera → Dragão → T-Rex, e o ciclo recomeça com **+75% de HP por volta**. Aviso de 3 s antes ("⚠ CHEFÃO SE APROXIMANDO") e barra de vida no topo. Só um por vez; com chefe em campo a horda cai pela metade.
- **Recompensa garantida:** baterias suficientes para 1 level up, 16–22 Sucatas, cápsula de vida grande e **◆ 5 Cyber-Moedas**. Nova missão diária: "Derrote um chefão" (◆30).
- Chefes não sofrem empurrão nem atordoamento e não são interrompidos ao levar dano. Os terrestres que ficam muito para trás reaparecem na borda da tela num glitch.

| Chefe | HP base | Ataques (todos telegrafados) |
|---|---|---|
| Polvo de Neon | 900 | Leque de orbes (5 → 7, rajada dupla na fase 3) · mergulho no jogador e fica **baixo e exposto por 1,3 s** · invoca morcegos |
| Quimera Cibernética | 2600 | 3 fases pela cor (dourado → verde → ciano), mais rápida a cada fase · bote com ondas de choque ao cair · cauda (3–5 projéteis em arco) · investida (fase 2+) |
| O Grande Glitch | 3200 | Laser magenta que **varre** (linha de aviso piscando antes) · cubos de glitch em leque · teleporte para o outro lado (fase 2+) |
| T-Rex Cibernético | 5500 | Fase 1: pisão com ondas de choque no chão (**pule!**) · Fase 2 (≤50%, visor vermelho): pisão duplo, investida e 3 lasers |

Teste com o bot (que não mira nem pula de propósito): Polvo ~75 s, Quimera ~40 s, Dragão ~65 s, T-Rex ~80 s. Um jogador de verdade deve levar cerca de metade disso. A média de sobrevivência do bot ficou em 234 s (antes, 211 s). **[A AJUSTAR com testes reais]**

---

## Pontos para decidir
1. **Inimigos parecidos:** Rinoceronte × Touro (investida), Morcego × Rato-Asa, Scrap-Hound × Cyber-Lobo, Polvo × Medusa (tentáculos elétricos). Proposta: manter todos, mas com comportamentos diferentes (como acima) ou distribuí-los em biomas diferentes.
2. **Biomas [PROPOSTA]:** agrupar inimigos por zona para dar identidade e variedade ao longo da partida:
   - **Ferro-Velho:** Cyber-Rato, Scrap-Hound, Gorila de Sucata, Esquilo, Drone Olho.
   - **Floresta Neon:** Vaga-lume, Coruja, Ouriço, Sapo, Camaleão, Alce, Urso, Vespa.
   - **Docas/Esgoto:** Crocodilo, Tubarão, Caranguejo, Leão-Marinho, Medusa, Polvo.
   - **Distrito Central:** Panda, Macaco, Canguru, Ornitorrinco, Texugo, Lobo, Rinoceronte, Touro, Bode, Rato-Asa, Morcego, Aranha.
3. **Escopo do primeiro protótipo [PROPOSTA]:** 6 inimigos + 1 chefe — Drone Olho, Cyber-Rato, Morcego, Esquilo Bombardeiro, Scrap-Hound, Urso Cibernético e Polvo de Neon. O restante entra em atualizações.


## Aranha-Drone (implementada, v0.5)
- Folha `inimigos_folha2.jpg` (painel Aranha-Drone). Fraca: 12 HP, dano 5, velocidade 115.
- IA `dropper`: nasce acima da tela perto do jogador e desce num fio de neon balançando; ao tocar o chão ou uma plataforma vira corredora (como o Cyber-Rato, com pulos).
- Entra no minuto 1,5. Favorecida nas Favelas de Dados (2,2×) e um pouco no Distrito Neon.

## Drones aliados (skill Drones)
- Os drones em órbita da skill usam os mini drones do painel da Coruja de Vigilância, com o olho recolorido para verde (aliado), mais o brilho antigo por baixo.


## Chefões — revisão v0.7 (pedido do produtor, 07/11/2026)
**Animação por código (todos):** a folha tem poucos quadros por chefão; agora eles respiram, balançam na passada, abaixam e tremem antes do golpe, inclinam no salto, achatam ao pousar (com poeira e tremida), esticam na investida/mergulho (com rastro) e os voadores flutuam e inclinam com a velocidade.

| Chefão | Golpes antigos | Golpes novos |
|---|---|---|
| **Polvo de Neon** | leque de orbes, mergulho, chamar morcegos | **Giro** (anel de orbes; na fase 3 duas ondas defasadas) · **Chuva de tinta** (fase 3, orbes caindo do teto) |
| **Quimera Cibernética** | bote, cauda (orbes em arco), investida | **Garrada** (de perto, bote curto) · **Chicote da cauda** (fase 2+, golpe atrás + anel de orbes) · **Rugido** (fase 2+, empurra o jogador; fase 3 chama 2 Hounds) · **Botes em sequência** (fase 3, 3 seguidos) · **Pulo para trás** quando o jogador gruda nela. Escolhe o golpe pela distância. |
| **O Grande Glitch** | laser que varre, cubos, teleporte | **Rasante** (atravessa o jogador em arco) · **Chuva de cubos** (fase 3) |
| **T-Rex Cibernético** | pisão com ondas; fase 2: investida e lasers | **Mordida** (de perto) · **Rabada** (é lento para virar: ficar nas costas dele faz ele dar rabada e empurrar) · **Pedras do teto** no pisão da fase 2 |

**Recorte da Quimera refeito** (`tools/fix_bosses.py`): o fundo da folha é azul-escuro, não preto; o recorte antigo deixava manchas escuras em volta do brilho nas fases 2 e 3. Agora o fundo vira transparência suave.


## Inimigos por cenário (v0.8)
Elenco de cada setor em `web/src/biomes.js` (`SECTOR_ROSTER`). 19 inimigos novos, recortados das folhas 1, 2 e 3:

| Inimigo | Nível | Movimento |
|---|---|---|
| Ouriço Neon | fraco | Enrola, rola rápido (ricocheteia na parede) e solta 6 espinhos ao parar |
| Sapo Ácido | fraco | Só anda pulando; de longe cospe ácido em arco |
| Medusa Elétrica | fraco (voa) | Nada em impulsos; de perto, dá choque em volta |
| Rato-Asa Bombardeiro | fraco (voa) | Voa por cima e solta bombas |
| Vaga-lume Bomba | fraco (voa) | Voa tremido até você, pisca e explode (não fere por contato) |
| Macaco Hacker | fraco | Arremessador (como o Esquilo) |
| Ornitorrinco Atirador | fraco | Para e atira um raio ciano |
| Caranguejo Blindado | médio | Chega perto, levanta as pinças e belisca |
| Bode-Foguete | médio | Agacha, salta com foguetes num arco e cai com pisão |
| Canguru Boxeador | médio | Anda pulando; de perto dá soco com avanço |
| Camaleão Fantasma | médio | Chega quase invisível; perto, aparece e dá linguada |
| Coruja de Vigilância | médio (voa) | Fica no alto e solta 2 mini-drones teleguiados |
| Leão-Marinho Jato | médio (voa) | Voa de lado e dispara rajada de 3 tiros |
| Alce de Plasma | médio | Investida (avisa antes) |
| Texugo Voltaico | médio | Investida rápida soltando faíscas |
| Gorila de Aço | tanque | Pancada no chão: anel de impacto + ondas pelo chão |
| Crocodilo Mecânico | tanque | Mordida com avanço |
| Touro de Brasa | tanque | Investida longa |
| Rinoceronte Fornalha | tanque | Investida mais longa, quase não é empurrado |

Elenco resumido: Distrito (rato, drone, morcego / hound / urso) · Orla (medusa, ornitorrinco / caranguejo / crocodilo) · Favelas (esquilo, macaco, rato-asa / bode, hound / urso) · Porto (ornitorrinco, drone / caranguejo, leão-marinho / panda, crocodilo) · Fábrica (drone, aranha / texugo, drone voador / rinoceronte, panda) · Data Subway (rato, aranha, rato-asa / texugo / crocodilo) · GeneLab (sapo, medusa / camaleão, vespa / gorila) · Neon Mall (drone, macaco / canguru, coruja / panda) · Cassino (rato-asa, macaco / canguru, lobo, coruja / gorila, touro) · The Cage (rato, ouriço / canguru, bode / touro, rinoceronte, gorila) · Glow Jungle (vaga-lume, sapo, ouriço / camaleão, alce / crocodilo) · Torre (drone, vaga-lume / coruja, drone voador, leão-marinho / panda, rinoceronte).

O Tubarão fica reservado para o setor subaquático.
