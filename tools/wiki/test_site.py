import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); logs=[]; pg.on('console', lambda m: logs.append(m.text)); pg.on('pageerror', lambda e: logs.append(str(e)))
        await pg.goto('http://localhost:8790/'); await pg.wait_for_timeout(500)
        await pg.click("a[href=\"#bestiario\"]"); await pg.wait_for_timeout(3500)
        top = await pg.evaluate('document.querySelector("#bestiario .h2").getBoundingClientRect().top')
        await pg.click('.chip[data-f="deep"]'); await pg.wait_for_timeout(300)
        cnt = await pg.text_content('#foe-count')
        vis = await pg.evaluate('[...document.querySelectorAll(".foe")].filter(e=>!e.hidden).map(e=>e.querySelector("h4").textContent)')
        await pg.evaluate('document.querySelector(".chips").scrollIntoView()'); await pg.evaluate('window.scrollBy(0,-70)'); await pg.wait_for_timeout(400)
        await pg.screenshot(path='/tmp/site_mobile_filtro.png')
        # sobreposição: textos de cartões que saem da própria caixa
        over = await pg.evaluate('''[...document.querySelectorAll(".card")].filter(c=>c.offsetParent).flatMap(c=>{const r=c.getBoundingClientRect();return [...c.querySelectorAll("h3,h4,p,li,.spr")].filter(e=>{const q=e.getBoundingClientRect();return q.width&&(q.right>r.right+1||q.left<r.left-1)}).map(e=>e.textContent.slice(0,30)||e.className)})''')
        print('h2 top after anchor', top, '|', cnt, vis, '| overflow', over[:6], '| logs', logs)
        await b.close()
asyncio.run(main())
