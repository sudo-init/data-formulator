'use client'

/**
 * TestPanel component - Testing panel for development and debugging
 * Migrated from original TestPanel.tsx to Next.js with Tailwind
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  TextField,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'

// Dynamic import for Vega-Lite to avoid SSR issues
const VegaLite = dynamic(
  () => import('react-vega').then(mod => mod.VegaLite),
  { 
    ssr: false, 
    loading: () => <div className="w-full h-48 bg-gray-100 animate-pulse rounded" />
  }
)

interface TestPanelProps {
  className?: string
}

interface VegaSpec {
  id: string
  spec: any
  timestamp: number
}

export function TestPanel({ className = '' }: TestPanelProps) {
  const dispatch = useAppDispatch()
  
  // State
  const [vegaSpecs, setVegaSpecs] = useState<VegaSpec[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingError, setStreamingError] = useState<string | null>(null)
  const [streamUrl, setStreamUrl] = useState('http://127.0.0.1:5000/stream')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [maxSpecs, setMaxSpecs] = useState(10)
  
  // Refs
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Process streaming text data
  const processText = useCallback(async (
    reader: ReadableStreamDefaultReader<string>
  ): Promise<void> => {
    try {
      const { done, value } = await reader.read()
      
      if (done) {
        console.log('Stream complete')
        setIsStreaming(false)
        return
      }
      
      if (value) {
        try {
          const vgObj = JSON.parse(value)
          const newSpec: VegaSpec = {
            id: `spec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            spec: vgObj,
            timestamp: Date.now()
          }
          
          setVegaSpecs(prev => {
            const updated = [...prev, newSpec]
            // Keep only the most recent specs based on maxSpecs
            return updated.slice(-maxSpecs)
          })
          
          dispatch(dataFormulatorActions.addMessage({
            timestamp: Date.now(),
            component: 'Test Panel',
            type: 'info',
            value: `Received new chart specification`
          }))
        } catch (parseError) {
          console.error('Failed to parse streaming data:', parseError)
          dispatch(dataFormulatorActions.addMessage({
            timestamp: Date.now(),
            component: 'Test Panel',
            type: 'warning',
            value: `Failed to parse streaming data: ${value}`
          }))
        }
      }
      
      // Continue reading
      return processText(reader)
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Stream processing error:', error)
        setStreamingError(error.message)
        setIsStreaming(false)
      }
    }
  }, [maxSpecs, dispatch])
  
  // Start streaming charts
  const startStreamingChart = useCallback(async () => {
    if (isStreaming) {
      return
    }
    
    setIsStreaming(true)
    setStreamingError(null)
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()
    
    try {
      const response = await fetch(streamUrl, {
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      if (!response.body) {
        throw new Error('Response body is null')
      }
      
      // Create text decoder stream
      const textStream = response.body.pipeThrough(new TextDecoderStream())
      const reader = textStream.getReader()
      readerRef.current = reader
      
      // Start processing
      await processText(reader)
      
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        const errorMessage = error.message
        setStreamingError(errorMessage)
        
        dispatch(dataFormulatorActions.addMessage({
          timestamp: Date.now(),
          component: 'Test Panel',
          type: 'error',
          value: `Streaming failed: ${errorMessage}`
        }))
      }
      setIsStreaming(false)
    }
  }, [isStreaming, streamUrl, processText, dispatch])
  
  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    if (readerRef.current) {
      readerRef.current.cancel()
      readerRef.current = null
    }
    
    setIsStreaming(false)
  }, [])
  
  // Clear all specs
  const clearSpecs = useCallback(() => {
    setVegaSpecs([])
    setStreamingError(null)
  }, [])
  
  // Download specs as JSON
  const downloadSpecs = useCallback(() => {
    if (vegaSpecs.length === 0) return
    
    const data = {
      timestamp: new Date().toISOString(),
      count: vegaSpecs.length,
      specs: vegaSpecs
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vega-specs-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [vegaSpecs])
  
  // Test static chart generation
  const testStaticChart = useCallback(() => {
    const mockSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: {
        values: [
          { category: 'A', value: Math.random() * 100 },
          { category: 'B', value: Math.random() * 100 },
          { category: 'C', value: Math.random() * 100 },
          { category: 'D', value: Math.random() * 100 }
        ]
      },
      mark: 'bar',
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'value', type: 'quantitative' }
      },
      width: 300,
      height: 200
    }
    
    const newSpec: VegaSpec = {
      id: `static-${Date.now()}`,
      spec: mockSpec,
      timestamp: Date.now()
    }
    
    setVegaSpecs(prev => [...prev, newSpec].slice(-maxSpecs))
  }, [maxSpecs])
  
  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      testStaticChart()
    }, 2000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, testStaticChart])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [stopStreaming])

  return (
    <Box className={`test-panel ${className}`}>
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Typography variant="h5" className="font-semibold mb-4">
            Test Panel
          </Typography>
          
          <Typography variant="body2" className="text-gray-600 mb-4">
            Development tool for testing streaming charts and Vega-Lite specifications.
          </Typography>
          
          {/* Controls */}
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <TextField
              label="Stream URL"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              size="small"
              fullWidth
              disabled={isStreaming}
            />
            
            <TextField
              label="Max Specs"
              type="number"
              value={maxSpecs}
              onChange={(e) => setMaxSpecs(Math.max(1, parseInt(e.target.value) || 10))}
              size="small"
              inputProps={{ min: 1, max: 50 }}
              disabled={isStreaming}
            />
          </Box>
          
          <Box className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant="contained"
              onClick={startStreamingChart}
              disabled={isStreaming}
              startIcon={isStreaming ? <CircularProgress size={16} /> : <PlayIcon />}
            >
              {isStreaming ? 'Streaming...' : 'Start Stream'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={stopStreaming}
              disabled={!isStreaming}
              startIcon={<StopIcon />}
            >
              Stop Stream
            </Button>
            
            <Button
              variant="outlined"
              onClick={testStaticChart}
              startIcon={<RefreshIcon />}
            >
              Test Static
            </Button>
            
            <Button
              variant="outlined"
              onClick={clearSpecs}
              disabled={vegaSpecs.length === 0}
              startIcon={<ClearIcon />}
            >
              Clear All
            </Button>
            
            <Button
              variant="outlined"
              onClick={downloadSpecs}
              disabled={vegaSpecs.length === 0}
              startIcon={<DownloadIcon />}
            >
              Download
            </Button>
          </Box>
          
          <Box className="flex items-center gap-4">
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  disabled={isStreaming}
                />
              }
              label="Auto Refresh (2s)"
            />
            
            <Typography variant="body2" className="text-gray-600">
              Specs: {vegaSpecs.length}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      {/* Error Display */}
      {streamingError && (
        <Alert severity="error" className="mb-4" onClose={() => setStreamingError(null)}>
          <Typography variant="body2">
            <strong>Streaming Error:</strong> {streamingError}
          </Typography>
        </Alert>
      )}
      
      {/* Status */}
      {isStreaming && (
        <Alert severity="info" className="mb-4">
          <Box className="flex items-center justify-between">
            <Typography variant="body2">
              Streaming active... Received {vegaSpecs.length} specifications
            </Typography>
            <CircularProgress size={16} />
          </Box>
        </Alert>
      )}
      
      {/* Charts Display */}
      <Box className="space-y-4">
        {vegaSpecs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Typography variant="body1" className="text-gray-500">
                No chart specifications yet. Click "Start Stream" or "Test Static" to begin.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          vegaSpecs.map((specItem, index) => (
            <Card key={specItem.id} className="overflow-hidden">
              <CardContent className="p-4">
                <Box className="flex items-center justify-between mb-3">
                  <Typography variant="h6" className="font-medium">
                    Chart {index + 1}
                  </Typography>
                  
                  <Box className="flex items-center space-x-2">
                    <Typography variant="caption" className="text-gray-500">
                      {new Date(specItem.timestamp).toLocaleTimeString()}
                    </Typography>
                    
                    <Tooltip title="View specification">
                      <IconButton
                        size="small"
                        onClick={() => {
                          console.log('Vega Spec:', specItem.spec)
                          alert('Specification logged to console')
                        }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Divider className="mb-4" />
                
                <Box className="flex justify-center">
                  <VegaLite
                    spec={specItem.spec}
                    actions={false}
                    renderer="canvas"
                  />
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
      
      {/* Development Info */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <Typography variant="h6" className="font-medium mb-2">
            Development Information
          </Typography>
          
          <Typography variant="body2" className="text-gray-600 mb-2">
            This panel is for development and testing purposes. It allows you to:
          </Typography>
          
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• Test streaming chart data from a server endpoint</li>
            <li>• Generate mock static charts for UI testing</li>
            <li>• Download chart specifications for analysis</li>
            <li>• Debug Vega-Lite rendering issues</li>
          </ul>
          
          <Typography variant="caption" className="text-gray-400 block mt-3">
            Note: This component should not be included in production builds.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default TestPanel