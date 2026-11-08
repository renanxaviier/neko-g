from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 891}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg.goto('http://localhost:8765/?seed=3&god=1'); pg.wait_for_timeout(1500)
    if pg.is_visible('#btn-checkin-back'): pg.click('#btn-checkin-back')
    pg.evaluate("__start({mode:'journey', map:0})"); pg.wait_for_timeout(9000)
    pg.screenshot(path='/tmp/ctl.png')
    b.close()
