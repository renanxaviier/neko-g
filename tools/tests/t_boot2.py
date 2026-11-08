from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
    for mode in ['touch', 'mouse']:
        pg = b.new_page(viewport={'width': 412, 'height': 891}, device_scale_factor=2, has_touch=True, is_mobile=True)
        cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://localhost:8765/?intro=1')
        pg.wait_for_selector('#boot-go:not(.hidden)', timeout=15000)
        box = pg.locator('#btn-journey').bounding_box()
        x, y = box['x'] + box['width']/2, box['y'] + box['height']/2      # toca exatamente onde fica o JORNADA
        if mode == 'touch': pg.touchscreen.tap(x, y)
        else: pg.mouse.click(x, y)
        pg.wait_for_timeout(1200)
        print(mode, 'estado:', pg.evaluate("__game.state"), '| abertura removida:', pg.evaluate("!document.getElementById('ov-boot')"), '| música:', pg.evaluate("!__game.audio.music.paused"), errs[:2])
        # segundo toque no JORNADA agora deve iniciar
        if mode == 'touch': pg.touchscreen.tap(x, y)
        else: pg.mouse.click(x, y)
        pg.wait_for_timeout(800)
        print(mode, 'depois do 2º toque:', pg.evaluate("__game.state"))
        pg.close()
    b.close()
