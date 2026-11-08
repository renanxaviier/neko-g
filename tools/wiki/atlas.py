import json
def load():
    s=open('/home/claude/web/src/atlasData.js').read()
    txt=s[s.index('export const ATLAS = ')+len('export const ATLAS = '):]
    A,_=json.JSONDecoder().raw_decode(txt)
    return A
