import React, { useState, useEffect } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface DirectoryInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: DirectoryInfo[];
}

interface NativeDirectoryAPI {
  getDirChildren: (relativePath: string) => DirectoryInfo;
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
  children: TreeNode[];
}

const DirectoryTree: React.FC = () => {
  const [treeRoot, setTreeRoot] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Convert DirectoryInfo to TreeNode
  const convertToTreeNode = (dirInfo: DirectoryInfo): TreeNode => {
    const children = dirInfo.children?.map((child) => convertToTreeNode(child)) ?? [];
    return {
      id: dirInfo.path,
      label: dirInfo.name,
      path: dirInfo.path,
      children: children, 
    };
  };

  // Load directories from Rust function
  useEffect(() => {
    const loadDirectories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get directories from home directory (empty string = home dir)
        const directory = window.nativeDirectory.getDirChildren('');
        
        // Convert to TreeNode format and set root
        const rootNode = convertToTreeNode(directory);
        setTreeRoot(rootNode);
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
        {node.children.map((child) => renderTreeItem(child))}
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

  if (treeRoot == null) {
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
      {renderTreeItem(treeRoot)}
    </SimpleTreeView>
  );
};

export default DirectoryTree;

