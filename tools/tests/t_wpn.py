from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for ch, wid in [('coelho','luaE'),('macaco','plasma'),('tatu','choque')]:
        pg = b.new_page(viewport={'width': 412, 'height': 891})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
        pg.goto('http://localhost:8765/?bot=1&god=1&seed=5'); pg.wait_for_timeout(1500)
        pg.evaluate(f"__game.meta.tutDone=true; __game.meta.chars.push('{ch}'); __game.meta.selected='{ch}'; __game.meta.weapons={{{wid}:5}}; __game.settings.auto=true; __start({{mode:'journey', map:2}})")
        pg.wait_for_timeout(9000)
        shots=0; kills0=pg.evaluate('__game.kills')
        for i in range(30):
            pg.wait_for_timeout(200)
            n = pg.evaluate("__game.skills.wproj.filter(w=>w.active).length")
            if n and shots < 2: pg.screenshot(path=f'/tmp/wpn_{ch}_{shots}.png'); shots+=1
        print(ch, pg.evaluate("[__game.char.id, __game.skills.weapon && __game.skills.weapon.id, __game.kills]"), 'shots seen', shots, errs[:2])
        pg.close()
    b.close()
