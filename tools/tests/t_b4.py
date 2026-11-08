import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for seed, idx, at in ((30,0,180),(31,0,180)):
            pg = await b.new_page(viewport={'width':390,'height':844})
            await pg.goto(f'http://localhost:8765/index.html?seed={seed}&bossAt={at}&boss={idx}&god=1&bot=1&speed=8')
            await pg.wait_for_timeout(700)
            await pg.evaluate("document.getElementById('ov-checkin').classList.add('hidden'); __start()")
            await pg.wait_for_function('__game.runTime > ' + str(at), timeout=180000, polling=500)
            log=[]
            for i in range(60):
                await pg.wait_for_timeout(500)
                r = await pg.evaluate("(()=>{const b=__game.boss,p=__game.player; return [__game.runTime|0, b? Math.round(100*b.hp/b.maxHp):-1, b? Math.round(Math.hypot(b.cx-p.cx,b.cy-p.cy)):0, __game.runStats.bosses]})()")
                log.append(r)
                if r[3] > 0: break
            print(seed, log[::3], log[-1])
            await pg.close()
        await b.close()
asyncio.run(main())
