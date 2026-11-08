import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for idx in range(4):
            pg = await b.new_page(viewport={'width':390,'height':844})
            errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            at = [180,360,540,720][idx]
            await pg.goto(f'http://localhost:8765/index.html?seed={30+idx}&bossAt={at}&boss={idx}&god=1&bot=1&speed=8')
            await pg.wait_for_timeout(700)
            await pg.evaluate("document.getElementById('ov-checkin').classList.add('hidden'); __start()")
            # espera chegar ao marco
            await pg.wait_for_function(f"__game.runTime > {at}", timeout=180000, polling=500)
            t0 = await pg.evaluate("__game.runTime")
            r = None
            for i in range(60):
                await pg.wait_for_timeout(1000)
                r = await pg.evaluate("(()=>{const b=__game.boss; return [__game.runTime|0, b? Math.round(100*b.hp/b.maxHp):-1, __game.level, __game.runStats.bosses]})()")
                if r[1] == -1 and r[3] > 0: break
            print(idx, 'start', int(t0), 'end', r, 'fight s', r[0]-int(t0), errs[:2])
            await pg.close()
        await b.close()
asyncio.run(main())
