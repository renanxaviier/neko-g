# Instrumenta funções e registra chamadas lentas nos primeiros segundos da fase
import sys
from playwright.sync_api import sync_playwright
rate = float(sys.argv[1]); targets = sys.argv[2].split(',')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-gpu-rasterization', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2.0, is_mobile=True, has_touch=True)
    cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate})
    pg.goto('http://localhost:8765/?seed=7'); pg.wait_for_timeout(2500); pg.evaluate('window.__thr=4')
    pg.evaluate("""(T) => { const S = window.__slow = []; window.__t0 = performance.now();
      const objs = { juice: __game.juice, amb: __game.renderer.ambient, game: __game, r: __game.renderer, ui: __game.ui, audio: __game.audio, en: __game.enemies, sk: __game.skills, fx: __game.fx, world: __game.world };
      for (const t of T) { const [o, m] = t.split('.'); const obj = objs[o]; if (!obj || typeof obj[m] !== 'function') { S.push(['missing', t]); continue; }
        const f = obj[m]; obj[m] = function (...a) { const s = performance.now(); const r = f.apply(this, a); const d = performance.now() - s; if (d > (window.__thr||8)) S.push([Math.round(s - __t0), t, +d.toFixed(1), __game.introT > 0]); return r; }; } }""", targets)
    pg.evaluate("__game.meta.tutDone = true; window.__t0 = performance.now(); __start({mode:'journey', map:2})")
    pg.wait_for_timeout(9000)
    S = pg.evaluate("window.__slow")
    b.close()
for s in S: print(s)
