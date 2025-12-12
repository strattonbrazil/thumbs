import React, { useRef, useEffect, useState, useCallback } from 'react';
import Button from '@mui/material/Button';

interface NativeTextureAPI {
  generateGradient: () => Buffer;
  generateCheckerboard: (size: number) => Buffer;
  generatePlasma: (time: number) => Buffer;
  getWidth: () => number;
  getHeight: () => number;
}

declare global {
  interface Window {
    nativeTexture: NativeTextureAPI;
  }
}

const WIDTH = 512;
const HEIGHT = 512;

const TextureRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [info, setInfo] = useState<string>('Ready! Texture generator initialized with Rust backend.');
  const animationIdRef = useRef<number | null>(null);

  const renderTexture = useCallback((buffer: Buffer): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(WIDTH, HEIGHT);
    
    // Copy buffer data to ImageData
    for (let i = 0; i < buffer.length; i++) {
      imageData.data[i] = buffer[i];
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, []);

  const stopAnimation = useCallback((): void => {
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, []);

  const handleGradient = useCallback(() => {
    stopAnimation();
    setInfo('Rendering gradient texture from Rust...');
    
    const buffer = window.nativeTexture.generateGradient();
    renderTexture(buffer);
    
    setInfo(`Gradient texture rendered (${WIDTH}x${HEIGHT} pixels, ${buffer.length} bytes from Rust)`);
  }, [renderTexture, stopAnimation]);

  const handleCheckerboard = useCallback(() => {
    stopAnimation();
    setInfo('Rendering checkerboard texture from Rust...');
    
    const buffer = window.nativeTexture.generateCheckerboard(32);
    renderTexture(buffer);
    
    setInfo(`Checkerboard texture rendered (${WIDTH}x${HEIGHT} pixels, ${buffer.length} bytes from Rust)`);
  }, [renderTexture, stopAnimation]);

  const handlePlasma = useCallback(() => {
    stopAnimation();
    setInfo('Animating plasma effect from Rust...');
    
    const startTime = Date.now();
    
    const animate = (): void => {
      const elapsed = (Date.now() - startTime) / 1000.0;
      const buffer = window.nativeTexture.generatePlasma(elapsed);
      renderTexture(buffer);
      
      animationIdRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  }, [renderTexture, stopAnimation]);

  const handleStopAnimation = useCallback(() => {
    stopAnimation();
    setInfo('Animation stopped');
  }, [stopAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return (
    <div>
      <h1>Rust Native Texture Renderer</h1>

      <div>
        <Button variant="contained" color="primary" onClick={handleGradient} sx={{ mr: 1 }}>
          Generate Gradient
        </Button>
        <Button variant="contained" color="primary" onClick={handleCheckerboard} sx={{ mr: 1 }}>
          Generate Checkerboard
        </Button>
        <Button variant="contained" color="primary" onClick={handlePlasma} sx={{ mr: 1 }}>
          Animated Plasma
        </Button>
        <Button variant="contained" color="primary" onClick={handleStopAnimation}>
          Stop Animation
        </Button>
      </div>

      <div>{info}</div>

      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{ display: 'block', margin: '20px auto' }} />
    </div>
  );
};

// Minimal styling only for canvas centering
// (most styles removed per request)

export default TextureRenderer;

