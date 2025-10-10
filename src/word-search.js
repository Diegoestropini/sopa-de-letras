import { WordPlacer } from './word-placer.js';
import { WordSelection } from './word-selection.js';

export class WordSearch {
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
    this.words = this.placed.map((p) => p.word);
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

    const selection = new WordSelection(this.mountEl, this.placed, this.size, (word) => {
      const item = document.getElementById(`word-${word}`);
      if (item) item.classList.add('resolved');
      toastFn?.(`¡Correcto! ${word}`, 'success');
      const allResolved = [...(wordListEl?.children || [])].every((li) => li.classList.contains('resolved'));
      if (allResolved) {
        this._celebrate();
      }
    });

    return selection;
  }

  _celebrate() {
    this.mountEl.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.02)' },
      { transform: 'scale(1)' },
    ], { duration: 350, easing: 'ease-out' });
  }
}
