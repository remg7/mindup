# MindUP 🧠✨

> **MindUP** es una plataforma moderna e interactiva diseñada para potenciar la salud mental, la concentración y el bienestar emocional mediante herramientas de biofeedback simulado, meditaciones guiadas, gestión de estado de ánimo y sonido ambiente focalizado.

---

## 📋 Lista de Verificación del Equipo (Team Readiness Checklist)

Para asegurar un desarrollo eficiente y coordinado, el equipo cuenta con:

- [x] **Repositorio en Git**: Inicializado con su *initial commit* y política de gitignore adecuada.
- [x] **Estructura Modular del Proyecto**: Organización limpia de componentes, estilos y activos.
- [x] **Sistema de Diseño (Design Tokens)**: Paleta cromática adaptada a bienestar (colores relajantes HSL, dark mode, glassmorphic UI, animaciones fluidas).
- [x] **Entorno de Desarrollo**: Configuración lista con Vite, HMR y servidor rápido.
- [x] **Documentación de API y Entorno**: Plantilla `.env.example` y README estructurado.

---

## 🛠️ Tecnologías Utilizadas

- **Core**: HTML5 Semántico, JavaScript (ESNext Modules).
- **Estilos**: CSS Vanilla con CSS Custom Properties (Design System, Flexbox/Grid, Glassmorphism, Micro-interacciones).
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/).
- **Control de Versiones**: Git.

---

## 📁 Estructura del Proyecto

```text
mindup/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── README.md
└── src/
    ├── main.js
    └── styles/
        └── main.css
```

---

## 🚀 Guía de Inicio Rápido

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn

### Instalación de dependencias

```bash
npm install
```

### Ejecutar en modo desarrollo

```bash
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

### Compilación para producción

```bash
npm run build
```

---

## 🌿 Convención de Ramas (Git Branching Model)

- `main`: Código listo para producción.
- `develop`: Rama principal de integración de funciones.
- `feature/<nombre-feature>`: Nuevas características.
- `bugfix/<nombre-fix>`: Corrección de errores.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
