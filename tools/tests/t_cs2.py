from playwright.sync_api import sync_playwright
import sys
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for (w,h,name) in [(400,820,'a'),(360,640,'b')]:
        pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2, has_touch=True, is_mobile=True)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://localhost:8765/?seed=3'); pg.wait_for_timeout(2000)
        pg.click('#btn-checkin-back'); pg.wait_for_timeout(300)
        if name=='b': pg.screenshot(path='/tmp/cs_title_small.png')
        pg.click('#btn-char'); pg.wait_for_timeout(300)
        pg.click('.cs-pip:nth-child(4)'); pg.wait_for_timeout(900)
        pg.screenshot(path=f'/tmp/cs_coelho_{name}.png')
        # back via Android back handler
        pg.evaluate("__game.ui.back(()=>{})"); pg.wait_for_timeout(300)
        print(name, 'chars hidden', pg.evaluate("document.getElementById('ov-chars').classList.contains('hidden')"), 'title shown', pg.evaluate("!document.getElementById('ov-title').classList.contains('hidden')"), errs)
    b.close()
