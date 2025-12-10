const { contextBridge } = require('electron');
const path = require('path');

const { TextureGenerator } = require(path.join(__dirname, 'native'));

// Create a single generator instance
const generator = new TextureGenerator(512, 512);

contextBridge.exposeInMainWorld('nativeTexture', {
  generateGradient: () => generator.generateGradient(),
  generateCheckerboard: (size) => generator.generateCheckerboard(size),
  generatePlasma: (time) => generator.generatePlasma(time),
  getWidth: () => generator.getWidth(),
  getHeight: () => generator.getHeight()
});
