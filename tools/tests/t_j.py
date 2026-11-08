from playwright.sync_api import sync_playwright
import time
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 400, 'height': 820})
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?bot=1&god=1&speed=4&seed=7'); pg.wait_for_timeout(1500)
    pg.evaluate("__start({mode:'journey', map:1})")
    shot=False
    for i in range(60):
        pg.wait_for_timeout(2000)
        st = pg.evaluate("[__game.state, __game.stage, __game.stageInfo && __game.stageInfo.type, Math.round(__game.stageProgress()), __game.stageInfo && __game.stageInfo.goal, __game.elitesKilled, __game.batteries, !!__game.portal, __game.enemies.pool.filter(e=>e.active&&e.elite).length]")
        print(st)
        if not shot and st[8] > 0:
            pg.screenshot(path='/tmp/j_elite.png'); shot=True
        if st[0] == 'levelup': pg.evaluate("document.querySelector('#cards button, #cards .card') && document.querySelector('#cards button, #cards .card').click()")
        if st[1] >= 2 or st[0]=='gameover': break
    print(errs[:5])
    b.close()
