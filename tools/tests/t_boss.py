import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        errs=[]
        for idx in range(4):
            pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
            await pg.goto(f'http://localhost:8765/index.html?seed=21&bossAt=6&boss={idx}&god=1')
            await pg.wait_for_timeout(700)
            await pg.evaluate("document.getElementById('ov-checkin').classList.add('hidden'); __start()")
            await pg.wait_for_timeout(5000)
            await pg.screenshot(path=f'/tmp/boss{idx}_warn.png')
            for k in range(3):
                await pg.wait_for_timeout(1700)
                await pg.screenshot(path=f'/tmp/boss{idx}_{k}.png')
            info = await pg.evaluate("(()=>{const b=__game.boss; return b? {t:b.type, hp:b.hp, max:b.maxHp, st:b.state, x:b.x|0, y:b.y|0, px:__game.player.x|0, py:__game.player.y|0, shots:__game.enemies.shots.filter(s=>s.active).length}:null})()")
            print(idx, info)
            # mata o chefe
            await pg.evaluate("__game.boss && __game.enemies.hurt(__game.boss, 1e6, 0, 0)")
            await pg.wait_for_timeout(600)
            await pg.screenshot(path=f'/tmp/boss{idx}_dead.png')
            print(' after kill', await pg.evaluate("[!!__game.boss, __game.runStats.bosses, __game.meta.cyberCoins, __game.state]"))
            await pg.close()
        await b.close(); print('errors', errs[:5])
asyncio.run(main())
