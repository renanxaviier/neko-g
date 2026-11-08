from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 891}, device_scale_factor=1)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
    pg.goto('http://localhost:8765/?seed=4'); pg.wait_for_timeout(1500)
    pg.evaluate("__game.meta.tutDone = true; __start({mode:'journey', map:2})")
    for i in range(9):
        pg.wait_for_timeout(400)
        print(pg.evaluate("[+__game.introT.toFixed(2), __game.introHold, document.getElementById('stage-go').textContent, document.getElementById('stage-fade').style.background, __game.runTime.toFixed(2), __game.enemies.count]"))
        if i in (0,2,4,7): pg.screenshot(path=f'/tmp/cd_{i}.png')
    print(errs)
    b.close()
