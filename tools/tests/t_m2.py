import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':390,'height':844})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html?seed=5&coins=200')
        await pg.wait_for_timeout(800)
        await pg.evaluate("__game.meta.checkin={last:'2026-11-07',streak:1}")
        # revive com moedas: força a morte
        await pg.evaluate("__start()"); await pg.wait_for_timeout(4000)
        await pg.wait_for_function("__game.state==='playing' && !__game.player.invuln", timeout=20000) if False else None
        await pg.wait_for_function("(__game.damagePlayer(9999,null), __game.state==='revive')", timeout=20000, polling=200)
        await pg.wait_for_timeout(300)
        print('state', await pg.evaluate("__game.state"), 'btn', await pg.inner_text('#btn-coins'), await pg.is_disabled('#btn-coins'))
        await pg.screenshot(path='/tmp/m4_revive.png')
        await pg.click('#btn-coins'); await pg.wait_for_timeout(300)
        print('after coin revive', await pg.evaluate("[__game.state, __game.meta.cyberCoins, __game.hasRevived]"))
        await pg.evaluate("__game.kills=160; __game.runStats.crates=6; __game.runStats.evos=1; __game.scrap=70")
        await pg.wait_for_timeout(3500)
        await pg.wait_for_function("(__game.damagePlayer(9999,null), __game.state==='gameover')", timeout=20000, polling=200)
        await pg.wait_for_timeout(500)
        print('state2', await pg.evaluate("__game.state"))
        await pg.screenshot(path='/tmp/m5_over.png')
        print(await pg.evaluate("JSON.stringify(__game.meta.daily.missions)"))
        print('saved', await pg.evaluate("JSON.parse(localStorage.getItem('neonpaws.save.v1')).daily.missions.map(m=>m.progress)"))
        await b.close(); print('errors', errs)
asyncio.run(main())
