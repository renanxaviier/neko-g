from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 400, 'height': 820}, device_scale_factor=2)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?seed=3&god=1&bot=1'); pg.wait_for_timeout(1800)
    pg.evaluate("__game.meta.chars.push('guaxinim','pug'); __game.meta.weapons = {garrasE:5, corteDados:5, martelo:5}")
    for cid in ['gato','guaxinim','pug']:
        pg.evaluate(f"__game.selectChar('{cid}')")
        pg.evaluate("__start({mode:'endless'})"); pg.wait_for_timeout(14000)
        # wait until weapon timer just fired
        for k in range(40):
            t = pg.evaluate("__game.skills.weapon.t")
            d = pg.evaluate("__game.skills.weapon.def.cd")
            if t > d*0.55: break
            pg.wait_for_timeout(50)
        pg.wait_for_timeout(90)
        pg.screenshot(path=f'/tmp/w_{cid}.png')
        print(cid, pg.evaluate("[__game.state, __game.kills]"))
        pg.evaluate("__game.toTitle()"); pg.wait_for_timeout(500)
    print(errs[:5])
    b.close()
