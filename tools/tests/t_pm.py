from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?seed=11&god=1&bot=1'); pg.wait_for_timeout(1500)
    pg.evaluate("__start({mode:'endless'})"); pg.wait_for_timeout(1500)
    pg.evaluate("__game.pause()"); pg.wait_for_timeout(300)
    pg.click('#opt-perf'); pg.click('#btn-resume'); pg.wait_for_timeout(9000)
    pg.screenshot(path='/tmp/pm.png', clip={'x':0,'y':0,'width':412,'height':320})
    print(pg.evaluate("[__fps.fps, __fps.hz, __fps.res, __fps.slowShare, __game.settings.perf, document.getElementById('fps-meter').textContent]"), errs[:3])
    b.close()
