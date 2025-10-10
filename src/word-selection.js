export class WordSelection {
  constructor(boardEl, placed, size, onResolve) {
    this.boardEl = boardEl;
    this.placed = placed; // array de {word, path:[{r,c}]}
    this.size = size;
    this.onResolve = onResolve;
    this.startCell = null; // {r,c}
    this.currentPath = [];
    this.dir = null; // {dr, dc}
    this.found = new Set();
    this.cellEls = new Map(); // clave "r,c" -> elemento
    this._indexCells();
    this._bind();
  }

  _indexCells() {
    this.boardEl.querySelectorAll('.cell').forEach((el) => {
      const r = Number(el.dataset.r);
      const c = Number(el.dataset.c);
      this.cellEls.set(`${r},${c}`, el);
    });
  }

  _bind() {
    this.boardEl.addEventListener('click', (e) => this._onClick(e));
  }

  _cellFromEvent(e) {
    const target = e.target.closest('.cell');
    if (!target || !this.boardEl.contains(target)) return null;
    return { r: Number(target.dataset.r), c: Number(target.dataset.c) };
  }

  _clearSelecting() {
    for (const el of this.boardEl.querySelectorAll('.cell.selecting')) {
      el.classList.remove('selecting');
    }
  }

  _applySelecting(path) {
    this._clearSelecting();
    for (const { r, c } of path) {
      const el = this.cellEls.get(`${r},${c}`);
      if (el && !el.classList.contains('resolved')) el.classList.add('selecting');
    }
  }

  _lastSelected() {
    return this.currentPath[this.currentPath.length - 1] || null;
  }

  _isAdjacent(a, b) {
    const dr = b.r - a.r;
    const dc = b.c - a.c;
    return Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && !(dr === 0 && dc === 0);
  }

  _dirOf(a, b) {
    return { dr: Math.sign(b.r - a.r), dc: Math.sign(b.c - a.c) };
  }

  _lineBetween(a, b) {
    const dr = Math.sign(b.r - a.r);
    const dc = Math.sign(b.c - a.c);
    if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return [];
    if (dr === 0 && dc === 0) return [a];
    const path = [];
    let r = a.r, c = a.c;
    while (true) {
      path.push({ r, c });
      if (r === b.r && c === b.c) break;
      r += dr;
      c += dc;
      if (r < 0 || r >= this.size || c < 0 || c >= this.size) return [];
    }
    return path;
  }

  _onClick(e) {
    const cell = this._cellFromEvent(e);
    if (!cell) return;
    if (!this.startCell) {
      this.startCell = cell;
      this.currentPath = [cell];
      this.dir = null;
      this._applySelecting(this.currentPath);
      return;
    }

    if (cell.r === this.startCell.r && cell.c === this.startCell.c) {
      this.startCell = null;
      this.currentPath = [];
      this.dir = null;
      this._clearSelecting();
      return;
    }

    const last = this._lastSelected();
    if (!this._isAdjacent(last, cell)) {
      return;
    }

    const stepDir = this._dirOf(last, cell);
    if (!this.dir) {
      this.dir = stepDir;
    } else if (this.dir.dr !== stepDir.dr || this.dir.dc !== stepDir.dc) {
      return;
    }

    this.currentPath.push(cell);
    this._applySelecting(this.currentPath);

    const wasMatch = this._resolvePath(this.currentPath);
    if (wasMatch) {
      this.startCell = null;
      this.currentPath = [];
      this.dir = null;
      this._clearSelecting();
    }
  }

  _samePath(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].r !== b[i].r || a[i].c !== b[i].c) return false;
    }
    return true;
  }

  _reversePath(p) {
    return [...p].reverse();
  }

  _resolvePath(path) {
    for (const entry of this.placed) {
      if (this.found.has(entry.word)) continue;
      if (this._samePath(path, entry.path) || this._samePath(path, this._reversePath(entry.path))) {
        for (const { r, c } of entry.path) {
          const el = this.cellEls.get(`${r},${c}`);
          if (el) el.classList.add('resolved');
        }
        this.found.add(entry.word);
        this.onResolve?.(entry.word);
        return true;
      }
    }
    return false;
  }
}
