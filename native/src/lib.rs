#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::fs;

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

/// Directory information
#[napi(object)]
pub struct DirectoryInfo {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

/// List directories in a given path (relative to user's home directory)
#[napi]
pub fn list_directories(relative_path: String) -> Result<Vec<DirectoryInfo>> {
    // Get user's home directory
    let home_dir = dirs::home_dir()
        .ok_or_else(|| Error::from_reason("Could not determine home directory"))?;
    
    // Build absolute path
    let absolute_path = if relative_path.is_empty() || relative_path == "." {
        home_dir
    } else {
        home_dir.join(relative_path)
    };
    
    // Check if path exists and is a directory
    if !absolute_path.exists() {
        return Err(Error::from_reason(format!(
            "Path does not exist: {}",
            absolute_path.display()
        )));
    }
    
    if !absolute_path.is_dir() {
        return Err(Error::from_reason(format!(
            "Path is not a directory: {}",
            absolute_path.display()
        )));
    }
    
    // Read directory entries
    let entries = fs::read_dir(&absolute_path)
        .map_err(|e| Error::from_reason(format!("Failed to read directory: {}", e)))?;
    
    let mut directories = Vec::new();
    
    for entry in entries {
        let entry = entry.map_err(|e| Error::from_reason(format!("Failed to read entry: {}", e)))?;
        let path = entry.path();
        
        // Only include directories
        if path.is_dir() {
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();
            
            // Skip hidden directories (those starting with a dot)
            if name.starts_with('.') {
                continue;
            }
            
            let full_path = path
                .to_str()
                .ok_or_else(|| Error::from_reason("Invalid path encoding"))?
                .to_string();
            
            directories.push(DirectoryInfo {
                name,
                path: full_path,
                is_directory: true,
            });
        }
    }
    
    // Sort directories by name (case-insensitive so same letters with different casing are adjacent)
    directories.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    
    Ok(directories)
}
