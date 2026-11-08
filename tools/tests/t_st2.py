from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg = b.new_page(viewport={'width': 412, 'height': 891}, has_touch=True, is_mobile=True, device_scale_factor=2)
    cdp = pg.context.new_cdp_session(pg); cdp.send('Network.setCacheDisabled', {'cacheDisabled': True})
    pg.goto('http://localhost:8765/?seed=5'); pg.wait_for_timeout(1500)
    pg.evaluate("__game.meta.tutDone=true; __game.meta.chars.push('tatu'); __game.meta.selected='tatu'; __start({mode:'journey', map:0})")
    pg.wait_for_timeout(1500); pg.mouse.click(200,600); pg.wait_for_timeout(1500)
    print(pg.evaluate("JSON.stringify([document.getElementById('st-face').getBoundingClientRect(), getComputedStyle(document.getElementById('st-face')).position, getComputedStyle(document.getElementById('st-face')).bottom, document.querySelector('.st-row').getBoundingClientRect(), document.getElementById('st-face').className])"))
    print(pg.evaluate("(()=>{const c=document.getElementById('st-face'),x=c.getContext('2d');const d=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n})()"))
    b.close()
