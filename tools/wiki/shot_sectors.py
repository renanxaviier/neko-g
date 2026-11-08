# Captura cada setor do modo Infinito com o bot jogando (para os cartões de Cenários do site)
import asyncio, sys
from playwright.async_api import async_playwright
ORDER = ['distrito','coast','favelas','porto','deep','fabrica','subway','genelab','mall','casino','cage','jungle','torre']
only = sys.argv[1:] 
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 410, 'height': 640}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        for i, sid in enumerate(ORDER):
            if only and sid not in only: continue
            await pg.goto(f'http://localhost:8791/?seed={11+i}&god=1&bot=1&sector={i}&nointro')
            await pg.wait_for_timeout(1500)
            await pg.evaluate('window.__start()')
            await pg.add_style_tag(content='#hud,#controls,.toast,#tut,#ov-biome{display:none!important}')
            await pg.wait_for_timeout(9000)
            await pg.locator('#app').screenshot(path=f'/tmp/wiki_tools/sec_{sid}.png')
            print(sid, await pg.evaluate('window.__game.state'), flush=True)
        print('errors', errs[:5]); await b.close()
asyncio.run(main())
