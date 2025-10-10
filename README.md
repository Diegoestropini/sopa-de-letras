# Sopa de letras

Este repositorio contiene una pequeña aplicación web que genera sopas de letras de manera dinámica usando JavaScript moderno y Vite.

## Características
- Generación programática del tablero con palabras en diferentes orientaciones.
- Selección interactiva de letras para marcar palabras encontradas.
- Separación modular de la lógica para facilitar el mantenimiento del código.

## Requisitos
- Node.js 18 o superior
- npm 9 o superior

## Instalación
```bash
npm install
```

## Scripts disponibles
- `npm run dev`: inicia el servidor de desarrollo de Vite con recarga en caliente.
- `npm run build`: genera la versión lista para producción en la carpeta `dist`.
- `npm run preview`: sirve localmente la compilación de producción.

## Estructura del proyecto
```
├── index.html           # Punto de entrada HTML
├── styles.css           # Estilos globales de la aplicación
├── src/
│   ├── main.js          # Configuración inicial del juego y unión de módulos
│   ├── word-placer.js   # Lógica para colocar palabras en la cuadrícula
│   ├── word-search.js   # Utilidades para buscar coincidencias en el tablero
│   └── word-selection.js # Manejo de interacciones del usuario
└── standalone.js        # Versión independiente sin bundler
```

## Desarrollo
1. Ejecuta `npm run dev`.
2. Abre `http://localhost:5173` en tu navegador.
3. Modifica los archivos dentro de `src/` para ajustar la lógica del juego.

## Construcción y despliegue
1. Ejecuta `npm run build` para generar la carpeta `dist`.
2. Sube el contenido de `dist` a un hosting estático como Netlify, GitHub Pages o Vercel.

## Licencia
Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo `LICENSE` si está disponible o agrega uno antes de publicar.
