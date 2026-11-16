# Usage: python3 rebuild_photos.py <dir with origmap.json> <out dir>
# origmap.json maps photo key -> camera original (JPG). Writes graded cv-<key>.webp (q86)
# plus -w400/700/1000/1400 copies (q84). Landscape capped at 2560px, portrait at 1717px.
# Rebuild built-in photos from the camera originals: graded, high quality, responsive widths.
import json, os, sys, numpy as np
from PIL import Image, ImageOps
S=sys.argv[1]; OUT=sys.argv[2]
m=json.load(open(os.path.join(S,'origmap.json')))
STEPS=[400,700,1000,1400]
MAXW={'landscape':2560,'portrait':1717}
def grade(im):
    a=np.asarray(im).astype(np.float32)/255
    a=np.clip((a-0.5)*1.08+0.5,0,1); s=1.1
    M=np.array([[0.213+0.787*s,0.715-0.715*s,0.072-0.072*s],[0.213-0.213*s,0.715+0.285*s,0.072-0.072*s],[0.213-0.213*s,0.715-0.715*s,0.072+0.928*s]],np.float32)
    a=np.clip(a@M.T,0,1); a=np.clip(a*1.02,0,1)
    return Image.fromarray((a*255+0.5).astype(np.uint8))
dims={}; total=0
for k,f in sorted(m.items()):
    im=ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    W,H=im.size; cap=MAXW['landscape'] if W>H else MAXW['portrait']
    if W>cap: im=im.resize((cap,round(H*cap/W)),Image.LANCZOS); W,H=im.size
    im=grade(im)
    im.save(os.path.join(OUT,f'cv-{k}.webp'),'WEBP',quality=86,method=6); total+=os.path.getsize(os.path.join(OUT,f'cv-{k}.webp'))
    for w in STEPS:
        if w>=W: continue
        r=im.resize((w,round(H*w/W)),Image.LANCZOS)
        p=os.path.join(OUT,f'cv-{k}-w{w}.webp'); r.save(p,'WEBP',quality=84,method=6); total+=os.path.getsize(p)
    dims[k]=(W,H)
    print(f'{k:14} {W}x{H}  full {os.path.getsize(os.path.join(OUT,f"cv-{k}.webp"))//1024}KB')
json.dump(dims,open(os.path.join(S,'hqdims.json'),'w'))
print('total', total//1024, 'KB')
