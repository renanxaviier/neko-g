from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for (w,h) in [(412,891),(360,740)]:
        pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2, has_touch=True, is_mobile=True)
        pg.goto('http://localhost:8765/?seed=3'); pg.wait_for_timeout(1500)
        if pg.is_visible('#btn-checkin-back'): pg.click('#btn-checkin-back')
        pg.evaluate("__game.meta.scrap=500; __game.meta.chars.push('guaxinim'); __game.meta.cxp={gato:900}")
        pg.click('#btn-char'); pg.wait_for_timeout(700)
        pg.screenshot(path=f'/tmp/ov_{w}.png')
        pg.click('#cs-next'); pg.wait_for_timeout(700)
        pg.screenshot(path=f'/tmp/ov2_{w}.png')
        pg.close()
    b.close()
