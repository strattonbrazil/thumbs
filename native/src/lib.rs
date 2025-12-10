#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi]
pub struct TextureGenerator {
    width: u32,
    height: u32,
}

#[napi]
impl TextureGenerator {
    #[napi(constructor)]
    pub fn new(width: u32, height: u32) -> Self {
        TextureGenerator { width, height }
    }

    /// Generate a procedural texture (gradient pattern)
    #[napi]
    pub fn generate_gradient(&self) -> Buffer {
        let mut data = Vec::with_capacity((self.width * self.height * 4) as usize);
        
        for y in 0..self.height {
            for x in 0..self.width {
                let r = ((x as f32 / self.width as f32) * 255.0) as u8;
                let g = ((y as f32 / self.height as f32) * 255.0) as u8;
                let b = 128;
                let a = 255;
                
                data.push(r);
                data.push(g);
                data.push(b);
                data.push(a);
            }
        }
        
        Buffer::from(data)
    }

    /// Generate a checkerboard pattern
    #[napi]
    pub fn generate_checkerboard(&self, square_size: u32) -> Buffer {
        let mut data = Vec::with_capacity((self.width * self.height * 4) as usize);
        
        for y in 0..self.height {
            for x in 0..self.width {
                let checker = ((x / square_size) + (y / square_size)) % 2;
                let color = if checker == 0 { 255 } else { 0 };
                
                data.push(color);
                data.push(color);
                data.push(color);
                data.push(255);
            }
        }
        
        Buffer::from(data)
    }

    /// Generate a plasma effect
    #[napi]
    pub fn generate_plasma(&self, time: f64) -> Buffer {
        let mut data = Vec::with_capacity((self.width * self.height * 4) as usize);
        
        for y in 0..self.height {
            for x in 0..self.width {
                let x_norm = x as f64 / self.width as f64;
                let y_norm = y as f64 / self.height as f64;
                
                let v = (x_norm * 10.0 + time).sin() * 0.5
                    + (y_norm * 10.0 + time).sin() * 0.5
                    + ((x_norm * 10.0 + y_norm * 10.0 + time) * 0.5).sin() * 0.5;
                
                let color = ((v + 1.5) * 85.0) as u8;
                
                data.push(color);
                data.push(color);
                data.push(255 - color);
                data.push(255);
            }
        }
        
        Buffer::from(data)
    }

    #[napi]
    pub fn get_width(&self) -> u32 {
        self.width
    }

    #[napi]
    pub fn get_height(&self) -> u32 {
        self.height
    }
}
