'use client'

/**
 * Main DataFormulator component - Core application interface
 * Migrated from original DataFormulator.tsx to Next.js with Tailwind
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions, fetchAvailableModels } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Box,
  Typography,
  Button,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  ViewSidebar as ViewSidebarIcon,
  GridView as GridViewIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'

// Import components
import { ConceptShelf } from './ConceptShelf'
import { DataView } from './DataView'
import { VisualizationView } from './VisualizationView'
import { DataThread } from './DataThread'

// Split pane for resizable layout
import dynamic from 'next/dynamic'

const SplitPane = dynamic(() => import('react-split-pane'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />,
})

interface DataFormulatorProps {
  className?: string
}

export function DataFormulator({ className = '' }: DataFormulatorProps) {
  const dispatch = useAppDispatch()
  
  // Redux state
  const tables = useAppSelector((state) => state.dataFormulator.tables)
  const charts = useAppSelector((state) => state.dataFormulator.charts)
  const threads = useAppSelector((state) => state.dataFormulator.threads)
  const visViewMode = useAppSelector((state) => state.dataFormulator.visViewMode)
  const selectedTableName = useAppSelector((state) => state.dataFormulator.selectedTableName)
  const sessionId = useAppSelector((state) => state.dataFormulator.sessionId)
  const availableModels = useAppSelector((state) => state.dataFormulator.availableModels)
  
  // Local state for panel sizes  
  const [leftPaneSize, setLeftPaneSize] = useState(300)
  const [rightPaneSize, setRightPaneSize] = useState(250)
  const [bottomPaneSize, setBottomPaneSize] = useState(300)

  // Initialize application
  useEffect(() => {
    dispatch(fetchAvailableModels())
    document.title = 'Data Formulator'
  }, [dispatch])

  const handleViewModeChange = useCallback((mode: 'gallery' | 'carousel') => {
    dispatch(dataFormulatorActions.setVisViewMode(mode))
  }, [dispatch])

  const handleTableSelect = useCallback((tableName: string) => {
    dispatch(dataFormulatorActions.selectTable(tableName))
  }, [dispatch])

  // Get available table names
  const tableNames = Object.keys(tables)
  const chartEntries = Object.entries(charts)
  const threadEntries = Object.entries(threads)

  return (
    <Box className={`data-formulator h-screen flex flex-col ${className}`}>
      {/* Top toolbar */}
      <AppBar position="static" className="bg-white border-b border-gray-200 shadow-sm">
        <Toolbar variant="dense" className="min-h-12">
          <Typography variant="h6" className="flex-1 text-gray-900 font-medium">
            Data Formulator
          </Typography>
          
          {/* View mode toggle */}
          <Box className="flex items-center space-x-2 mr-4">
            <Tooltip title="List View">
              <IconButton
                size="small"
                onClick={() => handleViewModeChange('carousel')}
                className={visViewMode === 'carousel' ? 'text-blue-600' : 'text-gray-400'}
              >
                <ViewSidebarIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Grid View">
              <IconButton
                size="small" 
                onClick={() => handleViewModeChange('gallery')}
                className={visViewMode === 'gallery' ? 'text-blue-600' : 'text-gray-400'}
              >
                <GridViewIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Divider orientation="vertical" className="mx-2" />
          
          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton size="small">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main content area with split panes */}
      <Box className="flex-1 flex overflow-hidden">
        <SplitPane
          split="vertical"
          minSize={250}
          defaultSize={leftPaneSize}
          maxSize={500}
          onDragFinished={(size) => setLeftPaneSize(size)}
          className="df-split-pane"
        >
          {/* Left sidebar - Concept shelf and data controls */}
          <Box className="bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <Box className="p-4">
              {/* Table selection */}
              <Box className="mb-4">
                <Typography variant="subtitle2" className="mb-2 font-semibold">
                  Data Tables
                </Typography>
                {tableNames.length === 0 ? (
                  <Box className="text-center py-8 text-gray-500">
                    <Typography variant="body2">
                      No data loaded
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      className="mt-2"
                      onClick={() => {
                        // Open data upload dialog
                        console.log('Open data upload dialog')
                      }}
                    >
                      Upload Data
                    </Button>
                  </Box>
                ) : (
                  <Box className="space-y-2">
                    {tableNames.map((tableName) => (
                      <Button
                        key={tableName}
                        variant={selectedTableName === tableName ? 'contained' : 'outlined'}
                        size="small"
                        fullWidth
                        onClick={() => handleTableSelect(tableName)}
                        className="justify-start text-left"
                      >
                        {tableName} ({tables[tableName]?.length || 0} rows)
                      </Button>
                    ))}
                  </Box>
                )}
              </Box>
              
              <Divider className="my-4" />
              
              {/* Concept shelf */}
              <ConceptShelf />
            </Box>
          </Box>
          
          {/* Main content area */}
          <SplitPane
            split="vertical"
            minSize={400}
            defaultSize={-rightPaneSize}
            maxSize={-200}
            onDragFinished={(size) => setRightPaneSize(-size)}
            resizerStyle={{ left: '-5px' }}
          >
            {/* Central workspace */}
            <SplitPane
              split="horizontal"
              minSize={200}
              defaultSize={-bottomPaneSize}
              maxSize={-150}
              onDragFinished={(size) => setBottomPaneSize(-size)}
              resizerStyle={{ top: '-5px' }}
            >
              {/* Visualization area */}
              <Box className="bg-white overflow-auto p-4">
                <Box className="mb-4 flex items-center justify-between">
                  <Typography variant="h6" className="font-semibold">
                    Visualizations
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {chartEntries.length} charts
                  </Typography>
                </Box>
                
                {chartEntries.length === 0 ? (
                  <Box className="text-center py-12 text-gray-500">
                    <Typography variant="h6" className="mb-2">
                      No visualizations yet
                    </Typography>
                    <Typography variant="body2" className="mb-4">
                      Create your first chart by dragging fields or typing natural language descriptions
                    </Typography>
                    <Button variant="contained" disabled>
                      Create Chart
                    </Button>
                  </Box>
                ) : (
                  <Box className={`
                    ${visViewMode === 'gallery' 
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                      : 'space-y-4'
                    }
                  `}>
                    {chartEntries.map(([chartId, chart]) => (
                      <VisualizationView
                        key={chartId}
                        chartId={chartId}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              
              {/* Data view area */}
              <Box className="bg-white border-t border-gray-200 overflow-auto">
                {selectedTableName ? (
                  <DataView tableName={selectedTableName} />
                ) : (
                  <Box className="flex items-center justify-center h-full text-gray-500">
                    <Typography variant="body1">
                      Select a data table to view its contents
                    </Typography>
                  </Box>
                )}
              </Box>
            </SplitPane>
            
            {/* Right sidebar - Data threads and conversation */}
            <Box className="bg-gray-50 border-l border-gray-200 overflow-y-auto">
              <Box className="p-4">
                <Typography variant="subtitle2" className="mb-4 font-semibold">
                  Data Threads
                </Typography>
                
                {threadEntries.length === 0 ? (
                  <Box className="text-center py-8 text-gray-500">
                    <Typography variant="body2">
                      No conversation threads yet
                    </Typography>
                    <Typography variant="caption" className="block mt-2">
                      Start by asking questions about your data
                    </Typography>
                  </Box>
                ) : (
                  <Box className="space-y-2">
                    {threadEntries.map(([threadId, thread]) => (
                      <DataThread
                        key={threadId}
                        threadId={threadId}
                        thread={thread}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </SplitPane>
        </SplitPane>
      </Box>
      
      {/* Status bar */}
      <Box className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm">
        <Box className="flex items-center space-x-4">
          <Typography variant="caption" className="text-gray-600">
            Session: {sessionId?.substring(0, 8) || 'Not connected'}
          </Typography>
          <Typography variant="caption" className="text-gray-600">
            Models: {availableModels.length} available
          </Typography>
        </Box>
        
        <Box className="flex items-center space-x-2">
          <Typography variant="caption" className="text-gray-600">
            Ready
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}