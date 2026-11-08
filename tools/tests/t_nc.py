from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 400, 'height': 820}, device_scale_factor=1)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?seed=3&god=1&bot=1'); pg.wait_for_timeout(1500)
    pg.evaluate("__game.meta.chars.push('coelho','macaco','tatu')")
    for cid in ['coelho','macaco','tatu']:
        pg.evaluate(f"__game.selectChar('{cid}')")
        pg.evaluate("__start({mode:'endless'})"); pg.wait_for_timeout(6000)
        for k in range(3):
            pg.screenshot(path=f'/tmp/nc_{cid}_{k}.png', clip={'x':60,'y':330,'width':280,'height':200}); pg.wait_for_timeout(700)
        print(cid, pg.evaluate("[__game.state, __game.kills, __game.player.C.maxAirJumps]"))
        pg.evaluate("__game.toTitle()"); pg.wait_for_timeout(400)
    print(errs[:4])
    b.close()
