import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width':390,'height':844})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto('http://localhost:8765/index.html?seed=11&bot=1&speed=6&god=1')
        await pg.wait_for_timeout(800); await pg.evaluate('__start()')
        for ci in [5,11,17,-5]:
            await pg.evaluate(f'__game.player.x={ci}*768+200; __game.player.y=-450')
            await pg.wait_for_timeout(5000)
        print(await pg.evaluate("JSON.stringify({t:__game.runTime|0, x:__game.player.x|0, biomes:[...__game.runStats.biomes], perf: window.__perf, fps: __game.renderer.fps})"))
        await b.close(); print('errors', errs)
asyncio.run(main())
