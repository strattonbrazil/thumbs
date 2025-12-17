import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Box, Paper, Typography, Tooltip, Button, Slider } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import useFocusedDirectoryStore from './FocusedDirectoryStore';
import useFocusedPhotoStore from './FocusedPhotoStore';
import FocusedPhotoModal from './FocusedPhotoModal';

interface PhotoInfo {
  name: string;
  native_render: boolean;
}

type ZoomLevel = 'ICON' | 'GALLERY' | 'LIST';

const PhotoTile: React.FC<{ photo: PhotoInfo; basePath?: string; tileSize?: number; zoomLevel?: ZoomLevel }> = ({ photo, basePath, tileSize = 240, zoomLevel = 'GALLERY' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [thumb, setThumb] = useState<{ b64: string; w: number; h: number } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const lastReqRef = useRef<{ w: number; h: number } | null>(null);
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

  // Fetch processed image when tile becomes active (handles ICON/GALLERY and LIST sizing)
  useEffect(() => {
    let mounted = true;
    if (!active || !basePath) return;

    const getProc = (window as any).nativePhotos?.getProcessedPhoto;
    if (typeof getProc !== 'function') return;

    const fullPath = basePath.endsWith('/') ? `${basePath}${photo.name}` : `${basePath}/${photo.name}`;
    // compute desired tile constraints; LIST mode should request the full container width
    let tileW = tileSize ?? 240;
    let tileH = Math.round((tileSize ?? 240) * 0.75);
    if (zoomLevel === 'LIST') {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        tileW = Math.max(64, Math.round(rect.width));
      } else {
        tileW = Math.max(64, Math.round(window.innerWidth * 0.8));
      }
      // allow a generous height so the image is only constrained by width
      tileH = Math.max(64, Math.round(window.innerHeight * 0.8));
    }

    const last = lastReqRef.current;
    if (last && last.w === tileW && last.h === tileH && thumb) {
      // already have a matching image
      return () => {
        mounted = false;
      };
    }

    // record requested size so rapid toggles don't refetch repeatedly
    lastReqRef.current = { w: tileW, h: tileH };
    // clear existing thumb while fetching new size to avoid letterboxing small image
    setThumb(null);

    // call in microtask to avoid blocking paints
    Promise.resolve().then(() => {
      try {
        const info = getProc(fullPath, tileW, tileH);
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

    return () => {
      mounted = false;
    };
  }, [active, basePath, photo.name, zoomLevel, tileSize]);

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
          // LIST: full-width block where image defines height
          // ICON/GALLERY: flexible grid tiles that start at tileSize and grow to fill the row
          width: zoomLevel === 'LIST' ? '100%' : 'auto',
          flex: zoomLevel === 'LIST' ? undefined : `1 1 ${tileSize}px`,
          bgcolor: active ? undefined : 'grey',
          borderRadius: 1,
          cursor: 'pointer',
          display: zoomLevel === 'LIST' ? 'block' : 'flex',
          alignItems: zoomLevel === 'LIST' ? undefined : 'stretch',
          justifyContent: zoomLevel === 'LIST' ? undefined : 'center',
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
          borderStyle: 'solid',
          borderColor: '#ffb300',
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '4px',
          },
          mb: zoomLevel === 'LIST' ? 1 : undefined,
          height: zoomLevel === 'LIST' ? 'auto' : Math.round((tileSize ?? 240) * 0.75),
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
              height: zoomLevel === 'LIST' ? 'auto' : '100%',
              display: 'block',
              boxSizing: 'border-box',
              backgroundColor: 'black'
            }}
            alt={photo.name}
          />
        ) : null}
      </Box>
    </Tooltip>
  );
};

// Photo tile list component (kept above main component)
const PhotoTiles: React.FC<{ photos: PhotoInfo[]; basePath?: string; tileSize?: number; zoomLevel?: ZoomLevel }> = ({ photos, basePath, tileSize = 240, zoomLevel }) => {
  const isList = zoomLevel === 'LIST';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [itemsPerRow, setItemsPerRow] = useState<number>(0);

  useLayoutEffect(() => {
    if (isList) {
      setItemsPerRow(0);
      return;
    }

    const gapPx = 8; // matches theme spacing 1

    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth;
      const per = Math.max(1, Math.floor((cw + gapPx) / (tileSize + gapPx)));
      setItemsPerRow(per);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [tileSize, isList]);

  const placeholders = !isList && itemsPerRow > 0 ? (photos.length % itemsPerRow === 0 ? 0 : itemsPerRow - (photos.length % itemsPerRow)) : 0;

  return (
    <Box ref={containerRef} sx={{ display: isList ? 'block' : 'flex', flexWrap: isList ? 'nowrap' : 'wrap', flexDirection: isList ? 'column' : 'row', gap: 1, mt: 1 }}>
      {photos.map((p) => (
        <PhotoTile key={p.name} photo={p} basePath={basePath} tileSize={tileSize} zoomLevel={zoomLevel} />
      ))}

      {Array.from({ length: placeholders }).map((_, i) => (
        <Box
          key={`_placeholder_${i}`}
          sx={{
            flex: `1 1 ${tileSize}px`,
            width: 'auto',
            visibility: 'hidden',
            pointerEvents: 'none',
            mb: zoomLevel === 'LIST' ? 1 : undefined,
            height: zoomLevel === 'LIST' ? 'auto' : Math.round((tileSize ?? 240) * 0.75),
            boxSizing: 'border-box',
          }}
        />
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
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('GALLERY');
  const TILE_ICON = 120;
  const TILE_GALLERY = 240;
  const tileSize = zoomLevel === 'ICON' ? TILE_ICON : zoomLevel === 'GALLERY' ? TILE_GALLERY : undefined;

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
                <PhotoTiles photos={photos} basePath={path} tileSize={tileSize} zoomLevel={zoomLevel} />
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
            <Box sx={{ width: 180, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ZoomOutIcon sx={{ color: 'text.secondary' }} />
              <ToggleButtonGroup
                value={zoomLevel}
                exclusive
                onChange={(_, v: ZoomLevel | null) => v && setZoomLevel(v)}
                size="small"
                aria-label="Zoom level"
              >
                <ToggleButton value="ICON" aria-label="icon">
                  <GridViewIcon />
                </ToggleButton>
                <ToggleButton value="GALLERY" aria-label="gallery">
                  <ViewModuleIcon />
                </ToggleButton>
                <ToggleButton value="LIST" aria-label="list">
                  <CropSquareIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <ZoomInIcon sx={{ color: 'text.secondary' }} />
            </Box>
          </Box>
        </Box>
      ) : null}
      <FocusedPhotoModal path={focusedPhoto} />
    </>
  );
};

export default TileBrowserPane;
