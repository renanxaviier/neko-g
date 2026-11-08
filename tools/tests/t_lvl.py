from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 400, 'height': 820})
    pg.goto('http://localhost:8765/?bot=1&god=1&speed=5&seed=9'); pg.wait_for_timeout(1500)
    for m in (1, 4):
        pg.evaluate(f"__start({{mode:'journey', map:{m}}})")
        last=-1
        for i in range(90):
            pg.wait_for_timeout(1000)
            st = pg.evaluate("[__game.state, __game.stage, __game.level, Math.round(__game.stageFrac()*100)]")
            if st[0]=='levelup': pg.evaluate("document.querySelector('#cards .card').click()")
            if st[1]!=last: print('map', m, 'stage', st[1], 'level', st[2]); last=st[1]
            if st[0]=='gameover': print('fim', st); break
    b.close()
