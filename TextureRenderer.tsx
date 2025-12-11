import React, { useRef, useEffect, useState, useCallback } from 'react';

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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
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
    <div style={styles.textureContainer}>
      <h1 style={styles.title}>🎨 Rust Native Texture Renderer</h1>
      
      <div style={styles.controls}>
        <button
          style={{
            ...styles.button,
            ...(hoveredButton === 'gradient' ? styles.buttonHover : {}),
          }}
          onClick={handleGradient}
          onMouseEnter={() => setHoveredButton('gradient')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Generate Gradient
        </button>
        <button
          style={{
            ...styles.button,
            ...(hoveredButton === 'checkerboard' ? styles.buttonHover : {}),
          }}
          onClick={handleCheckerboard}
          onMouseEnter={() => setHoveredButton('checkerboard')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Generate Checkerboard
        </button>
        <button
          style={{
            ...styles.button,
            ...(hoveredButton === 'plasma' ? styles.buttonHover : {}),
          }}
          onClick={handlePlasma}
          onMouseEnter={() => setHoveredButton('plasma')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Animated Plasma
        </button>
        <button
          style={{
            ...styles.button,
            ...(hoveredButton === 'stop' ? styles.buttonHover : {}),
          }}
          onClick={handleStopAnimation}
          onMouseEnter={() => setHoveredButton('stop')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Stop Animation
        </button>
      </div>
      
      <div style={styles.info}>{info}</div>
      
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={styles.canvas}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  textureContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  title: {
    textAlign: 'center',
    color: '#fff',
  },
  controls: {
    margin: '20px 0',
    padding: '15px',
    background: '#2d2d2d',
    borderRadius: '8px',
  },
  button: {
    margin: '5px',
    padding: '10px 20px',
    background: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buttonHover: {
    background: '#106ebe',
  },
  info: {
    textAlign: 'center',
    margin: '10px 0',
    color: '#aaa',
  },
  canvas: {
    border: '2px solid #444',
    display: 'block',
    margin: '20px auto',
    background: '#000',
  },
};

export default TextureRenderer;

