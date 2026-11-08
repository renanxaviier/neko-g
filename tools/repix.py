# Re-pixeliza arte "pixel art" ampliada e borrada (JPEG): acha a grade e amostra 1 cor por célula.
import numpy as np, sys
from PIL import Image

def period(rgb, al, axis, fixed=None):
    d = np.abs(np.diff(rgb, axis=axis)).sum(2)
    m = (al[:, 1:] & al[:, :-1]) if axis == 1 else (al[1:, :] & al[:-1, :])
    prof = (d * m).sum(axis=0 if axis == 1 else 1); prof = prof - prof.mean()
    n = np.arange(len(prof)); best = None
    for p in ([fixed] if fixed else np.arange(3.6, 6.2, 0.01)):
        z = (prof * np.exp(2j * np.pi * n / p)).sum()
        if best is None or abs(z) > best[0]: best = (abs(z), p, np.angle(z))
    _, p, ang = best
    off = (-ang / (2 * np.pi) * p) % p       # posição das bordas da grade
    return p, off

def _prof(rgb, al, axis):
    d = np.abs(np.diff(rgb, axis=axis)).sum(2)
    m = (al[:, 1:] & al[:, :-1]) if axis == 1 else (al[1:, :] & al[:-1, :])
    prof = (d * m).sum(axis=0 if axis == 1 else 1)
    return prof - prof.mean()


def grid_size(im):
    """Tamanho do pixel da arte (igual nos dois eixos: pixel art tem pixel quadrado)."""
    a = np.asarray(im.convert('RGBA')).astype(float)
    rgb, al = a[..., :3], a[..., 3] > 128
    profs = [_prof(rgb, al, 1), _prof(rgb, al, 0)]
    best = None
    for p in np.arange(3.6, 13, 0.02):
        sc = sum(abs((pr * np.exp(2j * np.pi * np.arange(len(pr)) / p)).sum()) / np.abs(pr).sum() for pr in profs)
        if best is None or sc > best[0]: best = (sc, p)
    return best[1]


def repix(im, p=None):
    """p = (px, py) para forçar o período (mesma grade em todos os quadros de uma animação); a fase é sempre recalculada."""
    a = np.asarray(im.convert('RGBA')).astype(float)
    rgb, al = a[..., :3], a[..., 3] > 128
    if p is None: g = grid_size(im); p = (g, g)
    px, ox = period(rgb, al, 1, p[0]); py, oy = period(rgb, al, 0, p[1])
    H, W = al.shape
    xs = np.arange(ox + 0.5 - px, W, px); ys = np.arange(oy + 0.5 - py, H, py)
    out = np.zeros((len(ys) - 1, len(xs) - 1, 4), np.uint8)
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            x0, x1 = xs[i], xs[i + 1]; y0, y1 = ys[j], ys[j + 1]
            # núcleo da célula (evita a borda borrada)
            cx0, cx1 = int(max(0, x0 + px * 0.28)), int(min(W, x1 - px * 0.28 + 1))
            cy0, cy1 = int(max(0, y0 + py * 0.28)), int(min(H, y1 - py * 0.28 + 1))
            if cx1 <= cx0 or cy1 <= cy0: continue
            blk = a[cy0:cy1, cx0:cx1].reshape(-1, 4)
            if (blk[:, 3] > 128).mean() < 0.5: continue
            blk = blk[blk[:, 3] > 128]
            out[j, i, :3] = np.median(blk[:, :3], 0); out[j, i, 3] = 255
    return Image.fromarray(out), (px, py)

if __name__ == '__main__':
    im = Image.open(sys.argv[1]); o, pp = repix(im)
    print(pp, o.size)
    o.save(sys.argv[2])
