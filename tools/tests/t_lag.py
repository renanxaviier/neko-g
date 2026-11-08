# Mede travadas no início de fase: intervalo de cada quadro (rAF) desde o início da partida, CPU desacelerada
import sys, json
from playwright.sync_api import sync_playwright
rate = float(sys.argv[1]); intro = float(sys.argv[2]); boot = sys.argv[3] == 'boot'; mode = sys.argv[4] if len(sys.argv) > 4 else 'journey'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-gpu-rasterization', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2.0, is_mobile=True, has_touch=True)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate})
    pg.goto('http://localhost:8765/?seed=7' + ('&intro=1' if boot else ''))
    if boot:
        pg.wait_for_timeout(14000)
        pg.mouse.click(200, 600); pg.wait_for_timeout(1500)
    else:
        pg.wait_for_timeout(2500)
    pg.evaluate(f"""(() => {{ window.__RUNI = {intro}; }})()""")
    pg.evaluate("""(() => { const L = window.__lag = []; let last = performance.now();
      const f = (t) => { L.push([t - last, __game.introT > 0 ? 1 : 0, __game.enemies.count]); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); })()""")
    if mode == 'journey': pg.evaluate("__game.meta.tutDone = true; __start({mode:'journey', map:2})")
    elif mode == 'warp':
        pg.evaluate("__game.meta.tutDone = true; __game.godMode = true; __start({mode:'endless'})"); pg.wait_for_timeout(8000)
        pg.evaluate("__lag.length = 0; __game._doWarp()")
    else: pg.evaluate("__game.meta.tutDone = true; __start({mode:'endless'})")
    pg.wait_for_timeout(int((intro + 8) * 1000))
    L = pg.evaluate("window.__lag"); res = pg.evaluate("[__fps.res, __fps.slowShare.toFixed(3), __game.sectorInfo && __game.sectorInfo.biome.id]")
    b.close()
import statistics
base = statistics.median([d for d,_,_ in L[-60:]]); lim = max(40, base * 2.2)
t = 0; rows = []; endI = None
for i, (dt, inI, en) in enumerate(L):
    t += dt
    if endI is None and not inI and i > 2: endI = t
    if dt > lim: rows.append((round(t), round(dt), 'INTRO' if inI else 'jogo', en))
print('quadro normal (mediana final) %.1f ms, limite %.0f' % (base, lim)); print(f'rate {rate} intro {intro} boot {boot}: frames {len(L)}, intro termina em {endI and round(endI)} ms')
after = [r for r in rows if r[2] == 'jogo']
print(' travadas >40ms durante intro:', [r[:2] for r in rows if r[2]=='INTRO'][:20])
print(' travadas >40ms depois da intro:', after[:25], 'total', len(after), 'pior', max([r[1] for r in after] or [0]))
print(' resolução/slowShare/bioma no fim:', res); print(' erros', errs[:3])
