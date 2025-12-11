import React, { useState } from 'react';
import SplitPane, { Pane } from 'split-pane-react';
import 'split-pane-react/esm/themes/default.css';
import DirectoryTree from './DirectoryTree';
import TextureRenderer from './TextureRenderer';

const App: React.FC = () => {
  const [sizes, setSizes] = useState<(string | number)[]>(['30%', '70%']);

  return (
    <div style={styles.splitContainer}>
      <SplitPane
        split="vertical"
        sizes={sizes}
        onChange={setSizes}
        sashRender={() => <div />}
      >
        <Pane minSize="20%" maxSize="50%">
          <div style={styles.leftPane}>
            <DirectoryTree />
          </div>
        </Pane>
        <div style={styles.rightPane}>
          <TextureRenderer />
        </div>
      </SplitPane>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  splitContainer: {
    height: '100vh',
    width: '100vw',
    fontFamily: 'Arial, sans-serif',
  },
  leftPane: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#1e1e1e',
    color: '#fff',
    overflow: 'auto',
  },
  rightPane: {
    height: '100%',
    background: '#1e1e1e',
    overflow: 'auto',
  },
};

export default App;

