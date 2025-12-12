import React, { useState, useEffect } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface DirectoryInfo {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface NativeDirectoryAPI {
  listDirectories: (relativePath: string) => DirectoryInfo[];
}

declare global {
  interface Window {
    nativeDirectory: NativeDirectoryAPI;
  }
}

interface TreeNode {
  id: string;
  label: string;
  path: string;
  children?: TreeNode[];
}

const DirectoryTree: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Convert DirectoryInfo to TreeNode
  const convertToTreeNode = (dirInfo: DirectoryInfo): TreeNode => {
    return {
      id: dirInfo.path,
      label: dirInfo.name,
      path: dirInfo.path,
      children: undefined, // Will be loaded lazily if needed
    };
  };

  // Load directories from Rust function
  useEffect(() => {
    const loadDirectories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get directories from home directory (empty string = home dir)
        const directories = window.nativeDirectory.listDirectories('');
        
        // Convert to TreeNode format
        const nodes = directories.map(convertToTreeNode);
        
        setTreeData(nodes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load directories');
        console.error('Error loading directories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDirectories();
  }, []);

  const renderTreeItem = (node: TreeNode): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={node.label}
        sx={{
          color: '#fff',
          '& .MuiTreeItem-content': {
            color: '#fff',
            '&:hover': {
              backgroundColor: '#2d2d2d',
            },
            '&.Mui-selected': {
              backgroundColor: '#0078d4',
              '&:hover': {
                backgroundColor: '#106ebe',
              },
            },
          },
        }}
      >
        {hasChildren ? node.children.map((child) => renderTreeItem(child)) : null}
      </TreeItem>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
        Loading directories...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#ff6b6b', textAlign: 'center' }}>
        Error: {error}
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div style={{ padding: '20px', color: '#aaa', textAlign: 'center' }}>
        No directories found
      </div>
    );
  }

  return (
    <SimpleTreeView
      slots={{
        collapseIcon: ExpandMoreIcon,
        expandIcon: ChevronRightIcon,
      }}
      slotProps={{
        collapseIcon: { sx: { color: '#fff' } },
        expandIcon: { sx: { color: '#fff' } },
      }}
      sx={{
        flexGrow: 1,
        maxWidth: '100%',
        overflowY: 'auto',
        padding: '10px',
        color: '#fff',
      }}
    >
      {treeData.map((node) => renderTreeItem(node))}
    </SimpleTreeView>
  );
};

export default DirectoryTree;

