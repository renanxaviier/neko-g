import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto('http://localhost:8765/index.html?seed=7&god=1')
        await pg.wait_for_timeout(800)
        await pg.evaluate("__game.meta.checkin={last:'2026-11-07',streak:1}; document.getElementById('ov-checkin').classList.add('hidden')")
        await pg.evaluate("__start()"); await pg.wait_for_timeout(1500)
        for name, ci in [('coast',5),('favelas',11),('porto',17)]:
            await pg.evaluate(f"(()=>{{const p=__game.player; p.x={ci}*768+300; p.y=-450; p.vy=0; __game.enemies && 0;}})()")
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f'/tmp/bio_{name}.png')
        await b.close(); print('errors', errs)
asyncio.run(main())
