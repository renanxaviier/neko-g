import asyncio
from playwright.async_api import async_playwright
JOBS = [  # nome, url, espera ms, esconder HUD?
  ('sec_distrito', '?seed=21&god=1&bot=1&sector=0&nointro', 5200, True),
  ('shot_hud', '?seed=5&god=1&bot=1&sector=8&nointro', 14000, False),
  ('shot_boss', '?seed=9&god=1&bot=1&sector=0&bossAt=3&nointro', 11000, False),
  ('shot_boss2', '?seed=4&god=1&bot=1&sector=3&bossAt=3&nointro', 11000, False),
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 410, 'height': 730}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        for name, q, wait, hide in JOBS:
            await pg.goto('http://localhost:8791/' + q); await pg.wait_for_timeout(1500)
            await pg.evaluate('window.__start()')
            if hide: await pg.add_style_tag(content='#hud,#controls,.toast,#tut,#ov-biome{display:none!important}')
            await pg.wait_for_timeout(wait)
            await pg.locator('#app').screenshot(path=f'/tmp/wiki_tools/{name}.png')
            print(name, await pg.evaluate('window.__game.state'), await pg.evaluate('window.__game.boss && window.__game.boss.def.name'), flush=True)
        print('errors', errs[:5]); await b.close()
asyncio.run(main())
