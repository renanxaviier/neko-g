import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for name, vw, vh, mob in [('mobile', 412, 915, True), ('desktop', 1280, 800, False)]:
            ctx = await b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=1, is_mobile=mob, has_touch=mob)
            pg = await ctx.new_page()
            logs = []; pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}')); pg.on('pageerror', lambda e: logs.append('pageerror: ' + str(e)))
            fails = []; pg.on('requestfailed', lambda r: fails.append(r.url)); pg.on('response', lambda r: r.status >= 400 and fails.append(f'{r.status} {r.url}'))
            await pg.goto('http://localhost:8790/'); await pg.wait_for_timeout(800)
            # rola tudo para carregar as imagens preguiçosas
            h = await pg.evaluate('document.body.scrollHeight')
            for y in range(0, h, 600): await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(60)
            await pg.evaluate('window.scrollTo(0,0)'); await pg.wait_for_timeout(2600)
            await pg.screenshot(path=f'/tmp/site_{name}_top.png')
            await pg.screenshot(path=f'/tmp/site_{name}_full.png', full_page=True)
            ow = await pg.evaluate('document.documentElement.scrollWidth > window.innerWidth')
            broken = await pg.evaluate('[...document.images].filter(i=>i.complete && i.naturalWidth===0).map(i=>i.src)')
            print(name, 'height', h, 'overflowX', ow, 'logs', logs[:8], 'fails', fails[:8], 'broken', broken[:5])
            await ctx.close()
        await b.close()
asyncio.run(main())
