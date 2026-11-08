from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 891}, has_touch=True, is_mobile=True)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
    pg.goto('http://localhost:8765/?bot=1&god=1&seed=5'); pg.wait_for_timeout(1500)
    pg.evaluate("__game.meta.tutDone=true; __game.meta.weapons={garrasE:3}; __game.settings.auto=false; __start({mode:'journey', map:1})")
    pg.wait_for_timeout(5000)
    for i in range(8):
        pg.wait_for_timeout(1500)
        print(pg.evaluate("[+__game.skills.weapon.mp.toFixed(1), document.getElementById('btn-special').className, __game.skills.swipes.filter(s=>s.active).length]"))
    pg.screenshot(path='/tmp/sp_full.png')
    pg.evaluate("__game.input.pressSpecial()"); pg.wait_for_timeout(120)
    print('after press', pg.evaluate("[+__game.skills.weapon.mp.toFixed(1), __game.skills.swipes.filter(s=>s.active).length]"))
    pg.screenshot(path='/tmp/sp_fire.png')
    print(errs[:3])
    b.close()
