from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for (w,h,name) in [(400,820,'a'),(360,640,'b')]:
        pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2, has_touch=True, is_mobile=True)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://localhost:8765/?seed=3'); pg.wait_for_timeout(2000)
        print(errs)
        if pg.is_visible('#btn-checkin-back'): pg.click('#btn-checkin-back'); pg.wait_for_timeout(300)
        pg.screenshot(path=f'/tmp/cs3_title_{name}.png')
        pg.click('#btn-char'); pg.wait_for_timeout(900)
        pg.screenshot(path=f'/tmp/cs3_gato_{name}.png')
        pg.click('#cs-next'); pg.wait_for_timeout(120)
        pg.screenshot(path=f'/tmp/cs3_mid_{name}.png')
        pg.wait_for_timeout(800)
        pg.click('.cs-pip:nth-child(6)'); pg.wait_for_timeout(900)
        pg.screenshot(path=f'/tmp/cs3_tatu_{name}.png')
        print(name, errs)
    b.close()
