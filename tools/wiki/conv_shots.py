from PIL import Image
O=['distrito','coast','favelas','porto','deep','fabrica','subway','genelab','mall','casino','cage','jungle','torre']
for s in O:
    im=Image.open(f'/tmp/wiki_tools/sec_{s}.png').convert('RGB')
    W,H=im.size; b=int(H*0.78); t=b-360
    c=im.crop(((W-396)//2,t,(W-396)//2+396,b))
    c.save(f'/home/claude/site/img/sec_{s}.webp','WEBP',quality=72,method=6)
for n in ['shot_hud','shot_boss','shot_levelup']:
    Image.open(f'/tmp/wiki_tools/{n}.png').convert('RGB').save(f'/home/claude/site/img/{n}.webp','WEBP',quality=76,method=6)
