# Bench: CPU desacelerada, bot jogando, mede quadros e perfil de CPU
import json, sys
from playwright.sync_api import sync_playwright
rate = float(sys.argv[1]) if len(sys.argv) > 1 else 4
secs = int(sys.argv[2]) if len(sys.argv) > 2 else 30
scen = sys.argv[3] if len(sys.argv) > 3 else 'endless'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-gpu-rasterization', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2.0, is_mobile=True, has_touch=True)
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    cdp = pg.context.new_cdp_session(pg)
    pg.goto('http://localhost:8765/?seed=11&god=1&bot=1'); pg.wait_for_timeout(1500)
    pg.evaluate("__game.meta.chars.push('guaxinim','pug','coelho','macaco','tatu'); __game.meta.weapons={garrasE:5,corteDados:5,martelo:5}")
    if scen == 'endless': pg.evaluate("__start({mode:'endless'})")
    else: pg.evaluate(f"__start({{mode:'journey', map:{int(scen)}}})")
    pg.wait_for_timeout(3000)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate})
    cdp.send('Profiler.enable'); cdp.send('Profiler.setSamplingInterval', {'interval': 200}); cdp.send('Profiler.start')
    pg.evaluate("Object.assign(__perf, {frames:0,sum:0,max:0}); __perf.hist.fill(0); window.__acc={n:0,step:0,draw:0,ms:0}")
    # janela acumulada própria (o medidor zera a dele)
    pg.evaluate("""(()=>{const P=__perf; const o=P; setInterval(()=>{},1000)})()""")
    t = 0
    rows=[]
    while t < secs:
        pg.wait_for_timeout(5000); t += 5
        rows.append(pg.evaluate("[__fps.fps, __fps.res, __game.enemies.count, __game.state, __game.kills]"))
    prof = cdp.send('Profiler.stop')['profile']
    res = pg.evaluate("({frames: __perf.frames, avg: __perf.sum/__perf.frames, max: __perf.max, hist: Array.from(__perf.hist)})")
    b.close()
h = res['hist']; tot = sum(h)
def pct(q):
    c=0
    for i,v in enumerate(h):
        c+=v
        if c>=tot*q: return i
print('rate', rate, 'scen', scen, 'frames', res['frames'], 'cpu avg ms %.2f max %.1f' % (res['avg'], res['max']))
print('frame interval p50', pct(.5), 'p95', pct(.95), 'p99', pct(.99), 'ms; >25ms', sum(h[26:]), 'of', tot)
print('fps/res/enemies', rows)
# perfil: tempo próprio por função
nodes = {n['id']: n for n in prof['nodes']}
self_t = {}
samples = prof['samples']; deltas = prof['timeDeltas']
cnt = {}
for s_, d in zip(samples, deltas): cnt[s_] = cnt.get(s_, 0) + d
for nid, us in cnt.items():
    cf = nodes[nid]['callFrame']; k = f"{cf['functionName'] or '(anon)'} {cf['url'].split('/')[-1]}:{cf['lineNumber']+1}"
    self_t[k] = self_t.get(k, 0) + us
total = sum(self_t.values())
for k, v in sorted(self_t.items(), key=lambda x: -x[1])[:22]: print('%5.1f%% %s' % (100*v/total, k))
print(errs[:3])
