// Grade espacial (hash) reaproveitada a cada passo: consultas "quem está perto" sem testar todos contra todos.

export class SpatialGrid {
  constructor(cell = 64, buckets = 1024) {
    this.cell = cell;
    this.mask = buckets - 1;
    this.buckets = Array.from({ length: buckets }, () => []);
    this.used = [];
    this.stamp = 0;
  }

  clear() {
    for (let i = 0; i < this.used.length; i++) this.buckets[this.used[i]].length = 0;
    this.used.length = 0;
  }

  _key(cx, cy) { return (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & this.mask; }

  insert(e) {
    const k = this._key(Math.floor(e.cx / this.cell), Math.floor(e.cy / this.cell));
    const b = this.buckets[k];
    if (b.length === 0) this.used.push(k);
    b.push(e);
  }

  // Preenche `out` com entidades cujos centros estão em células que tocam o retângulo. Confira a distância depois.
  query(x0, y0, x1, y1, out) {
    out.length = 0;
    const s = ++this.stamp;
    const c0 = Math.floor(x0 / this.cell), c1 = Math.floor(x1 / this.cell);
    const r0 = Math.floor(y0 / this.cell), r1 = Math.floor(y1 / this.cell);
    for (let cx = c0; cx <= c1; cx++) {
      for (let cy = r0; cy <= r1; cy++) {
        const b = this.buckets[this._key(cx, cy)];
        for (let i = 0; i < b.length; i++) {
          const e = b[i];
          if (e._q === s) continue;
          e._q = s;
          out.push(e);
        }
      }
    }
    return out;
  }
}
