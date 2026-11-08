from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 891}, device_scale_factor=2, has_touch=True, is_mobile=True)
    cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?seed=4'); pg.wait_for_timeout(1500)
    print('auto padrão:', pg.evaluate("__game.settings.auto"), '| botão ataque visível:', pg.evaluate("getComputedStyle(document.getElementById('btn-attack')).display"))
    pg.evaluate("__game.meta.tutDone = true; __start({mode:'journey', map:4})")
    for i,ms in enumerate([150, 450, 450, 600]):
        pg.wait_for_timeout(ms)
        pg.screenshot(path=f'/tmp/in_{i}.png')
        print(i, pg.evaluate("[+__game.introT.toFixed(2), Math.round(__game.player.x), __game.enemies.count, +__game.runTime.toFixed(2), __R.sceneReady(__game.sectorInfo.biome.id)]"), pg.inner_text('#stage-go'))
    pg.wait_for_timeout(1500)
    print('depois', pg.evaluate("[+__game.introT.toFixed(2), __game.enemies.count, +__game.runTime.toFixed(2)]"), pg.evaluate("document.getElementById('stage-fade').classList.contains('hidden')"), errs[:3])
    b.close()
