from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 891}, device_scale_factor=2)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/?seed=3&god=1&bot=1&speed=3'); pg.wait_for_timeout(1500)
    pg.evaluate("__game.meta.tutDone = true; __start({mode:'journey', map:2})"); pg.wait_for_timeout(2000)
    # simula fim de mapa com build forte
    pg.evaluate("__game.level = 16; __game.skills.actives.set('garras', 5); __game.hp = 50; __game._journeyWin()"); pg.wait_for_timeout(2500)
    pg.screenshot(path='/tmp/exp_over.png')
    print('botão:', pg.inner_text('#btn-restart'))
    pg.click('#btn-restart'); pg.wait_for_timeout(3000)
    print(pg.evaluate("JSON.stringify({st: __game.state, map: __game.map.n, lvl: __game.level, garras: __game.skills.actives.get('garras'), hp: Math.round(__game.hp), max: __game.maxHp, exp: __game.expedition, ex: __game.adaptEx.toFixed(1), hpM: __game.adaptHp.toFixed(2), alive: __game.adaptAlive.toFixed(2), dmg: __game.enemyDamageMult.toFixed(2), kills: __game.kills})"))
    for i in range(10):
        pg.wait_for_timeout(2000)
        if pg.evaluate("__game.state") == 'levelup': pg.evaluate("document.querySelector('#cards .card').click()")
    print(pg.evaluate("JSON.stringify({st: __game.state, stage: __game.stage, lvl: __game.level, ex: __game.adaptEx.toFixed(1), hpM: __game.adaptHp.toFixed(2), kills: __game.kills, en: __game.enemies.count})"), errs[:3])
    b.close()
