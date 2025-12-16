import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  path: string | null;
}

export default function FocusedPhotoModal({ path }: Props) {
  const [thumbB64, setThumbB64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setThumbB64(null);
    if (!path) return;
    setLoading(true);
    try {
      const info = (window as any).nativePhotos.getFullImage(path);
      const b64 = info.data_base64 ?? info.dataBase64 ?? info.data;
      if (b64) setThumbB64(b64);
    } catch (e) {
      // ignore errors; we'll fall back to file:// rendering
    } finally {
      setLoading(false);
    }
  }, [path]);

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('focused-photo-modal-close'));
  };

  const imgSrc = thumbB64 ? `data:image/png;base64,${thumbB64}` : undefined;

  return (
    <Dialog
      open={Boolean(path)}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { backgroundColor: 'transparent', boxShadow: 'none' } }}
    >
      <IconButton
        onClick={handleClose}
        sx={{ position: 'absolute', right: 8, top: 8, zIndex: 10, color: 'white' }}
        aria-label="Close focused photo"
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Box sx={{ maxWidth: '100%', maxHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {imgSrc ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img src={imgSrc} alt="Focused photo" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          ) : (
            <div style={{ color: 'white' }}>{loading ? 'Loading…' : 'No image'}</div>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
