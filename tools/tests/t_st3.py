from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 891}, has_touch=True, is_mobile=True, device_scale_factor=2)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
    pg.goto('http://localhost:8765/?seed=5&story=1'); pg.wait_for_timeout(1500)
    shots=[]
    for m, n in [(0,1),(12,0)]:
        pg.evaluate(f"__game.meta.tutDone=true; __game.meta.jMax=13; __start({{mode:'journey', map:{m}}})")
        pg.wait_for_timeout(1800)
        for i in range(n): pg.mouse.click(200,600); pg.wait_for_timeout(150); pg.mouse.click(200,600); pg.wait_for_timeout(500)
        pg.wait_for_timeout(1200); pg.screenshot(path=f'/tmp/st3_{m}a.png')
        pg.click('#st-skip'); pg.wait_for_timeout(300)
        pg.evaluate("__game.stage = 3; __game._doWarp()"); pg.wait_for_timeout(1000)
        for i in range(2 if m==0 else 2): pg.mouse.click(200,600); pg.wait_for_timeout(150); pg.mouse.click(200,600); pg.wait_for_timeout(500)
        pg.wait_for_timeout(1000); pg.screenshot(path=f'/tmp/st3_{m}b.png')
        print(m, pg.evaluate("[document.getElementById('st-name').textContent, __game.spawner.bossIdx, __game.map.biome.id]"))
        pg.click('#st-skip'); pg.wait_for_timeout(300)
    print(errs[:3])
    b.close()
