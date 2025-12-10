const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const info = document.getElementById('info');

const WIDTH = 512;
const HEIGHT = 512;

let animationId = null;

function renderTexture(buffer) {
  const imageData = ctx.createImageData(WIDTH, HEIGHT);
  
  // Copy buffer data to ImageData
  for (let i = 0; i < buffer.length; i++) {
    imageData.data[i] = buffer[i];
  }
  
  ctx.putImageData(imageData, 0, 0);
}

document.getElementById('btnGradient').addEventListener('click', () => {
  stopAnimation();
  info.textContent = 'Rendering gradient texture from Rust...';
  
  const buffer = window.nativeTexture.generateGradient();
  renderTexture(buffer);
  
  info.textContent = `Gradient texture rendered (${WIDTH}x${HEIGHT} pixels, ${buffer.length} bytes from Rust)`;
});

document.getElementById('btnCheckerboard').addEventListener('click', () => {
  stopAnimation();
  info.textContent = 'Rendering checkerboard texture from Rust...';
  
  const buffer = window.nativeTexture.generateCheckerboard(32);
  renderTexture(buffer);
  
  info.textContent = `Checkerboard texture rendered (${WIDTH}x${HEIGHT} pixels, ${buffer.length} bytes from Rust)`;
});

document.getElementById('btnPlasma').addEventListener('click', () => {
  stopAnimation();
  info.textContent = 'Animating plasma effect from Rust...';
  
  let startTime = Date.now();
  
  function animate() {
    const elapsed = (Date.now() - startTime) / 1000.0;
    const buffer = window.nativeTexture.generatePlasma(elapsed);
    renderTexture(buffer);
    
    animationId = requestAnimationFrame(animate);
  }
  
  animate();
});

document.getElementById('btnStopAnimation').addEventListener('click', () => {
  stopAnimation();
  info.textContent = 'Animation stopped';
});

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// Initial render
info.textContent = 'Ready! Texture generator initialized with Rust backend.';
