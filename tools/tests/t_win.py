from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 400, 'height': 820}, device_scale_factor=2)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?seed=3&god=1'); pg.wait_for_timeout(1500)
    pg.evaluate("__start({mode:'journey', map:2})"); pg.wait_for_timeout(3000)
    pg.evaluate("__game.kills = 120; __game.runTime = 400; __game.meta.jMax = 2; __game._journeyWin()"); pg.wait_for_timeout(2500)
    pg.screenshot(path='/tmp/win.png')
    print(pg.evaluate("JSON.stringify({s: __game.lastResult.stars, n: __game.lastResult.newStars, c: __game.lastResult.bonusCoins, xp: __game.lastResult.charXp, up: __game.lastResult.charUp, jm: __game.meta.jMax})"), errs[:3])
    b.close()
