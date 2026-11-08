from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 400, 'height': 820}, device_scale_factor=1)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?seed=3&god=1&bot=1'); pg.wait_for_timeout(1500)
    pg.evaluate("__game.meta.chars.push('guaxinim'); __game.meta.weapons = {corteDados:3}; __game.selectChar('guaxinim')")
    pg.evaluate("__start({mode:'endless'})"); pg.wait_for_timeout(12000)
    n=0
    for k in range(200):
        t = pg.evaluate("__game.skills.weapon.t"); d = pg.evaluate("__game.skills.weapon.def.cd*0.93*0.93")
        if t > d - 0.12:
            pg.screenshot(path=f'/tmp/wd_{n}.png', clip={'x':0,'y':380,'width':400,'height':260}); n+=1
            if n>=2: break
            pg.wait_for_timeout(600)
        pg.wait_for_timeout(20)
    print(n, errs[:3])
    b.close()
