import React from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

const DirectoryTree: React.FC = () => {
  // Dummy tree data
  const treeData: TreeNode[] = [
    {
      id: '1',
      label: 'Documents',
      children: [
        { id: '1-1', label: 'Project A' },
        { id: '1-2', label: 'Project B' },
        {
          id: '1-3',
          label: 'Project C',
          children: [
            { id: '1-3-1', label: 'File 1.txt' },
            { id: '1-3-2', label: 'File 2.txt' },
          ],
        },
      ],
    },
    {
      id: '2',
      label: 'Images',
      children: [
        { id: '2-1', label: 'Photo 1.jpg' },
        { id: '2-2', label: 'Photo 2.png' },
        { id: '2-3', label: 'Photo 3.gif' },
      ],
    },
    {
      id: '3',
      label: 'Videos',
      children: [
        { id: '3-1', label: 'Video 1.mp4' },
        { id: '3-2', label: 'Video 2.mov' },
      ],
    },
    { id: '4', label: 'Music' },
    { id: '5', label: 'Downloads' },
  ];

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

