#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::fs;
use std::io::Cursor;
use image::ImageOutputFormat;
use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView};
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine as _;

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
    pub children: Vec<DirectoryInfo>,
}

/// Return a directory tree rooted at the queried path. The root contains its immediate
/// child directories in `children`, and each child contains its own immediate children
/// (depth = 2). Hidden entries (starting with a dot) are skipped. Not recursive.
#[napi]
pub fn get_dir_children(relative_path: String) -> Result<DirectoryInfo> {
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

    // Root identity
    let root_name = absolute_path
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| {
            absolute_path
                .to_str()
                .map(|s| s.to_string())
                .unwrap_or_else(|| "unknown".to_string())
        });

    let root_path = absolute_path
        .to_str()
        .ok_or_else(|| Error::from_reason("Invalid path encoding"))?
        .to_string();

    // Collect root's immediate child directories
    let mut root_children = Vec::new();
    if let Ok(entries) = fs::read_dir(&absolute_path) {
        for entry in entries.flatten() {
            let child_path = entry.path();
            if child_path.is_dir() {
                if let Some(child_name) = child_path.file_name().and_then(|n| n.to_str()) {
                    if child_name.starts_with('.') {
                        continue;
                    }

                    // Build child's path string
                    if let Some(child_full) = child_path.to_str() {
                        // Collect child's immediate children (depth 2)
                        let mut grand_children = Vec::new();
                        if let Ok(grand_entries) = fs::read_dir(&child_path) {
                            for grand_entry in grand_entries.flatten() {
                                let grand_path = grand_entry.path();
                                if grand_path.is_dir() {
                                    if let Some(grand_name) = grand_path.file_name().and_then(|n| n.to_str()) {
                                        if grand_name.starts_with('.') {
                                            continue;
                                        }

                                        if let Some(grand_full) = grand_path.to_str() {
                                            grand_children.push(DirectoryInfo {
                                                name: grand_name.to_string(),
                                                path: grand_full.to_string(),
                                                is_directory: true,
                                                children: Vec::new(),
                                            });
                                        }
                                    }
                                }
                            }
                        }

                        // Sort grandchildren
                        grand_children.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

                        root_children.push(DirectoryInfo {
                            name: child_name.to_string(),
                            path: child_full.to_string(),
                            is_directory: true,
                            children: grand_children,
                        });
                    }
                }
            }
        }
    }

    // Sort root children
    root_children.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(DirectoryInfo {
        name: root_name,
        path: root_path,
        is_directory: true,
        children: root_children,
    })
}

/// Photo information returned to the JS side
#[napi(object)]
pub struct PhotoInfo {
    pub name: String,
    pub native_render: bool,
}

/// Given an absolute directory path, return a sorted list of files in that
/// directory which match common image file extensions. Each returned item
/// includes the file name and a `native_render` flag (hardcoded to false).
#[napi]
pub fn get_dir_photos(absolute_path: String) -> Result<Vec<PhotoInfo>> {
    let path = std::path::Path::new(&absolute_path);

    if !path.exists() {
        return Err(Error::from_reason(format!("Path does not exist: {}", absolute_path)));
    }

    if !path.is_dir() {
        return Err(Error::from_reason(format!("Path is not a directory: {}", absolute_path)));
    }

    // common image extensions
    let exts = ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp", "heic", "svg"];

    let mut photos: Vec<PhotoInfo> = Vec::new();

    if let Ok(entries) = fs::read_dir(path) {
        println!("Reading directory: {}", absolute_path);
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                    let ext_l = ext.to_lowercase();
                    if exts.contains(&ext_l.as_str()) {
                        if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
                            photos.push(PhotoInfo {
                                name: name.to_string(),
                                native_render: false,
                            });
                        }
                    }
                }
            }
        }
    }

    // sort by name, case-insensitive
    photos.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    println!("Found {} photos in {}", photos.len(), absolute_path);

    Ok(photos)
}

/// Thumbnail information
#[napi(object)]
pub struct ThumbnailInfo {
    pub data_base64: String,
    pub thumb_width: u32,
    pub thumb_height: u32,
    pub full_width: u32,
    pub full_height: u32,
}

/// Generate a thumbnail for the provided absolute image path. The thumbnail is scaled down
/// to fit within 256x256 while preserving aspect ratio (no upscaling). Returns a base64-encoded
/// PNG buffer and both thumbnail and full-size dimensions.
#[napi]
pub fn get_thumbnail(absolute_path: String) -> Result<ThumbnailInfo> {
    let path = std::path::Path::new(&absolute_path);

    if !path.exists() {
        return Err(Error::from_reason(format!("Path does not exist: {}", absolute_path)));
    }

    if !path.is_file() {
        return Err(Error::from_reason(format!("Path is not a file: {}", absolute_path)));
    }

    // Load image (let image crate guess the format)
    let reader = image::io::Reader::open(path)
        .map_err(|e| Error::from_reason(format!("Failed to open image: {}", e)))?;
    let img = reader
        .with_guessed_format()
        .map_err(|e| Error::from_reason(format!("Failed to guess image format: {}", e)))?
        .decode()
        .map_err(|e| Error::from_reason(format!("Failed to decode image: {}", e)))?;

    // Convert to a consistent pixel format (RGBA8) and get full dimensions
    let base_img = img.to_rgba8();
    let (full_w, full_h) = base_img.dimensions();

    // Compute scale (don't upscale)
    let max_dim = 256.0f32;
    let scale_w = max_dim / full_w as f32;
    let scale_h = max_dim / full_h as f32;
    let scale = scale_w.min(scale_h).min(1.0);

    let thumb_w = ((full_w as f32) * scale).round().max(1.0) as u32;
    let thumb_h = ((full_h as f32) * scale).round().max(1.0) as u32;

    // Resize or clone the RGBA buffer
    let thumb_buffer = if scale < 1.0 {
        image::imageops::resize(&base_img, thumb_w, thumb_h, FilterType::Lanczos3)
    } else {
        base_img.clone()
    };

    // Wrap into DynamicImage for encoding
    let thumb_dyn = DynamicImage::ImageRgba8(thumb_buffer);

    // Encode thumbnail as PNG into memory
    let mut buf: Vec<u8> = Vec::new();
    let mut cursor = Cursor::new(&mut buf);
    thumb_dyn
        .write_to(&mut cursor, ImageOutputFormat::Png)
        .map_err(|e| Error::from_reason(format!("Failed to encode thumbnail: {}", e)))?;

    let b64 = BASE64_STANDARD.encode(&buf);

    Ok(ThumbnailInfo {
        data_base64: b64,
        thumb_width: thumb_w,
        thumb_height: thumb_h,
        full_width: full_w,
        full_height: full_h,
    })
}
