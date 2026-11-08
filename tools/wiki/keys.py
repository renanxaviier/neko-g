import json,re
s=open('/home/claude/web/src/atlasData.js').read()
m=re.search(r'export const ATLAS = (\{.*?\});\s*$',s,re.S|re.M)
txt=s[s.index('export const ATLAS = ')+len('export const ATLAS = '):]
A,_=json.JSONDecoder().raw_decode(txt)
from collections import defaultdict
d=defaultdict(list)
for k,v in A.items(): d[v['s']].append(f"{k}({len(v['frames'])})")
for sh in d: print(sh,len(d[sh]),' '.join(d[sh]) if not sh.startswith('bio') else '');print()
