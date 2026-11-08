# Abre portais em muitos pontos de vários mundos e confere se algum fica dentro de parede
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 400, 'height': 820})
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?god=1'); pg.wait_for_timeout(1500)
    r = pg.evaluate("""(async () => {
      let bad = 0, total = 0, none = 0;
      for (let seed = 1; seed <= 6; seed++) {
        history.replaceState(null, '', '?god=1&seed=' + seed);
        __game.params = new URLSearchParams(location.search);
        __start({mode:'endless'});
        const g = __game, w = g.world, p = g.player;
        for (let x = -2000; x <= 3000; x += 37) {
          p.x = x; const sy = w.surfaceNear(Math.floor(x/32), -64, 2); if (sy === null) continue;
          p.y = sy - p.h; g.portal = null;
          g._openPortal(p.cx + 90);
          total++;
          const P = g.portal; if (!P) { none++; continue; }
          for (let dx = -20; dx <= 20; dx += 10) for (let dy = 6; dy <= 64; dy += 10)
            if (w.isSolidAt(P.x + dx, P.y - dy)) { bad++; dx = 99; break; }
        }
        g.toTitle();
      }
      return {bad, total, none};
    })()""")
    print(r, errs[:3])
    b.close()
