// Sopa de Letras: WordSearch (grid), WordPlacer (placement), WordSelection (interaction)

class WordPlacer {
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
      // If we fail to place a word, we can try reversing it
      if (!placedOk) {
        const rw = w.split("").reverse().join("");
        for (let t = 0; t < maxTries && !placedOk; t++) {
          const dir = this.dirs[rand(this.dirs.length)];
          const r = rand(N);
          const c = rand(N);
          if (fits(rw, r, c, dir.dr, dir.dc)) {
            const path = put(rw, r, c, dir.dr, dir.dc);
            placed.push({ word: w, path }); // store original word, but path for reversed
            placedOk = true;
          }
        }
      }
    }

    return placed;
  }
}

class WordSelection {
  constructor(boardEl, placed, size, onResolve) {
    this.boardEl = boardEl;
    this.placed = placed; // array of {word, path:[{r,c}]}
    this.size = size;
    this.onResolve = onResolve;
    this.startCell = null; // {r,c}
    this.currentPath = []; // persistent until match or cancel
    this.dir = null; // {dr, dc} fixed after second click
    this.found = new Set();
    this.cellEls = new Map(); // key "r,c" -> element
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
    // must be straight or diagonal
    if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return [];
    // but both zero means same cell
    if (dr === 0 && dc === 0) return [a];
    const path = [];
    let r = a.r, c = a.c;
    while (true) {
      path.push({ r, c });
      if (r === b.r && c === b.c) break;
      r += dr; c += dc;
      if (r < 0 || r >= this.size || c < 0 || c >= this.size) return [];
    }
    return path;
  }

  _onClick(e) {
    const cell = this._cellFromEvent(e);
    if (!cell) return;
    // First click: set start and mark it
    if (!this.startCell) {
      this.startCell = cell;
      this.currentPath = [cell];
      this.dir = null;
      this._applySelecting(this.currentPath);
      return;
    }

    // Click same cell toggles/cancels selection
    if (cell.r === this.startCell.r && cell.c === this.startCell.c) {
      this.startCell = null;
      this.currentPath = [];
      this.dir = null;
      this._clearSelecting();
      return;
    }

    // Step-by-step extension: must be adjacent to last selection
    const last = this._lastSelected();
    if (!this._isAdjacent(last, cell)) {
      return; // ignore non-adjacent clicks
    }

    // Fix direction on second click; enforce same direction afterward
    const stepDir = this._dirOf(last, cell);
    if (!this.dir) {
      this.dir = stepDir;
    } else if (this.dir.dr !== stepDir.dr || this.dir.dc !== stepDir.dc) {
      return; // ignore if direction changes
    }

    // Append and render
    this.currentPath.push(cell);
    this._applySelecting(this.currentPath);

    // Try resolve on each step
    const wasMatch = this._resolvePath(this.currentPath);
    if (wasMatch) {
      // Clear temporary selection after resolving
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
    // Try to match against any placed word path (or reversed)
    for (const entry of this.placed) {
      if (this.found.has(entry.word)) continue;
      if (this._samePath(path, entry.path) || this._samePath(path, this._reversePath(entry.path))) {
        // mark resolved
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

  // Drag-based handlers removed to favor click-based persistent selection
}

class WordSearch {
  constructor(size, words, mountEl) {
    this.size = size;
    this.words = (words || []).map((w) => w.trim().replace(/\s+/g, '').toUpperCase());
    this.mountEl = mountEl;
    this.grid = Array.from({ length: size }, () => Array(size).fill(null));
    this.placed = [];
  }

  generate() {
    const placer = new WordPlacer(this.size);
    this.placed = placer.placeAll(this.words, this.grid);
    // Ajustar la lista visible solo a palabras colocadas
    this.words = this.placed.map((p) => p.word);
    // fill empty spots with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === null) {
          this.grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
    return this;
  }

  render(wordListEl, toastFn) {
    // grid styling columns
    this.mountEl.style.gridTemplateColumns = `repeat(${this.size}, var(--cell-size))`;
    this.mountEl.innerHTML = '';

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = this.grid[r][c];
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        cell.setAttribute('role', 'gridcell');
        this.mountEl.appendChild(cell);
      }
    }

    if (wordListEl) {
      wordListEl.innerHTML = '';
      for (const w of this.words) {
        const li = document.createElement('li');
        li.textContent = w;
        li.id = `word-${w}`;
        wordListEl.appendChild(li);
      }
    }

    // selection controller
    const selection = new WordSelection(this.mountEl, this.placed, this.size, (word) => {
      const item = document.getElementById(`word-${word}`);
      if (item) item.classList.add('resolved');
      toastFn?.(`¡Correcto! ${word}`, 'success');
      // check victory
      const allResolved = [...(wordListEl?.children || [])].every((li) => li.classList.contains('resolved'));
      if (allResolved) {
        this._celebrate();
      }
    });

    return selection;
  }

  _celebrate() {
    // small visual feedback
    this.mountEl.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.02)' },
      { transform: 'scale(1)' },
    ], { duration: 350, easing: 'ease-out' });
  }
}

// --- Bootstrap ---
(function init() {
  const app = document.getElementById('app');
  const wordListEl = document.getElementById('wordList');
  const sizeInput = document.getElementById('sizeInput');
  const regenBtn = document.getElementById('regenBtn');
  const toastContainer = document.getElementById('toastContainer');

  // Diccionario base de palabras (ES). Se filtran por tamaño.
  const CANDIDATE_WORDS = [
    'JAVASCRIPT','CODIGO','CLASE','OBJETO','METODO','EVENTO','SOPA','LETRAS','GRID','RATON','TECLADO','DOM',
    'NAVEGADOR','CSS','HTML','FUNCION','VARIABLE','ARREGLO','LISTA','MAPA','CADENA','NUMERO','BOOLEANO','BROWSER',
    'MODULO','IMPORTAR','EXPORTAR','ASYNC','AWAIT','PROMESA','RECURSO','ARCHIVO','PANTALLA','VENTANA','CURSOR',
    'DRAG','DROP','PUNTERO','TOQUE','TEXTO','FLECHA','DIAGONAL','VERTICAL','HORIZONTAL','LOGICA','ESTADO','RENDER',
    'COLOR','FUENTE','TABLERO','TABLA','CELDA','MATRIZ','BUSCAR','ENCONTRAR','SELECCION','RESUELTO','CORRECTO',
    'AZAR','ALEATORIO','LENGUAJE','SISTEMA','JUEGO','PALABRA','DIRECCION','TRAZO','LAPIZ','RUTA','INDICE','ORDEN',
    'ALGORITMO','DATOS','ENTRADA','SALIDA','PATRON','CLICKS','TOCAR','MOVER','SOLTAR','INICIO','FINAL'
  ];

  function pickRandomWords(size) {
    const maxCount = Math.min(12, Math.max(8, Math.floor(size))); // 8–12 palabras
    const pool = CANDIDATE_WORDS.filter(w => w.length >= 3 && w.length <= size);
    // Mezclar
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, maxCount);
  }

  function showToast(message, kind = 'success') {
    if (!toastContainer) return;
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 160ms ease-out, transform 160ms ease-out';
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => el.remove(), 170);
    }, 1200);
  }

  let ws = null;
  function build() {
    const size = Math.max(6, Math.min(20, Number(sizeInput.value) || 12));
    sizeInput.value = String(size);
    const words = pickRandomWords(size);
    ws = new WordSearch(size, words, app);
    ws.generate();
    ws.render(wordListEl, showToast);
    showToast('Nueva sopa generada', 'info');
  }

  regenBtn.addEventListener('click', build);
  build();
})();
