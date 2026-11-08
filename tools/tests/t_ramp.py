from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for m in [0, 4, 9]:
        pg = b.new_page(viewport={'width': 412, 'height': 891})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://localhost:8765/?bot=1&god=1&speed=4&seed=3'); pg.wait_for_timeout(1500)
        pg.evaluate(f"__game.meta.tutDone = true; __start({{mode:'journey', map:{m}}})")
        vet = 0; mx = 0
        for i in range(12):
            pg.wait_for_timeout(1500)
            r = pg.evaluate("[__game.enemies.pool.filter(e=>e.active&&e.elite).length, __game.enemies.count, +__game.enemyDamageMult.toFixed(2), +(__game.rampHp||1).toFixed(2), __game.diffN, __game.stageInfo&&__game.stageInfo.type]")
            vet = max(vet, r[0]); mx = max(mx, r[1])
        print('mapa', m+1, 'veteranos vistos', vet, 'max inimigos', mx, 'dano', r[2], 'rampHp', r[3], 'n', r[4], r[5], 'elitesKilled', pg.evaluate('__game.elitesKilled'), errs[:2])
        pg.close()
    b.close()
