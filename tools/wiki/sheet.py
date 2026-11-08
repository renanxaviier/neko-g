import glob,os
from PIL import Image
fs=sorted(glob.glob('/home/claude/site/img/*.webp'))
W=1400; x=y=0; rowh=0; ims=[]
for f in fs:
    im=Image.open(f).convert('RGBA')
    if x+im.width>W: x=0;y+=rowh+4;rowh=0
    ims.append((im,x,y)); x+=im.width+4; rowh=max(rowh,im.height)
out=Image.new('RGBA',(W,y+rowh),(20,10,40,255))
for im,x,y in ims: out.alpha_composite(im,(x,y))
out.convert('RGB').save('/tmp/wiki_contact.png')
