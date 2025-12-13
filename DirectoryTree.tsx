import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useFocusedDirectoryStore } from './FocusedDirectoryStore';
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
  const theme = useTheme();

  const [treeRoot, setTreeRoot] = useState<TreeNode | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const setFocusedPath = useFocusedDirectoryStore((s) => s.setPath);

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
        // Initialize controlled expansion with the root node expanded
        setExpanded([rootNode.id]);
        // Try again after a tick in case TreeView isn't mounted yet
        setTimeout(() => setExpanded([rootNode.id]), 50);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load directories');
        console.error('Error loading directories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDirectories();
  }, []);

  // Ensure the root is expanded when it's first set
  useEffect(() => {
    if (treeRoot) {
      setExpanded([treeRoot.id]);
    }
  }, [treeRoot]);

  const renderTreeItem = (node: TreeNode): React.ReactNode => {   
    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={node.label}
        sx={{
          color: theme.palette.text.primary,
          '& .MuiTreeItem-content': {
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            '&.Mui-selected': {
              backgroundColor: theme.palette.action.selected || theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
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
      expandedItems={expanded}
      onExpandedItemsChange={(_: unknown, ids: string[]) => setExpanded(ids)}
      onItemClick={(_: unknown, id: string) => {
        // Update focused directory store with the clicked item's id (path)
        setFocusedPath(id as string);
      }}
      slots={{
        collapseIcon: ExpandMoreIcon,
        expandIcon: ChevronRightIcon,
      }}
      slotProps={{
        collapseIcon: { sx: { color: theme.palette.text.primary } },
        expandIcon: { sx: { color: theme.palette.text.primary } },
      }}
      sx={{
        flexGrow: 1,
        maxWidth: '100%',
        overflowY: 'auto',
        padding: '10px',
        color: theme.palette.text.primary,
      }}
    >
      {renderTreeItem(treeRoot)}
    </SimpleTreeView>
  );
};

export default DirectoryTree;

