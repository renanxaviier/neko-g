// Gerador xorshift32 determinístico (mesma semente = mesma sequência).

export class Rng {
  constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  nextU() {
    let x = this.s;
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    this.s = x;
    return x;
  }
  next() { return (this.nextU() >>> 8) / 16777216; }       // [0, 1)
  range(a, b) { return a + this.next() * (b - a); }
  int(a, bExcl) { return a + Math.floor(this.next() * (bExcl - a)); }
  chance(p) { return this.next() < p; }
}

export function hash(seed, v) {
  let h = (seed ^ Math.imul(v | 0, 0x9e3779b1)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

// Sorteio ponderado sobre uma lista de {w}.
export function weightedIndex(rng, items, weightOf) {
  let total = 0;
  for (let i = 0; i < items.length; i++) total += weightOf(items[i]);
  if (total <= 0) return -1;
  let roll = rng.next() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weightOf(items[i]);
    if (roll < 0) return i;
  }
  return items.length - 1;
}
