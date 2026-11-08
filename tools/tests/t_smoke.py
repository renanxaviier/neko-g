from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for q in ['?bot=1&god=1&speed=3&seed=5', '?bot=1&god=1&speed=3&seed=5&journey=4']:
        pg = b.new_page(viewport={'width': 400, 'height': 820})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://localhost:8765/'+q); pg.wait_for_timeout(1500); pg.evaluate("__start(location.search.includes(\"journey\") ? {mode:\"journey\", map:4} : {mode:\"endless\"})"); pg.wait_for_timeout(12000)
        print(q, pg.evaluate("[__game.state, __game.mode, Math.round(__game.time||0), __game.kills]"), errs[:3])
        pg.close()
    b.close()
