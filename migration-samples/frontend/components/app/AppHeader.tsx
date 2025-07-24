'use client'

/**
 * App Header Component
 * Migrated from original App.tsx header section to Next.js component
 */

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Button,
  Tooltip,
  Typography,
  Box,
  Toolbar,
  Input,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Menu,
  MenuItem,
  TextField
} from '@mui/material'
import MuiAppBar from '@mui/material/AppBar'
import { styled } from '@mui/material/styles'

// Icons
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import ClearIcon from '@mui/icons-material/Clear'
import GridViewIcon from '@mui/icons-material/GridView'
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar'
import SettingsIcon from '@mui/icons-material/Settings'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DownloadIcon from '@mui/icons-material/Download'
import CloudQueueIcon from '@mui/icons-material/CloudQueue'

// Custom hooks and actions
import { useAppDispatch, useAppSelector, useConfig, useSessionId, useVisViewMode } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  color: 'black',
  backgroundColor: 'white',
  borderBottom: '1px solid #C3C3C3',
  boxShadow: 'none',
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}))

const TOOL_NAME = 'Data Formulator'

// Import/Export State Components
export const ImportStateButton: React.FC = () => {
  const dispatch = useAppDispatch()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files
    if (files) {
      for (let file of files) {
        file.text().then((text) => {
          try {
            let savedState = JSON.parse(text)
            dispatch(dataFormulatorActions.loadState(savedState))
          } catch (error) {
            console.error('Failed to parse state file:', error)
          }
        })
      }
    }
    // Reset the input value to allow uploading the same file again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <Button 
      variant="text" 
      color="primary"
      sx={{ textTransform: 'none' }}
      onClick={() => inputRef.current?.click()}
      startIcon={<UploadFileIcon />}
    >
      <Input 
        inputProps={{ 
          accept: '.json, .dfstate',
          multiple: false 
        }}
        id="upload-data-file"
        type="file"
        sx={{ display: 'none' }}
        inputRef={inputRef}
        onChange={handleFileUpload}
      />
      import a saved session
    </Button>
  )
}

export const ExportStateButton: React.FC = () => {
  const sessionId = useSessionId()
  const fullState = useAppSelector((state) => state.dataFormulator)
  const fullStateJson = JSON.stringify(fullState)

  return (
    <Tooltip title="save session locally">
      <Button 
        variant="text" 
        sx={{ textTransform: 'none' }} 
        onClick={() => {
          function download(content: string, fileName: string, contentType: string) {
            let a = document.createElement("a")
            let file = new Blob([content], { type: contentType })
            a.href = URL.createObjectURL(file)
            a.download = fileName
            a.click()
          }
          download(fullStateJson, `df_state_${sessionId?.slice(0, 4)}.json`, 'text/plain')
        }}
        startIcon={<DownloadIcon />}
      >
        export session
      </Button>
    </Tooltip>
  )
}

// Menu Components
const TableMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  
  return (
    <>
      <Button
        variant="text"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon />}
        aria-controls={open ? 'add-table-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ textTransform: 'none' }}
      >
        Add Table
      </Button>
      <Menu
        id="add-table-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: { sx: { py: '4px', px: '8px' } }
        }}
        aria-labelledby="add-table-button"
        sx={{ '& .MuiMenuItem-root': { padding: 0, margin: 0 } }}
      >
        <MenuItem onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}>
          <Typography sx={{ fontSize: 14, textTransform: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContentPasteIcon fontSize="small" />
            from clipboard
          </Typography>
        </MenuItem>
        <MenuItem onClick={(e) => {}}>
          <Typography sx={{ fontSize: 14, textTransform: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadFileIcon fontSize="small" />
            from file
          </Typography>
        </MenuItem>
      </Menu>
    </>
  )
}

const SessionMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const sessionId = useSessionId()
  
  return (
    <>
      <Button 
        variant="text" 
        onClick={(e) => setAnchorEl(e.currentTarget)} 
        endIcon={<KeyboardArrowDownIcon />} 
        sx={{ textTransform: 'none' }}
      >
        Session {sessionId ? `(${sessionId.substring(0, 8)}...)` : ''}
      </Button>
      <Menu
        id="session-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: { sx: { py: '4px', px: '8px' } }
        }}
        aria-labelledby="session-menu-button"
        sx={{ '& .MuiMenuItem-root': { padding: 0, margin: 0 } }}
      >
        {sessionId && (
          <MenuItem disabled>
            <Typography sx={{ fontSize: 12, color: 'text.secondary'}}>
              session id: {sessionId}
            </Typography>
          </MenuItem>
        )}
        <MenuItem onClick={() => {}}>
          <ExportStateButton />
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <ImportStateButton />
        </MenuItem>
      </Menu>
    </>
  )
}

const ResetDialog: React.FC = () => {
  const [open, setOpen] = useState(false)
  const dispatch = useAppDispatch()

  return (
    <>
      <Button 
        variant="text" 
        onClick={() => setOpen(true)} 
        endIcon={<PowerSettingsNewIcon />}
      >
        Reset session
      </Button>
      <Dialog onClose={() => setOpen(false)} open={open}>
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>Reset Session?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography>All unexported content (charts, derived data, concepts) will be lost upon reset.</Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => { 
              dispatch(dataFormulatorActions.resetState()) 
              setOpen(false)
              
              // Add a delay to ensure the state has been reset before reloading
              setTimeout(() => {
                window.location.reload()
              }, 250)
            }} 
            endIcon={<PowerSettingsNewIcon />}
          >
            reset session 
          </Button>
          <Button onClick={() => setOpen(false)}>cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const ConfigDialog: React.FC = () => {
  const [open, setOpen] = useState(false)
  const dispatch = useAppDispatch()
  const config = useConfig()

  const [formulateTimeoutSeconds, setFormulateTimeoutSeconds] = useState(config.formulateTimeoutSeconds)
  const [maxRepairAttempts, setMaxRepairAttempts] = useState(config.maxRepairAttempts)
  const [defaultChartWidth, setDefaultChartWidth] = useState(config.defaultChartWidth)
  const [defaultChartHeight, setDefaultChartHeight] = useState(config.defaultChartHeight)

  // Reset local state when config changes
  useEffect(() => {
    setFormulateTimeoutSeconds(config.formulateTimeoutSeconds)
    setMaxRepairAttempts(config.maxRepairAttempts)
    setDefaultChartWidth(config.defaultChartWidth)
    setDefaultChartHeight(config.defaultChartHeight)
  }, [config])

  // Add check for changes
  const hasChanges = formulateTimeoutSeconds !== config.formulateTimeoutSeconds || 
                    maxRepairAttempts !== config.maxRepairAttempts ||
                    defaultChartWidth !== config.defaultChartWidth ||
                    defaultChartHeight !== config.defaultChartHeight

  return (
    <>
      <Button variant="text" sx={{ textTransform: 'none' }} onClick={() => setOpen(true)} startIcon={<SettingsIcon />}>
        <Box component="span" sx={{ lineHeight: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'left' }}>
          <Box component="span" sx={{ py: 0, my: 0, fontSize: '10px', mr: 'auto' }}>default_timeout={config.formulateTimeoutSeconds}s</Box>
          <Box component="span" sx={{ py: 0, my: 0, fontSize: '10px', mr: 'auto' }}>chart_size={config.defaultChartWidth}x{config.defaultChartHeight}</Box>
        </Box>
      </Button>
      <Dialog onClose={() => setOpen(false)} open={open}>
        <DialogTitle>Data Formulator Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            maxWidth: 400
          }}>
            <Divider><Typography variant="caption">Frontend configuration</Typography></Divider>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="default chart width"
                  type="number"
                  variant="outlined"
                  value={defaultChartWidth}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setDefaultChartWidth(value)
                  }}
                  fullWidth
                  inputProps={{
                    min: 100,
                    max: 1000
                  }}
                  error={defaultChartWidth < 100 || defaultChartWidth > 1000}
                  helperText={defaultChartWidth < 100 || defaultChartWidth > 1000 ? 
                    "Value must be between 100 and 1000 pixels" : ""}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                <ClearIcon fontSize="small" />
              </Typography>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="default chart height"
                  type="number"
                  variant="outlined"
                  value={defaultChartHeight}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setDefaultChartHeight(value)
                  }}
                  fullWidth
                  inputProps={{
                    min: 100,
                    max: 1000
                  }}
                  error={defaultChartHeight < 100 || defaultChartHeight > 1000}
                  helperText={defaultChartHeight < 100 || defaultChartHeight > 1000 ? 
                    "Value must be between 100 and 1000 pixels" : ""}
                />
              </Box>
            </Box>
            <Divider><Typography variant="caption">Backend configuration</Typography></Divider>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="formulate timeout (seconds)"
                  type="number"
                  variant="outlined"
                  value={formulateTimeoutSeconds}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setFormulateTimeoutSeconds(value)
                  }}
                  inputProps={{
                    min: 0,
                    max: 3600,
                  }}
                  error={formulateTimeoutSeconds <= 0 || formulateTimeoutSeconds > 3600}
                  helperText={formulateTimeoutSeconds <= 0 || formulateTimeoutSeconds > 3600 ? 
                    "Value must be between 1 and 3600 seconds" : ""}
                  fullWidth
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Maximum time allowed for the formulation process before timing out. 
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="max repair attempts"
                  type="number"
                  variant="outlined"
                  value={maxRepairAttempts}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setMaxRepairAttempts(value)
                  }}
                  fullWidth
                  inputProps={{
                    min: 1,
                    max: 5,
                  }}
                  error={maxRepairAttempts <= 0 || maxRepairAttempts > 5}
                  helperText={maxRepairAttempts <= 0 || maxRepairAttempts > 5 ? 
                    "Value must be between 1 and 5" : ""}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Maximum number of times the LLM will attempt to repair code if generated code fails to execute (recommended = 1).
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ '.MuiButton-root': { textTransform: 'none' } }}>
          <Button sx={{ marginRight: 'auto' }} onClick={() => {
            setFormulateTimeoutSeconds(30)
            setMaxRepairAttempts(1)
            setDefaultChartWidth(300)
            setDefaultChartHeight(300)
          }}>Reset to default</Button>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            variant={hasChanges ? "contained" : "text"}
            disabled={!hasChanges || isNaN(maxRepairAttempts) || maxRepairAttempts <= 0 || maxRepairAttempts > 5 
              || isNaN(formulateTimeoutSeconds) || formulateTimeoutSeconds <= 0 || formulateTimeoutSeconds > 3600
              || isNaN(defaultChartWidth) || defaultChartWidth <= 0 || defaultChartWidth > 1000
              || isNaN(defaultChartHeight) || defaultChartHeight <= 0 || defaultChartHeight > 1000}
            onClick={() => {
              dispatch(dataFormulatorActions.setConfig({formulateTimeoutSeconds, maxRepairAttempts, defaultChartWidth, defaultChartHeight}))
              setOpen(false)
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Main App Header Component
export const AppHeader: React.FC = () => {
  const dispatch = useAppDispatch()
  const visViewMode = useVisViewMode()

  const switchers = (
    <Box sx={{ display: "flex" }} key="switchers">
      <ToggleButtonGroup
        color="primary"
        value={visViewMode}
        exclusive
        size="small"
        onChange={(
          event: React.MouseEvent<HTMLElement>,
          newViewMode: string | null,
        ) => {
          if (newViewMode === "gallery" || newViewMode === "carousel") {
            dispatch(dataFormulatorActions.setVisViewMode(newViewMode))
          }
        }}
        aria-label="View Mode"
        sx={{ marginRight: "8px", height: 32, padding: "4px 0px", marginTop: "2px", "& .MuiToggleButton-root": { padding: "0px 6px" } }}
      >
        <ToggleButton value="carousel" aria-label="view list">
          <Tooltip title="view list">
            <ViewSidebarIcon fontSize="small" sx={{ transform: "scaleX(-1)" }} />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="gallery" aria-label="view grid">
          <Tooltip title="view grid">
            <GridViewIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )

  return (
    <AppBar className="app-bar" position="static">
      <Toolbar variant="dense">
        <Button href={"/"} sx={{
          display: "flex", flexDirection: "row", textTransform: "none",
          backgroundColor: 'transparent',
          "&:hover": {
            backgroundColor: "transparent"
          }
        }} color="inherit">
          <Box className="relative w-8 h-8 mr-3">
            <Image
              src="/assets/df-logo.png"
              alt="Data Formulator Logo"
              fill
              className="object-contain"
            />
          </Box>
          <Typography variant="h6" noWrap component="h1" sx={{ fontWeight: 300, display: { xs: 'none', sm: 'block' } }}>
            {TOOL_NAME} {process.env.NODE_ENV === "development" ? "(Dev)" : ""}
          </Typography>
        </Button>
        <Box sx={{ flexGrow: 1, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
          {switchers}
        </Box>
        <Box sx={{ display: 'flex', fontSize: 14 }}>
          <ConfigDialog />
          <Divider orientation="vertical" variant="middle" flexItem />
          <Typography sx={{ display: 'flex', fontSize: 14, alignItems: 'center', gap: 1, textTransform: 'none' }}>
            <CloudQueueIcon fontSize="small" /> Database
          </Typography>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Typography sx={{ display: 'flex', fontSize: 14, alignItems: 'center', gap: 1 }}>
            <TableMenu />
          </Typography>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Typography sx={{ display: 'flex', fontSize: 14, alignItems: 'center', gap: 1 }}>
            <SessionMenu />
          </Typography>
          <Divider orientation="vertical" variant="middle" flexItem />
          <ResetDialog />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default AppHeader