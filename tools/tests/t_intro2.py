from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 891}, device_scale_factor=1)
    cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
    pg.goto('http://localhost:8765/?seed=4'); pg.wait_for_timeout(1500)
    pg.evaluate("__game.meta.tutDone = true; __start({mode:'journey', map:4})")
    for i in range(6):
        pg.wait_for_timeout(300)
        print(pg.evaluate("[+__game.introT.toFixed(2), document.getElementById('stage-fade').className, document.getElementById('stage-fade').style.background, getComputedStyle(document.getElementById('stage-fade')).backgroundColor, document.getElementById('stage-go').textContent]"))
        pg.screenshot(path=f'/tmp/in2_{i}.png')
    b.close()
