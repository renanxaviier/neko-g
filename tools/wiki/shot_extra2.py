import asyncio
from playwright.async_api import async_playwright
JOBS = [
  ('shot_hud', '?seed=5&god=1&bot=1&sector=8&nointro', 14000, None),
  ('shot_boss', '?seed=9&god=1&bot=1&sector=0&bossAt=3&nointro', 11000, None),
  ('shot_levelup', '?seed=3&god=1&sector=2&nointro', 3000, 'window.__game.addXp(400)'),
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 410, 'height': 730}, device_scale_factor=1, has_touch=True, is_mobile=True)
        pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        for name, q, wait, js in JOBS:
            await pg.goto('http://localhost:8791/' + q); await pg.wait_for_timeout(1500)
            await pg.evaluate('window.__game.meta.tutDone = true; window.__start()')
            await pg.wait_for_timeout(wait)
            if js: await pg.evaluate(js); await pg.wait_for_timeout(1500)
            await pg.locator('#app').screenshot(path=f'/tmp/wiki_tools/{name}.png')
            print(name, await pg.evaluate('window.__game.state'), flush=True)
        print('errors', errs[:5]); await b.close()
asyncio.run(main())
