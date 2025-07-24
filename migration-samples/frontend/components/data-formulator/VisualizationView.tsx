'use client'

/**
 * VisualizationView component migrated to Next.js with Tailwind CSS
 * Handles Vega-Lite chart rendering with SSR considerations
 */

import React, { useCallback, useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration phase
import {
  Box,
  Typography,
  Button,
  Tooltip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import {
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material'

// Dynamically import Vega components to avoid SSR issues
const VegaLite = dynamic(
  () => import('react-vega').then((mod) => mod.VegaLite),
  { 
    ssr: false,
    loading: () => (
      <div className="vega-chart-container">
        <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full flex items-center justify-center">
          <span className="text-gray-500">Loading chart...</span>
        </div>
      </div>
    )
  }
)

interface VisualizationViewProps {
  chartId: string
  className?: string
}

interface ChartSpec {
  id: string
  title: string
  spec: any // Vega-Lite specification
  data: any[]
  width?: number
  height?: number
  createdAt: string
  updatedAt: string
}

export function VisualizationView({ chartId, className = '' }: VisualizationViewProps) {
  const dispatch = useAppDispatch()
  const charts = useAppSelector((state) => state.dataFormulator.charts)
  const config = useAppSelector((state) => state.dataFormulator.config)
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [chartTitle, setChartTitle] = useState('')
  
  const chartSpec = charts[chartId] as ChartSpec
  const vegaRef = useRef<any>(null)

  useEffect(() => {
    if (chartSpec) {
      setChartTitle(chartSpec.title)
    }
  }, [chartSpec])

  const handleDownloadChart = useCallback(async (format: 'svg' | 'png' | 'pdf') => {
    if (!vegaRef.current) return
    
    try {
      const view = vegaRef.current.getView()
      const url = await view.toImageURL(format)
      
      // Download the chart
      const a = document.createElement('a')
      a.href = url
      a.download = `${chartSpec.title || 'chart'}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download chart:', error)
    }
  }, [chartSpec])

  const handleEditTitle = useCallback(() => {
    dispatch(dataFormulatorActions.updateChart({
      id: chartId,
      updates: { title: chartTitle }
    }))
    setEditDialogOpen(false)
  }, [dispatch, chartId, chartTitle])

  const handleDeleteChart = useCallback(() => {
    dispatch(dataFormulatorActions.deleteChart(chartId))
    setAnchorEl(null)
  }, [dispatch, chartId])

  const handleDuplicateChart = useCallback(() => {
    dispatch(dataFormulatorActions.duplicateChart(chartId))
    setAnchorEl(null)
  }, [dispatch, chartId])

  if (!chartSpec) {
    return (
      <div className={`visualization-container ${className}`}>
        <div className="flex items-center justify-center h-64">
          <Typography variant="body1" className="text-gray-500">
            Chart not found
          </Typography>
        </div>
      </div>
    )
  }

  const vegaSpec = {
    ...chartSpec.spec,
    width: chartSpec.width || config.defaultChartWidth,
    height: chartSpec.height || config.defaultChartHeight,
    data: { values: chartSpec.data },
  }

  return (
    <>
      <Card className={`${className} shadow-sm`}>
        <CardContent className="p-4">
          {/* Chart header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <Typography variant="h6" className="font-semibold text-gray-900 truncate">
                {chartSpec.title}
              </Typography>
              <Typography variant="body2" className="text-gray-500">
                Created {new Date(chartSpec.createdAt).toLocaleDateString()}
              </Typography>
            </div>
            
            <div className="flex items-center space-x-1">
              <Tooltip title="Fullscreen view">
                <IconButton 
                  onClick={() => setFullscreenOpen(true)} 
                  size="small"
                >
                  <FullscreenIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Download chart">
                <IconButton 
                  onClick={() => handleDownloadChart('png')} 
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                size="small"
              >
                <MoreVertIcon />
              </IconButton>
            </div>
          </div>

          {/* Vega-Lite chart */}
          <div className="vega-chart-container">
            <VegaLite
              ref={vegaRef}
              spec={vegaSpec}
              actions={{
                export: true,
                source: false,
                compiled: false,
                editor: false,
              }}
              onError={(error: any) => {
                console.error('Vega-Lite error:', error)
              }}
            />
          </div>
        </CardContent>

        <CardActions className="px-4 pb-4 pt-0">
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Edit
          </Button>
          
          <div className="flex-1" />
          
          <Typography variant="caption" className="text-gray-500">
            {chartSpec.data?.length || 0} data points
          </Typography>
        </CardActions>
      </Card>

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setAnchorEl(null)
          setEditDialogOpen(true)
        }}>
          <EditIcon className="mr-2" fontSize="small" />
          Edit title
        </MenuItem>
        <MenuItem onClick={handleDuplicateChart}>
          Duplicate chart
        </MenuItem>
        <MenuItem onClick={() => handleDownloadChart('svg')}>
          Download as SVG
        </MenuItem>
        <MenuItem onClick={() => handleDownloadChart('png')}>
          Download as PNG
        </MenuItem>
        <MenuItem onClick={handleDeleteChart} className="text-red-600">
          <DeleteIcon className="mr-2" fontSize="small" />
          Delete chart
        </MenuItem>
      </Menu>

      {/* Edit title dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Chart Title</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chart Title"
            fullWidth
            variant="outlined"
            value={chartTitle}
            onChange={(e) => setChartTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditTitle} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Fullscreen dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <div className="flex items-center justify-between">
            <span>{chartSpec.title}</span>
            <IconButton onClick={() => setFullscreenOpen(false)}>
              ✕
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="vega-chart-container">
            <VegaLite
              spec={{
                ...vegaSpec,
                width: 800,
                height: 600,
              }}
              actions={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}