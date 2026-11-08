import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto('http://localhost:8765/index.html?seed=3')
        await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(1800)
        await pg.screenshot(path='/tmp/m1_checkin.png')
        print('checkin visible', await pg.is_visible('#ov-checkin'))
        await pg.click('#btn-checkin'); await pg.wait_for_timeout(300)
        print('coins', await pg.evaluate("__game.meta.cyberCoins"))
        await pg.wait_for_timeout(1000)
        # simula sequência: ontem resgatado com streak 6
        await pg.evaluate("""(()=>{const d=new Date(Date.now()-86400000);const s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');__game.meta.checkin={last:s,streak:6};})()""")
        await pg.click('#btn-missions'); await pg.wait_for_timeout(200)
        await pg.click('#btn-checkin-open'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/tmp/m2_day7.png')
        await pg.click('#btn-checkin'); await pg.wait_for_timeout(1200)
        print('coins after day7', await pg.evaluate("__game.meta.cyberCoins"), await pg.evaluate("JSON.stringify(__game.meta.checkin)"))
        # missões: aplica uma partida grande
        await pg.evaluate("""(()=>{const g=__game; const d=g.meta.daily||null; return 0})()""")
        await pg.click('#btn-missions'); await pg.wait_for_timeout(300)
        print(await pg.evaluate("JSON.stringify(__game.meta.daily)"))
        await pg.screenshot(path='/tmp/m3_missions.png')
        await pg.click('#btn-missions-back')
        await b.close()
        print('errors', errs)
asyncio.run(main())
