export class WordPlacer {
  constructor(size) {
    this.size = size;
    // 8 directions: E, W, S, N, SE, NW, SW, NE
    this.dirs = [
      { dr: 0, dc: 1 },
      { dr: 0, dc: -1 },
      { dr: 1, dc: 0 },
      { dr: -1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: -1, dc: -1 },
      { dr: 1, dc: -1 },
      { dr: -1, dc: 1 },
    ];
  }

  placeAll(words, grid) {
    const placed = [];
    const N = this.size;
    const rand = (n) => Math.floor(Math.random() * n);

    const fits = (word, r, c, dr, dc) => {
      const L = word.length;
      const endR = r + dr * (L - 1);
      const endC = c + dc * (L - 1);
      if (endR < 0 || endR >= N || endC < 0 || endC >= N) return false;
      for (let i = 0; i < L; i++) {
        const rr = r + dr * i;
        const cc = c + dc * i;
        const ch = grid[rr][cc];
        if (ch !== null && ch !== word[i]) return false;
      }
      return true;
    };

    const put = (word, r, c, dr, dc) => {
      const path = [];
      for (let i = 0; i < word.length; i++) {
        const rr = r + dr * i;
        const cc = c + dc * i;
        grid[rr][cc] = word[i];
        path.push({ r: rr, c: cc });
      }
      return path;
    };

    // Sort words by length desc to reduce conflicts
    const sorted = [...words].sort((a, b) => b.length - a.length);

    for (const w of sorted) {
      const maxTries = 500;
      let placedOk = false;
      for (let t = 0; t < maxTries && !placedOk; t++) {
        const dir = this.dirs[rand(this.dirs.length)];
        const r = rand(N);
        const c = rand(N);
        if (fits(w, r, c, dir.dr, dir.dc)) {
          const path = put(w, r, c, dir.dr, dir.dc);
          placed.push({ word: w, path });
          placedOk = true;
        }
      }
      // If we fail to place a word, try reversing it
      if (!placedOk) {
        const rw = w.split("").reverse().join("");
        for (let t = 0; t < maxTries && !placedOk; t++) {
          const dir = this.dirs[rand(this.dirs.length)];
          const r = rand(N);
          const c = rand(N);
          if (fits(rw, r, c, dir.dr, dir.dc)) {
            const path = put(rw, r, c, dir.dr, dir.dc);
            placed.push({ word: w, path });
            placedOk = true;
          }
        }
      }
    }

    return placed;
  }
}
