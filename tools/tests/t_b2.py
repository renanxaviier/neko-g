from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 400, 'height': 820}, device_scale_factor=1)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?seed=3&god=1'); pg.wait_for_timeout(1500)
    for i, bid in [(4,'tita'),(5,'rainha'),(6,'sentinela')]:
        pg.evaluate("__start({mode:'endless'})"); pg.wait_for_timeout(500)
        pg.evaluate(f"__game.spawner.bossIdx={i}; __game.sectorBossAt = __game.sectorTime + 1")
        states=set()
        for k in range(10):
            pg.wait_for_timeout(1000)
            st = pg.evaluate("__game.boss ? [__game.boss.type, __game.boss.state, __game.boss.anim, Math.round(__game.boss.hp)] : null")
            if st: states.add(st[1])
            if k in (5, 9): pg.screenshot(path=f'/tmp/b_{bid}_{k}.png', clip={'x':0,'y':200,'width':400,'height':400})
        print(bid, st, sorted(states))
        pg.evaluate("__game.toTitle()"); pg.wait_for_timeout(300)
    print(errs[:4])
    b.close()
