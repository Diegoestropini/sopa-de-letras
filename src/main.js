import { WordPlacer } from './word-placer.js';
import { WordSelection } from './word-selection.js';
import { WordSearch } from './word-search.js';

export { WordPlacer, WordSelection, WordSearch };

if (typeof window !== 'undefined') {
  window.__SOPA_READY__ = window.__SOPA_READY__ || 'module-loading';
}

const app = document.getElementById('app');
const wordListEl = document.getElementById('wordList');
const sizeInput = document.getElementById('sizeInput');
const regenBtn = document.getElementById('regenBtn');
const toastContainer = document.getElementById('toastContainer');
const shouldInitModule =
  typeof window === 'undefined' ||
  window.__SOPA_READY__ === undefined ||
  window.__SOPA_READY__ === 'module-loading';

const CANDIDATE_WORDS = [
  'JAVASCRIPT','CODIGO','CLASE','OBJETO','METODO','EVENTO','SOPA','LETRAS','GRID','RATON','TECLADO','DOM',
  'NAVEGADOR','CSS','HTML','FUNCION','VARIABLE','ARREGLO','LISTA','MAPA','CADENA','NUMERO','BOOLEANO','BROWSER',
  'MODULO','IMPORTAR','EXPORTAR','ASYNC','AWAIT','PROMESA','RECURSO','ARCHIVO','PANTALLA','VENTANA','CURSOR',
  'DRAG','DROP','PUNTERO','TOQUE','TEXTO','FLECHA','DIAGONAL','VERTICAL','HORIZONTAL','LOGICA','ESTADO','RENDER',
  'COLOR','FUENTE','TABLERO','TABLA','CELDA','MATRIZ','BUSCAR','ENCONTRAR','SELECCION','RESUELTO','CORRECTO',
  'AZAR','ALEATORIO','LENGUAJE','SISTEMA','JUEGO','PALABRA','DIRECCION','TRAZO','LAPIZ','RUTA','INDICE','ORDEN',
  'ALGORITMO','DATOS','ENTRADA','SALIDA','PATRON','CLICKS','TOCAR','MOVER','SOLTAR','INICIO','FINAL'
];

export function pickRandomWords(size) {
  const maxCount = Math.min(12, Math.max(8, Math.floor(size)));
  const maxLength = Math.min(size, 9);
  const pool = CANDIDATE_WORDS.filter((w) => w.length >= 3 && w.length <= maxLength);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, maxCount);
}

export function showToast(message, kind = 'success') {
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

export function buildGame() {
  const size = Math.max(6, Math.min(20, Number(sizeInput.value) || 12));
  sizeInput.value = String(size);
  const words = pickRandomWords(size);
  ws = new WordSearch(size, words, app);
  ws.generate();
  ws.render(wordListEl, showToast);
  showToast('Nueva sopa generada', 'info');
  if (typeof window !== 'undefined') {
    window.__SOPA_READY__ = 'module';
  }
  return ws;
}

if (shouldInitModule && regenBtn) {
  regenBtn.addEventListener('click', buildGame);
}

if (shouldInitModule && app && wordListEl && sizeInput) {
  buildGame();
}

export function getCurrentGame() {
  return ws;
}
