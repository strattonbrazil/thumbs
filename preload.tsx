import { contextBridge } from 'electron';
import * as path from 'path';

// Use require for native module (CommonJS)
const { TextureGenerator, getDirChildren } = require(path.join(__dirname, '..', 'native'));

// Create a single generator instance
const generator = new TextureGenerator(512, 512);

interface DirectoryInfo {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface NativeTextureAPI {
  generateGradient: () => Buffer;
  generateCheckerboard: (size: number) => Buffer;
  generatePlasma: (time: number) => Buffer;
  getWidth: () => number;
  getHeight: () => number;
}

interface NativeDirectoryAPI {
  getDirChildren: (relativePath: string) => DirectoryInfo;
}

contextBridge.exposeInMainWorld('nativeTexture', {
  generateGradient: () => generator.generateGradient(),
  generateCheckerboard: (size: number) => generator.generateCheckerboard(size),
  generatePlasma: (time: number) => generator.generatePlasma(time),
  getWidth: () => generator.getWidth(),
  getHeight: () => generator.getHeight()
} as NativeTextureAPI);

contextBridge.exposeInMainWorld('nativeDirectory', {
  getDirChildren: (relativePath: string) => getDirChildren(relativePath)
} as NativeDirectoryAPI);

declare global {
  interface Window {
    nativeTexture: NativeTextureAPI;
    nativeDirectory: NativeDirectoryAPI;
  }
}
