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

- **JS changes**: Just restart the app
- **Rust changes**: Run `npm run build-native` then restart
