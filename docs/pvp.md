# PvP em salas (estilo Grand Chase) — **[PROPOSTA]**

> Escrito em 08/11/2026 a pedido do produtor. Nada aqui foi implementado. Itens sem decisão estão marcados **[EM ABERTO]**.
> Referência: as salas de PvP do Grand Chase. Alguém cria uma sala e escolhe o mapa, os outros entram e a luta começa quando todos estão prontos.

## 1. Visão
**Rinha Neon**: modo de luta entre jogadores dentro do Neko G. Usa a mesma movimentação do jogo (pulo duplo, dash, wall jump), os mesmos personagens e as armas exclusivas, em arenas pequenas de plataforma.
- **Primeiro modo:** Todos contra Todos (*free for all*), de 2 a 4 jogadores.
- **Depois:** Times 2×2 e partida rápida (fila automática).

## 2. Fluxo de telas
1. **Tela inicial → RINHA NEON.** Pede conta: convidado pode jogar, mas aparece como "Convidado-1234". **[EM ABERTO]**
2. **Lista de salas.** Cada sala mostra nome, mapa, jogadores (ex.: 2/4), modo, ping e um cadeado se tiver senha. Tem os botões **Criar sala**, **Entrar por código** e **Atualizar**.
3. **Criar sala.** O dono escolhe:
   - nome da sala (lista de nomes prontos, para evitar ofensas) **[EM ABERTO]**;
   - mapa, entre as arenas da seção 4;
   - modo (Todos contra Todos);
   - número de jogadores (2 a 4);
   - vidas (1, 3 ou 5) e tempo-limite (2, 3 ou 5 min);
   - sala aberta ou com código de 4 dígitos.
4. **Sala de espera:**
   - Cada jogador troca de personagem e toca **PRONTO**.
   - O dono inicia quando todos estiverem prontos (mínimo 2) e pode expulsar alguém.
   - Comunicação só por **emotes e frases rápidas** ("Boa!", "Valeu!", "Revanche?"). Sem chat livre, para não precisar de moderação.
5. **Partida:** contagem 3-2-1, a mesma do início de fase, e a luta.
6. **Resultado:** posições, abates, quedas e dano causado, com os botões **Revanche** (volta para a mesma sala) e **Sair**.

## 3. Regras do Todos contra Todos
- **Vidas:** cada jogador começa com as vidas da sala. Ao cair, renasce em 3 s num ponto de nascimento livre, com 2 s de invencibilidade (pisca).
- **Vitória:** último com vida, ou, no fim do tempo, quem tiver mais vidas. Empate é decidido por mais abates e depois por mais dano.
- **Queda no vazio:** perde uma vida. O abate conta para quem acertou o golpe por último, se foi nos 4 s anteriores.
- **Sem horda:** sem inimigos e sem G Batty. Caixas aparecem pela arena com itens temporários (seção 5).
- **Ataque manual sempre.** O ataque automático fica desligado no PvP.

## 4. Arenas
- Arenas pequenas e fechadas, com 1,5 a 2 telas de largura em retrato. A câmera segue o jogador e uma seta aponta os adversários fora da tela.
- **Uma arena por bioma**, reaproveitando a arte que já existe (folhas `bio_*`), com plataformas fixas desenhadas à mão e não geradas, para garantir equilíbrio. Exemplos:
  - **Telhados do Distrito:** dois níveis, um buraco no meio.
  - **Doca do Porto:** contêineres móveis.
  - **Metrô:** trem que atravessa a arena de tempos em tempos.
  - **Cyber Deep:** água com nado mais lento.
- Primeira leva sugerida: 3 arenas. **[EM ABERTO]**

## 5. Equilíbrio (a parte mais importante)
No PvE a graça é ficar forte; no PvP todos precisam começar iguais.
- **Laboratório, talentos e nível de personagem ficam desligados no PvP.** Cada personagem usa uma ficha fixa de PvP, com vida, dano e velocidade iguais para todos e ajustadas por personagem.
- **Arma exclusiva:** cada personagem usa a sua num nível fixo (por exemplo, o nível 3) para todos.
- **Skills:** nada de cartas de level up. Cada jogador escolhe **2 skills** antes da partida, numa lista curta liberada para PvP: Shuriken, Escudo, Raio e afins. Elas recarregam mais devagar que no PvE.
- **Caixas da arena:** dão por 10 s um efeito: dano dobrado, velocidade, escudo, ímã de golpe ou cura.
- **Golpes:**
  - empurrão (*knockback*) forte;
  - nada de travar o outro em sequência sem saída: depois de 3 acertos seguidos, o alvo fica 1 s imune a atordoamento;
  - o dash atravessa golpes, como no PvE.
- **Nada pago dá vantagem.** Personagens comprados com Cyber-Moedas têm a mesma ficha de equilíbrio que o Gato inicial. Skins são só visuais.

## 6. Rede (como funciona por trás)
| Opção | Serve? | Por quê |
|---|---|---|
| Firestore / Realtime Database (Firebase) | Não para a luta | Atraso alto e variável; bom só para lista de salas e ranking |
| Conexão direta entre celulares (WebRTC) | Arriscado | Falha muito no 4G (NAT), e um jogador poderia trapacear |
| **Servidor de partidas próprio** | **Recomendado** | Um servidor decide os golpes (anti-trapaça) e todos veem a mesma luta |

- **Servidor:** Node.js com uma biblioteca de salas (ex.: Colyseus) na nuvem do Google (Cloud Run), região São Paulo.
- Ele roda a simulação a 20–30 atualizações por segundo e manda o estado aos jogadores.
- **No celular:** o próprio personagem responde na hora (o celular prevê o movimento e corrige se o servidor discordar). Os adversários aparecem suavizados, um pouco no passado (interpolação), para não "teleportarem".
- **Lista de salas e contas:** Firebase, como já está. O servidor confere o login do Firebase antes de deixar entrar.
- **Custo:** o servidor exige o plano pago do Firebase/Google Cloud (Blaze). No começo o custo é baixo e cresce com o número de partidas ao mesmo tempo. **[EM ABERTO: orçar antes de começar]**
- **Ping:** a luta fica boa até uns 120 ms. Acima disso, a sala mostra o ping em amarelo ou vermelho.

## 7. Recompensas e ranking
- Por partida: um pouco de Sucata (mais para quem vence) e missões diárias de PvP ("Vença 1 Rinha", "Faça 10 abates").
- **Sem Cyber-Moedas por partida**, para não estimular contas falsas jogando entre si.
- **Fase 2:** ranking de PvP separado (pontos que sobem e descem por vitória, estilo ELO), temporadas mensais e moldura de perfil para os melhores.

## 8. Fases do projeto
| Fase | Entrega | Para quê |
|---|---|---|
| **F0** | Cooperativo de 2 jogadores contra a horda, numa sala por código | Testar o servidor, a rede no 4G e o custo com algo divertido e de baixo risco |
| **F1** | Rinha Todos contra Todos (2–4), salas por código, 3 arenas | Primeira versão do PvP com amigos |
| **F2** | Lista pública de salas, partida rápida, ranking PvP | Abrir para todo mundo |
| **F3** | Times 2×2, mais arenas, temporadas | Conteúdo contínuo |

Pré-requisito: lançar na Play Store e ter público suficiente para as salas não ficarem vazias. Sugestão: começar F0 depois do lançamento.

## 9. Pontos em aberto
- Plano pago do Google Cloud e orçamento mensal do servidor.
- Convidado pode jogar PvP ou só quem tem conta?
- Nomes de sala: lista pronta ou texto livre com filtro?
- Personagens no PvP: todos liberados (só para a Rinha) ou só os que o jogador tem?
- Idade/classificação na Play Store: interação entre jogadores muda o questionário de classificação e a política de dados.

## 10. Riscos
- **Rede no 4G brasileiro:** o atraso pode estragar a sensação de luta. A F0 serve para medir isso.
- **Trapaça:** por isso o servidor decide os golpes. Mesmo assim, o APK pode ser modificado; o servidor precisa validar tudo.
- **Esforço:** o PvP muda muito código (simulação separada de desenho, estado compartilhado). Estimativa grosseira: F0 + F1 é mais trabalho que todo o modo Jornada.
