# Electron + Rust Texture Renderer

Demonstrates integrating Rust native code with Electron for real-time procedural texture generation.

## Prerequisites
- Node.js
- Rust

## Build & Run

```bash
# Install dependencies
npm install
cd native && npm install && cd ..

# Build native module
npm run build-native

# Run the app
npm start
```

## Development

### Live Reloading

For development with automatic reloading on file changes:

```bash
npm run dev
```

This will:
- Watch for changes in TypeScript files (main, preload, renderer, App)
- Automatically rebuild when files change
- Reload the Electron window when renderer files change
- Restart the app when main/preload files change

### Manual Build

```bash
# Build once
npm run build

# Run the app
npm start
```

### File Changes

- **TypeScript/React changes**: Automatically reloaded when using `npm run dev`
- **Rust changes**: Run `npm run build-native` then the app will reload
