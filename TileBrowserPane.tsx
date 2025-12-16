import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Box, Paper, Typography, Tooltip, Button } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import useFocusedDirectoryStore from './FocusedDirectoryStore';
import useFocusedPhotoStore from './FocusedPhotoStore';
import FocusedPhotoModal from './FocusedPhotoModal';

interface PhotoInfo {
  name: string;
  native_render: boolean;
}

const PhotoTile: React.FC<{ photo: PhotoInfo; basePath?: string }> = ({ photo, basePath }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [thumb, setThumb] = useState<{ b64: string; w: number; h: number } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const setFocusedPhoto = useFocusedPhotoStore((s) => s.setPath);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const checkNear = () => {
      const PIXEL_BUFFER = 800; // maybe adjust to 100% viewport height
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      return rect.bottom >= -PIXEL_BUFFER && rect.top <= viewportH + PIXEL_BUFFER;
    };

    const onScrollOrResize = () => {
      const near = checkNear();
      setActive(near);
    };

    // initial check
    onScrollOrResize();

    // Attach scroll listener to nearest scrollable ancestor (Virtuoso uses its own scroller)
    const getScrollParent = (node: Element | null): Element | Window => {
      let parent = node?.parentElement || null;
      while (parent) {
        const style = getComputedStyle(parent);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && parent.scrollHeight > parent.clientHeight) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return window;
    };

    const scrollParent = getScrollParent(el);
    if (scrollParent === window) {
      window.addEventListener('scroll', onScrollOrResize, { passive: true });
    } else {
      (scrollParent as Element).addEventListener('scroll', onScrollOrResize, { passive: true });
    }
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (scrollParent === window) {
        window.removeEventListener('scroll', onScrollOrResize);
      } else {
        (scrollParent as Element).removeEventListener('scroll', onScrollOrResize);
      }
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  // Fetch thumbnail when tile becomes active
  useEffect(() => {
    let mounted = true;
    if (active && !thumb && basePath) {
      const getThumb = (window as any).nativePhotos?.getThumbnail;
      if (typeof getThumb === 'function') {
        const fullPath = basePath.endsWith('/') ? `${basePath}${photo.name}` : `${basePath}/${photo.name}`;
        // call in microtask to avoid blocking paints
        Promise.resolve().then(() => {
          try {
            const info = getThumb(fullPath);
            if (mounted && info) {
              const b64 = info.data_base64 ?? info.dataBase64 ?? info.data ?? null;
              const w = info.thumb_width ?? info.thumbWidth ?? info.thumb_w ?? info.w ?? null;
              const h = info.thumb_height ?? info.thumbHeight ?? info.thumb_h ?? info.h ?? null;
              if (b64) {
                setThumb({ b64, w: w ?? 0, h: h ?? 0 });
                setImgLoaded(false);
              }
            }
          } catch (_) {
            // ignore
          }
        });
      }
    }

    return () => {
      mounted = false;
    };
  }, [active, basePath, photo.name, thumb]);

  // reset load flag when thumbnail changes/cleared
  useEffect(() => {
    if (!thumb) setImgLoaded(false);
  }, [thumb]);

    return (
    <Tooltip title={photo.name} placement="top">
      <Box
        ref={ref}
        onClick={() => {
          const fullPath = basePath
            ? basePath.endsWith('/')
              ? `${basePath}${photo.name}`
              : `${basePath}/${photo.name}`
            : photo.name;
          //setFocusedPhoto(fullPath);
        }}
        sx={{
          width: 240,
          height: 180,
          bgcolor: active ? undefined : 'grey',
          borderRadius: 1,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
          borderStyle: 'solid',
          borderColor: '#ffb300',
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '4px',
          },
        }}
      >
        {thumb ? (
          <img
            src={`data:image/png;base64,${thumb.b64}`}
            onLoad={() => setImgLoaded(true)}
            style={{
              objectFit: 'contain',
              objectPosition: 'center',
              width: '100%',
              height: '100%',
              display: 'block',
              boxSizing: 'border-box',
            }}
            alt={photo.name}
          />
        ) : null}
      </Box>
    </Tooltip>
  );
};

// Photo tile list component (kept above main component)
const PhotoTiles: React.FC<{ photos: PhotoInfo[]; basePath?: string }> = ({ photos, basePath }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {photos.map((p) => (
        <PhotoTile key={p.name} photo={p} basePath={basePath} />
      ))}
    </Box>
  );
};

const TileBrowserPane: React.FC = () => {
  const path = useFocusedDirectoryStore((s) => s.path);
  const [photos, setPhotos] = useState<PhotoInfo[]>([]);
  const focusedPhoto = useFocusedPhotoStore((s) => s.path);
  const setFocusedPhoto = useFocusedPhotoStore((s) => s.setPath);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [toolbarStyle, setToolbarStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [toolbarHeight, setToolbarHeight] = useState<number>(0);

  useEffect(() => {
    const onClose = () => setFocusedPhoto(null);
    window.addEventListener('focused-photo-modal-close', onClose as EventListener);
    return () => window.removeEventListener('focused-photo-modal-close', onClose as EventListener);
  }, [setFocusedPhoto]);

  useLayoutEffect(() => {
    const update = () => {
      const el = paneRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setToolbarStyle({ left: Math.round(r.left), width: Math.round(r.width) });
      const t = toolbarRef.current?.getBoundingClientRect();
      setToolbarHeight(t ? Math.round(t.height) : 0);
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [path]);

  useEffect(() => {
    if (!path) {
      setPhotos([]);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        const getDirPhotos = (window as any).nativePhotos?.getDirPhotos;
        const result: PhotoInfo[] = getDirPhotos ? getDirPhotos(path) : [];
        if (mounted) setPhotos(result ?? []);
      } catch (_) {
        if (mounted) setPhotos([]);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [path]);

  return (
    <>
      {path && (
        <Box
          ref={paneRef}
          sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          style={{ paddingTop: `${toolbarHeight + 16}px` }}
        >
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, mb: 1 }}>
                <FolderIcon fontSize="small" />
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{path}</Typography>
              </Box>

              <Box sx={{ px: 1 }}>
                <PhotoTiles photos={photos} basePath={path} />
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Fixed toolbar aligned to the pane that stays at top of viewport while scrolling */}
      {path ? (
        <Box
          ref={toolbarRef}
          style={{ position: 'fixed', top: 0, left: toolbarStyle.left, width: toolbarStyle.width }}
          sx={{ zIndex: 1200, backgroundColor: 'background.paper', boxSizing: 'border-box', borderBottom: '1px solid rgba(0,0,0,0.12)' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1, px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2">Photos</Typography>
              <Button size="small" onClick={() => { /* placeholder */ }}>Refresh</Button>
            </Box>
            <Box>
              <Button size="small" variant="outlined">Options</Button>
            </Box>
          </Box>
        </Box>
      ) : null}
      <FocusedPhotoModal path={focusedPhoto} />
    </>
  );
};

export default TileBrowserPane;
