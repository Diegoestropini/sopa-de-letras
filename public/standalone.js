(function () {
  const globalStateKey = '__SOPA_READY__';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

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
    const maxCount = Math.min(12, Math.max(8, Math.floor(size)));
    const pool = CANDIDATE_WORDS.filter((w) => w.length >= 3 && w.length <= size);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, maxCount);
  }

  function showToast(message, kind) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || 'success');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity 160ms ease-out, transform 160ms ease-out';
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(function () {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 170);
    }, 1200);
  }

  function createWordPlacer(size) {
    function WordPlacer(size) {
      this.size = size;
      this.dirs = [
        { dr: 0, dc: 1 },
        { dr: 0, dc: -1 },
        { dr: 1, dc: 0 },
        { dr: -1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: -1, dc: -1 },
        { dr: 1, dc: -1 },
        { dr: -1, dc: 1 }
      ];
    }

    WordPlacer.prototype.placeAll = function (words, grid) {
      const placed = [];
      const N = this.size;
      const rand = function (n) { return Math.floor(Math.random() * n); };

      const fits = function (word, r, c, dr, dc) {
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

      const put = function (word, r, c, dr, dc) {
        const path = [];
        for (let i = 0; i < word.length; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          grid[rr][cc] = word[i];
          path.push({ r: rr, c: cc });
        }
        return path;
      };

      const sorted = words.slice().sort(function (a, b) { return b.length - a.length; });

      for (let wIdx = 0; wIdx < sorted.length; wIdx++) {
        const w = sorted[wIdx];
        const maxTries = 500;
        let placedOk = false;
        for (let t = 0; t < maxTries && !placedOk; t++) {
          const dir = this.dirs[rand(this.dirs.length)];
          const r = rand(N);
          const c = rand(N);
          if (fits(w, r, c, dir.dr, dir.dc)) {
            const path = put(w, r, c, dir.dr, dir.dc);
            placed.push({ word: w, path: path });
            placedOk = true;
          }
        }
        if (!placedOk) {
          const rw = w.split('').reverse().join('');
          for (let t = 0; t < maxTries && !placedOk; t++) {
            const dir = this.dirs[rand(this.dirs.length)];
            const r = rand(N);
            const c = rand(N);
            if (fits(rw, r, c, dir.dr, dir.dc)) {
              const path = put(rw, r, c, dir.dr, dir.dc);
              placed.push({ word: w, path: path });
              placedOk = true;
            }
          }
        }
      }

      return placed;
    };

    return new WordPlacer(size);
  }

  function WordSelection(boardEl, placed, size, onResolve) {
    this.boardEl = boardEl;
    this.placed = placed;
    this.size = size;
    this.onResolve = onResolve;
    this.startCell = null;
    this.currentPath = [];
    this.dir = null;
    this.found = {};
    this.cellEls = {};
    this._indexCells();
    this._bind();
  }

  WordSelection.prototype._indexCells = function () {
    const cells = this.boardEl.querySelectorAll('.cell');
    for (let i = 0; i < cells.length; i++) {
      const el = cells[i];
      const r = Number(el.getAttribute('data-r'));
      const c = Number(el.getAttribute('data-c'));
      this.cellEls[r + ',' + c] = el;
    }
  };

  WordSelection.prototype._bind = function () {
    const self = this;
    this.boardEl.addEventListener('click', function (e) { self._onClick(e); });
    this.boardEl.addEventListener('keydown', function (e) { self._onKeyDown(e); });
  };

  WordSelection.prototype._cellFromEvent = function (e) {
    let target = e.target;
    while (target && !target.classList.contains('cell')) {
      target = target.parentNode;
    }
    if (!target || !this.boardEl.contains(target)) return null;
    return { r: Number(target.getAttribute('data-r')), c: Number(target.getAttribute('data-c')) };
  };

  WordSelection.prototype._clearSelecting = function () {
    const selecting = this.boardEl.querySelectorAll('.cell.selecting');
    for (let i = 0; i < selecting.length; i++) {
      const el = selecting[i];
      el.classList.remove('selecting');
      if (!el.classList.contains('resolved')) {
        this._updateCellAccessibility(el, 'idle');
      }
    }
  };

  WordSelection.prototype._applySelecting = function (path) {
    this._clearSelecting();
    for (let i = 0; i < path.length; i++) {
      const pos = path[i];
      const key = pos.r + ',' + pos.c;
      const el = this.cellEls[key];
      if (el && !el.classList.contains('resolved')) {
        this._updateCellAccessibility(el, 'selecting');
      }
    }
  };

  WordSelection.prototype._updateCellAccessibility = function (el, state) {
    const letter = el.getAttribute('data-letter') || el.textContent;
    if (state === 'resolved') {
      el.classList.add('resolved');
      el.classList.remove('selecting');
      el.setAttribute('aria-selected', 'true');
      el.setAttribute('aria-label', 'Letra ' + letter + '. Resuelta');
      return;
    }
    if (state === 'selecting') {
      el.classList.add('selecting');
      el.setAttribute('aria-selected', 'true');
      el.setAttribute('aria-label', 'Letra ' + letter + '. Seleccionando');
      return;
    }
    el.classList.remove('selecting');
    if (!el.classList.contains('resolved')) {
      el.setAttribute('aria-selected', 'false');
      el.setAttribute('aria-label', 'Letra ' + letter + '. Sin seleccionar');
    }
  };

  WordSelection.prototype._lastSelected = function () {
    return this.currentPath.length ? this.currentPath[this.currentPath.length - 1] : null;
  };

  WordSelection.prototype._isAdjacent = function (a, b) {
    const dr = b.r - a.r;
    const dc = b.c - a.c;
    return Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && !(dr === 0 && dc === 0);
  };

  WordSelection.prototype._dirOf = function (a, b) {
    return { dr: Math.sign(b.r - a.r), dc: Math.sign(b.c - a.c) };
  };

  WordSelection.prototype._onClick = function (e) {
    const cell = this._cellFromEvent(e);
    if (!cell) return;
    this._handleSelection(cell);
  };

  WordSelection.prototype._onKeyDown = function (e) {
    const target = e.target;
    if (!target || !target.classList || !target.classList.contains('cell')) return;
    const r = Number(target.getAttribute('data-r'));
    const c = Number(target.getAttribute('data-c'));
    let handled = false;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      handled = true;
      const coords = this._nextCoordsForKey(e.key, r, c);
      if (coords.nextR !== r || coords.nextC !== c) {
        const next = this.cellEls[coords.nextR + ',' + coords.nextC];
        if (next) next.focus();
      }
    } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      handled = true;
      this._handleSelection({ r: r, c: c });
    }
    if (handled) {
      e.preventDefault();
    }
  };

  WordSelection.prototype._nextCoordsForKey = function (key, r, c) {
    let nextR = r;
    let nextC = c;
    if (key === 'ArrowUp') nextR = Math.max(0, r - 1);
    if (key === 'ArrowDown') nextR = Math.min(this.size - 1, r + 1);
    if (key === 'ArrowLeft') nextC = Math.max(0, c - 1);
    if (key === 'ArrowRight') nextC = Math.min(this.size - 1, c + 1);
    return { nextR: nextR, nextC: nextC };
  };

  WordSelection.prototype._handleSelection = function (cell) {
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
    if (!last || !this._isAdjacent(last, cell)) {
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
  };

  WordSelection.prototype._samePath = function (a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].r !== b[i].r || a[i].c !== b[i].c) return false;
    }
    return true;
  };

  WordSelection.prototype._reversePath = function (p) {
    const copy = [];
    for (let i = p.length - 1; i >= 0; i--) {
      copy.push(p[i]);
    }
    return copy;
  };

  WordSelection.prototype._resolvePath = function (path) {
    for (let i = 0; i < this.placed.length; i++) {
      const entry = this.placed[i];
      if (this.found[entry.word]) continue;
      if (this._samePath(path, entry.path) || this._samePath(path, this._reversePath(entry.path))) {
        for (let j = 0; j < entry.path.length; j++) {
          const pos = entry.path[j];
          const key = pos.r + ',' + pos.c;
          const el = this.cellEls[key];
          if (el) this._updateCellAccessibility(el, 'resolved');
        }
        this.found[entry.word] = true;
        if (typeof this.onResolve === 'function') {
          this.onResolve(entry.word);
        }
        return true;
      }
    }
    return false;
  };

  function WordSearch(size, words, mountEl) {
    this.size = size;
    this.words = (words || []).map(function (w) { return w.trim().replace(/\s+/g, '').toUpperCase(); });
    this.mountEl = mountEl;
    this.grid = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) row.push(null);
      this.grid.push(row);
    }
    this.placed = [];
    this.liveRegion = null;
  }

  WordSearch.prototype.generate = function () {
    const placer = createWordPlacer(this.size);
    this.placed = placer.placeAll(this.words, this.grid);
    this.words = this.placed.map(function (p) { return p.word; });
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === null) {
          this.grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
    return this;
  };

  WordSearch.prototype.render = function (wordListEl, toastFn) {
    this.mountEl.style.gridTemplateColumns = 'repeat(' + this.size + ', var(--cell-size))';
    this.mountEl.innerHTML = '';

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        const letter = this.grid[r][c];
        cell.className = 'cell';
        cell.textContent = letter;
        cell.setAttribute('data-r', String(r));
        cell.setAttribute('data-c', String(c));
        cell.setAttribute('data-letter', letter);
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-selected', 'false');
        cell.setAttribute('aria-label', 'Letra ' + letter + '. Sin seleccionar');
        this.mountEl.appendChild(cell);
      }
    }

    if (!this.liveRegion) {
      const region = document.createElement('div');
      region.className = 'sr-only';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      this.mountEl.insertAdjacentElement('afterend', region);
      this.liveRegion = region;
    }
    this.liveRegion.textContent = '';

    if (wordListEl) {
      wordListEl.innerHTML = '';
      for (let i = 0; i < this.words.length; i++) {
        const w = this.words[i];
        const li = document.createElement('li');
        li.textContent = w;
        li.id = 'word-' + w;
        wordListEl.appendChild(li);
      }
    }

    const selection = new WordSelection(this.mountEl, this.placed, this.size, function (word) {
      const item = document.getElementById('word-' + word);
      if (item) item.classList.add('resolved');
      if (typeof toastFn === 'function') {
        toastFn('¡Correcto! ' + word, 'success');
      }
      if (this.liveRegion) {
        this.liveRegion.textContent = 'Palabra ' + word + ' resuelta';
      }
      let allResolved = true;
      if (wordListEl) {
        for (let i = 0; i < wordListEl.children.length; i++) {
          if (!wordListEl.children[i].classList.contains('resolved')) {
            allResolved = false;
            break;
          }
        }
      }
      if (allResolved) {
        this._celebrate();
      }
    }.bind(this));

    return selection;
  };

  WordSearch.prototype._celebrate = function () {
    if (this.mountEl.animate) {
      this.mountEl.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.02)' },
        { transform: 'scale(1)' }
      ], { duration: 350, easing: 'ease-out' });
    }
  };

  function initLegacy() {
    if (window[globalStateKey] && window[globalStateKey].indexOf('legacy') === 0) {
      return;
    }
    window[globalStateKey] = 'legacy-loading';
    const app = document.getElementById('app');
    const wordListEl = document.getElementById('wordList');
    const sizeInput = document.getElementById('sizeInput');
    const regenBtn = document.getElementById('regenBtn');
    if (!app || !wordListEl || !sizeInput) {
      window[globalStateKey] = 'legacy-error';
      return;
    }

    let ws = null;
    function buildGame() {
      const rawSize = Number(sizeInput.value);
      const size = Math.max(6, Math.min(10, isNaN(rawSize) ? 10 : rawSize));
      sizeInput.value = String(size);
      const words = pickRandomWords(size);
      ws = new WordSearch(size, words, app);
      ws.generate();
      ws.render(wordListEl, showToast);
      showToast('Nueva sopa generada', 'info');
      return ws;
    }

    if (regenBtn) {
      regenBtn.addEventListener('click', buildGame);
    }

    buildGame();
    window[globalStateKey] = 'legacy';
    window.LegacyWordSearch = {
      buildGame: buildGame,
      getCurrentGame: function () { return ws; }
    };
  }

  function maybeInitLegacy() {
    const state = window[globalStateKey];
    if (state === 'module') return;
    if (state === 'module-loading') {
      setTimeout(maybeInitLegacy, 120);
      return;
    }
    const app = document.getElementById('app');
    if (!app) return;
    if (app.querySelector('.cell')) return;
    initLegacy();
  }

  ready(maybeInitLegacy);
})();
