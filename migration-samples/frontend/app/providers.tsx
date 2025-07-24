'use client'

import { Provider } from 'react-redux'
import { store, persistor } from '@/lib/store'
import { PersistGate } from 'redux-persist/integration/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { blue, purple, yellow, orange } from '@mui/material/colors'

// MUI theme configuration (maintaining compatibility during migration)
const theme = createTheme({
  typography: {
    fontFamily: [
      "Arial",
      "Roboto", 
      "Helvetica Neue",
      "sans-serif"
    ].join(",")
  },
  palette: {
    primary: {
      main: blue[700]
    },
    secondary: {
      main: purple[700]
    },
    // Custom palette extensions
    ...(process.env.NODE_ENV === 'development' && {
      derived: {
        main: yellow[700],
      },
      custom: {
        main: orange[700],
      }
    }),
    warning: {
      main: '#bf5600',
    },
  },
})

// Extend MUI theme interface for custom colors
declare module '@mui/material/styles' {
  interface Palette {
    derived?: Palette['primary']
    custom?: Palette['primary']
  }
  interface PaletteOptions {
    derived?: PaletteOptions['primary']
    custom?: PaletteOptions['primary']
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<div className="p-4">Loading...</div>} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <DndProvider backend={HTML5Backend}>
            {children}
          </DndProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  )
}