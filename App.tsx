import React from 'react';
import SplitPane, { Pane } from 'split-pane-react';
import 'split-pane-react/esm/themes/default.css';
import DirectoryTree from './DirectoryTree';
import TextureRenderer from './TextureRenderer';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import TileBrowserPane from './TileBrowserPane';

const App: React.FC = () => {
  const [sizes, setSizes] = React.useState<(string | number)[]>(['30%', '70%']);

  // Fixed dark theme (removed light theme toggle)
  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: { main: '#0078d4' },
      background: { default: '#121212', paper: '#1e1e1e' },
    },
    components: {
      MuiButton: {
        defaultProps: {
          variant: 'contained',
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={styles.splitContainer}>
        <SplitPane
          split="vertical"
          sizes={sizes}
          onChange={setSizes}
          sashRender={() => <div />}
        >
          <Pane minSize="20%" maxSize="50%">
              <div style={{ ...styles.leftPane, background: theme.palette.background.paper, color: theme.palette.text.primary }}>
                <DirectoryTree />
              </div>
            </Pane>
            <div style={{ ...styles.rightPane, background: theme.palette.background.default, color: theme.palette.text.primary }}>
              {false && <TextureRenderer /> }
              <TileBrowserPane />
            </div>
        </SplitPane>
      </div>
    </ThemeProvider>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  splitContainer: {
    height: '100vh',
    width: '100vw',
    fontFamily: 'Arial, sans-serif',
  },
  themeToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1000,
  },
  leftPane: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  rightPane: {
    height: '100%',
    overflow: 'auto',
  },
};

export default App;

