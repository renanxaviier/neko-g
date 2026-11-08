from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page()
    logs=[]; pg.on('console', lambda m: logs.append(m.text[:160]))
    pg.goto('http://localhost:8765/'); pg.wait_for_timeout(8000)
    print(pg.evaluate("(() => { const c = window.__cloud || (__game.ui && __game.ui.cloud); return c ? [c.mode, c.user && c.user.uid, c.user && c.user.guest, c.status] : 'sem ref'; })()"))
    print([l for l in logs if 'cloud' in l.lower() or 'firebase' in l.lower()][:5])
    b.close()
