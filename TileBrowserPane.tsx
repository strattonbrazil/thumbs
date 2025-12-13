import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Tooltip } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import useFocusedDirectoryStore from './FocusedDirectoryStore';

interface PhotoInfo {
  name: string;
  native_render: boolean;
}

// Photo tile list component (kept above main component)
const PhotoTiles: React.FC<{ photos: PhotoInfo[] }> = ({ photos }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {photos.map((p) => (
        <Tooltip title={p.name} key={p.name} placement="top">
          <Box
            sx={{
              width: 120,
              height: 90,
              bgcolor: 'blue',
              borderRadius: 1,
              cursor: 'pointer',
              display: 'inline-block',
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

const TileBrowserPane: React.FC = () => {
  const path = useFocusedDirectoryStore((s) => s.path);
  const [photos, setPhotos] = useState<PhotoInfo[]>([]);

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

  // Photos are stored in state but not rendered here per request.
  return (
    <>
      {path && (
        <Box sx={{ p: 2 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderIcon fontSize="small" />
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{path}</Typography>
            </Box>
            {/* Photo tiles: fixed size blue tiles that wrap */}
            <PhotoTiles photos={photos} />
          </Paper>
        </Box>
      )}
    </>
  );
};

export default TileBrowserPane;
