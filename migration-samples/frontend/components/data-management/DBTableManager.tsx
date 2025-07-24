'use client'

/**
 * DBTableManager component - Database table management and analysis
 * Migrated from original DBTableManager.tsx to Next.js with Tailwind
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  Paper,
  Tooltip,
  ButtonGroup,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Close as CloseIcon,
  Analytics as AnalyticsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  TableRows as TableRowsIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon,
} from '@mui/icons-material'

// Types
interface DBTable {
  name: string
  columns: Array<{
    name: string
    type: string
  }>
  row_count: number
  sample_rows: any[]
  view_source: string | null
}

interface ColumnStatistics {
  column: string
  type: string
  statistics: {
    count: number
    unique_count: number
    null_count: number
    min?: number
    max?: number
    avg?: number
  }
}

interface DataLoader {
  params: Array<{
    name: string
    default: string
    type: string
    required: boolean
    description: string
  }>
  auth_instructions: string
}

interface DBTableManagerProps {
  buttonElement?: React.ReactNode
  className?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  value: string
  selectedValue: string
}

// Tab Panel Component
const TabPanel: React.FC<TabPanelProps> = ({ children, value, selectedValue }) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== selectedValue}
      className={`${value === selectedValue ? 'block' : 'hidden'} p-4`}
    >
      {value === selectedValue && children}
    </Box>
  )
}

// Table Statistics View Component
const TableStatisticsView: React.FC<{
  tableName: string
  columnStats: ColumnStatistics[]
}> = ({ tableName, columnStats }) => {
  return (
    <Box className="h-80 flex flex-col">
      <Typography variant="h6" className="mb-4 font-semibold">
        Statistics for {tableName}
      </Typography>
      
      <TableContainer className="flex-1 max-h-80 overflow-auto">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="bg-gray-100 font-bold text-xs p-2">Column</TableCell>
              <TableCell className="bg-white text-xs p-2">Type</TableCell>
              <TableCell align="right" className="bg-white text-xs p-2">Count</TableCell>
              <TableCell align="right" className="bg-white text-xs p-2">Unique</TableCell>
              <TableCell align="right" className="bg-white text-xs p-2">Null</TableCell>
              <TableCell align="right" className="bg-white text-xs p-2">Min</TableCell>
              <TableCell align="right" className="bg-white text-xs p-2">Max</TableCell>
              <TableCell align="right" className="bg-white text-xs p-2">Avg</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {columnStats.map((stat) => (
              <TableRow key={stat.column} hover>
                <TableCell className="font-bold bg-gray-50 text-xs p-2">
                  {stat.column}
                </TableCell>
                <TableCell className="text-xs p-2">
                  <Chip size="small" label={stat.type} variant="outlined" />
                </TableCell>
                <TableCell align="right" className="text-xs p-2">
                  {stat.statistics.count.toLocaleString()}
                </TableCell>
                <TableCell align="right" className="text-xs p-2">
                  {stat.statistics.unique_count.toLocaleString()}
                </TableCell>
                <TableCell align="right" className="text-xs p-2">
                  {stat.statistics.null_count.toLocaleString()}
                </TableCell>
                <TableCell align="right" className="text-xs p-2">
                  {stat.statistics.min !== undefined ? stat.statistics.min : '-'}
                </TableCell>
                <TableCell align="right" className="text-xs p-2">
                  {stat.statistics.max !== undefined ? stat.statistics.max : '-'}
                </TableCell>
                <TableCell align="right" className="text-xs p-2">
                  {stat.statistics.avg !== undefined 
                    ? Number(stat.statistics.avg).toFixed(2) 
                    : '-'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

// Table Preview Component
const TablePreview: React.FC<{ table: DBTable }> = ({ table }) => {
  return (
    <Box className="space-y-4">
      <Box className="flex items-center justify-between">
        <Typography variant="h6" className="font-semibold">
          {table.name}
        </Typography>
        <Chip 
          label={`${table.row_count.toLocaleString()} rows`} 
          color="primary" 
          size="small" 
        />
      </Box>
      
      <Box className="grid grid-cols-2 gap-4">
        <Card variant="outlined">
          <CardContent className="p-3">
            <Typography variant="subtitle2" className="font-medium mb-2">
              Columns ({table.columns.length})
            </Typography>
            <Box className="space-y-1 max-h-32 overflow-y-auto">
              {table.columns.map((col, index) => (
                <Box key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{col.name}</span>
                  <Chip label={col.type} size="small" variant="outlined" />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
        
        <Card variant="outlined">
          <CardContent className="p-3">
            <Typography variant="subtitle2" className="font-medium mb-2">
              Sample Data
            </Typography>
            <Box className="max-h-32 overflow-auto">
              {table.sample_rows.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {table.columns.slice(0, 3).map(col => (
                        <th key={col.name} className="text-left p-1 font-medium">
                          {col.name}
                        </th>
                      ))}
                      {table.columns.length > 3 && <th className="text-left p-1">...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {table.sample_rows.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b">
                        {table.columns.slice(0, 3).map(col => (
                          <td key={col.name} className="p-1 truncate max-w-20">
                            {String(row[col.name] ?? '')}
                          </td>
                        ))}
                        {table.columns.length > 3 && <td className="p-1">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Typography variant="body2" className="text-gray-500">
                  No sample data available
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      {table.view_source && (
        <Card variant="outlined">
          <CardContent className="p-3">
            <Typography variant="subtitle2" className="font-medium mb-2">
              View Source
            </Typography>
            <Box className="p-2 bg-gray-100 rounded text-xs font-mono">
              <pre className="whitespace-pre-wrap">{table.view_source}</pre>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

// Data Loader Panel Component
const DataLoaderPanel: React.FC<{
  loaderType: string
  loader: DataLoader
}> = ({ loaderType, loader }) => {
  const [params, setParams] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  const dispatch = useAppDispatch()
  
  const handleParamChange = useCallback((paramName: string, value: string) => {
    setParams(prev => ({ ...prev, [paramName]: value }))
  }, [])
  
  const handleLoad = useCallback(async () => {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual implementation
      console.log('Loading data with params:', params)
      // dispatch API call here
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [params, dispatch])
  
  return (
    <Box className="space-y-4">
      <Typography variant="h6" className="font-semibold capitalize">
        {loaderType.replace('_', ' ')} Data Loader
      </Typography>
      
      {loader.auth_instructions && (
        <Card variant="outlined" className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-3">
            <Typography variant="subtitle2" className="font-medium mb-2">
              Authentication Instructions
            </Typography>
            <Typography variant="body2" className="text-sm">
              {loader.auth_instructions}
            </Typography>
          </CardContent>
        </Card>
      )}
      
      <Box className="space-y-3">
        {loader.params.map((param) => (
          <TextField
            key={param.name}
            fullWidth
            label={param.name}
            placeholder={param.default}
            required={param.required}
            helperText={param.description}
            value={params[param.name] || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            size="small"
          />
        ))}
      </Box>
      
      <Button
        variant="contained"
        onClick={handleLoad}
        disabled={isLoading || loader.params.some(p => p.required && !params[p.name])}
        startIcon={isLoading ? <CircularProgress size={16} /> : <AddIcon />}
        fullWidth
      >
        {isLoading ? 'Loading...' : 'Load Data'}
      </Button>
    </Box>
  )
}

// Main Component
export function DBTableManager({ 
  buttonElement = <Button variant="outlined">DB Tables</Button>,
  className = '' 
}: DBTableManagerProps) {
  const dispatch = useAppDispatch()
  const sessionId = useAppSelector((state) => state.dataFormulator.sessionId)
  
  // State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dbTables, setDbTables] = useState<DBTable[]>([])
  const [selectedTabKey, setSelectedTabKey] = useState('')
  const [tableAnalysisMap, setTableAnalysisMap] = useState<Record<string, ColumnStatistics[] | null>>({})
  const [dataLoaderMetadata, setDataLoaderMetadata] = useState<Record<string, DataLoader>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Fetch tables and data loaders
  const fetchTables = useCallback(async () => {
    try {
      setIsRefreshing(true)
      // Mock API call - replace with actual implementation
      const mockTables: DBTable[] = [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'INTEGER' },
            { name: 'name', type: 'TEXT' },
            { name: 'email', type: 'TEXT' },
          ],
          row_count: 1000,
          sample_rows: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          ],
          view_source: null
        }
      ]
      setDbTables(mockTables)
      if (mockTables.length > 0 && !selectedTabKey) {
        setSelectedTabKey(mockTables[0].name)
      }
    } catch (error) {
      dispatch(dataFormulatorActions.addMessage({
        timestamp: Date.now(),
        component: 'DB Manager',
        type: 'error',
        value: 'Failed to fetch tables'
      }))
    } finally {
      setIsRefreshing(false)
    }
  }, [dispatch, selectedTabKey])
  
  const fetchDataLoaders = useCallback(async () => {
    try {
      // Mock data loaders - replace with actual API call
      const mockLoaders: Record<string, DataLoader> = {
        csv_loader: {
          params: [
            {
              name: 'file_path',
              default: '',
              type: 'string',
              required: true,
              description: 'Path to CSV file'
            }
          ],
          auth_instructions: 'No authentication required for CSV files'
        }
      }
      setDataLoaderMetadata(mockLoaders)
    } catch (error) {
      console.error('Failed to fetch data loaders:', error)
    }
  }, [])
  
  const fetchTableAnalysis = useCallback(async (tableName: string) => {
    if (tableAnalysisMap[tableName] !== undefined) return
    
    try {
      setTableAnalysisMap(prev => ({ ...prev, [tableName]: null }))
      // Mock analysis data - replace with actual API call
      const mockAnalysis: ColumnStatistics[] = [
        {
          column: 'id',
          type: 'INTEGER',
          statistics: {
            count: 1000,
            unique_count: 1000,
            null_count: 0,
            min: 1,
            max: 1000,
            avg: 500.5
          }
        }
      ]
      setTableAnalysisMap(prev => ({ ...prev, [tableName]: mockAnalysis }))
    } catch (error) {
      setTableAnalysisMap(prev => ({ ...prev, [tableName]: [] }))
    }
  }, [tableAnalysisMap])
  
  // File upload handler
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('table_name', file.name.split('.')[0])
    
    try {
      setIsUploading(true)
      // Mock upload - replace with actual API call
      console.log('Uploading file:', file.name)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate upload
      await fetchTables()
      
      dispatch(dataFormulatorActions.addMessage({
        timestamp: Date.now(),
        component: 'DB Manager',
        type: 'success',
        value: `Successfully uploaded ${file.name}`
      }))
    } catch (error) {
      dispatch(dataFormulatorActions.addMessage({
        timestamp: Date.now(),
        component: 'DB Manager',
        type: 'error',
        value: 'Failed to upload file'
      }))
    } finally {
      setIsUploading(false)
      event.target.value = '' // Reset file input
    }
  }, [dispatch, fetchTables])
  
  const handleDeleteTable = useCallback(async (tableName: string) => {
    if (!confirm(`Are you sure you want to delete table "${tableName}"?`)) return
    
    try {
      // Mock delete - replace with actual API call
      console.log('Deleting table:', tableName)
      setDbTables(prev => prev.filter(t => t.name !== tableName))
      
      if (selectedTabKey === tableName) {
        setSelectedTabKey(dbTables.length > 1 ? dbTables[0].name : '')
      }
      
      dispatch(dataFormulatorActions.addMessage({
        timestamp: Date.now(),
        component: 'DB Manager',
        type: 'success',
        value: `Successfully deleted table ${tableName}`
      }))
    } catch (error) {
      dispatch(dataFormulatorActions.addMessage({
        timestamp: Date.now(),
        component: 'DB Manager',
        type: 'error',
        value: `Failed to delete table ${tableName}`
      }))
    }
  }, [selectedTabKey, dbTables, dispatch])
  
  const handleDownloadDB = useCallback(async () => {
    try {
      // Mock download - replace with actual implementation
      console.log('Downloading database for session:', sessionId)
      dispatch(dataFormulatorActions.addMessage({
        timestamp: Date.now(),
        component: 'DB Manager',
        type: 'info',
        value: 'Database download started'
      }))
    } catch (error) {
      dispatch(dataFormulatorActions.addMessage({
        timestamp: Date.now(),
        component: 'DB Manager',
        type: 'error',
        value: 'Failed to download database'
      }))
    }
  }, [sessionId, dispatch])
  
  // Effects
  useEffect(() => {
    if (dialogOpen) {
      fetchTables()
      fetchDataLoaders()
    }
  }, [dialogOpen, fetchTables, fetchDataLoaders])
  
  useEffect(() => {
    if (selectedTabKey && !selectedTabKey.startsWith('dataLoader:')) {
      fetchTableAnalysis(selectedTabKey)
    }
  }, [selectedTabKey, fetchTableAnalysis])
  
  const selectedTable = dbTables.find(t => t.name === selectedTabKey)
  const selectedAnalysis = selectedTabKey ? tableAnalysisMap[selectedTabKey] : null
  
  return (
    <>
      <div onClick={() => setDialogOpen(true)} className={className}>
        {buttonElement}
      </div>
      
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          className: "max-w-6xl max-h-screen w-full mx-4"
        }}
      >
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Typography variant="h6" className="font-semibold">
              Database Table Manager
            </Typography>
            
            <Box className="flex items-center space-x-2">
              <input
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload-input"
                disabled={isUploading}
              />
              <label htmlFor="file-upload-input">
                <Button
                  component="span"
                  variant="outlined"
                  size="small"
                  startIcon={isUploading ? <CircularProgress size={16} /> : <UploadIcon />}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </label>
              
              <Button
                variant="outlined"
                size="small"
                onClick={handleDownloadDB}
                startIcon={<DownloadIcon />}
              >
                Download DB
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={fetchTables}
                startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                disabled={isRefreshing}
              >
                Refresh
              </Button>
              
              <IconButton size="small" onClick={() => setDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent className="p-0">
          <Box className="flex h-96">
            {/* Sidebar */}
            <Box className="w-64 border-r bg-gray-50">
              <Tabs
                orientation="vertical"
                value={selectedTabKey}
                onChange={(_, newValue) => setSelectedTabKey(newValue)}
                className="p-2"
                variant="scrollable"
              >
                {dbTables.map((table) => (
                  <Tab
                    key={table.name}
                    label={
                      <Box className="flex items-center justify-between w-full">
                        <Box className="flex items-center space-x-2">
                          <TableRowsIcon fontSize="small" />
                          <span className="text-sm">{table.name}</span>
                        </Box>
                        <Box className="flex items-center space-x-1">
                          <Chip 
                            label={table.row_count.toLocaleString()} 
                            size="small" 
                            variant="outlined"
                            className="h-5 text-xs"
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTable(table.name)
                            }}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    }
                    value={table.name}
                    className="group"
                  />
                ))}
                
                <Divider className="my-2" />
                
                {Object.keys(dataLoaderMetadata).map((loaderType) => (
                  <Tab
                    key={`dataLoader:${loaderType}`}
                    label={
                      <Box className="flex items-center space-x-2">
                        <AddIcon fontSize="small" />
                        <span className="text-sm capitalize">
                          {loaderType.replace('_', ' ')}
                        </span>
                      </Box>
                    }
                    value={`dataLoader:${loaderType}`}
                  />
                ))}
              </Tabs>
            </Box>
            
            {/* Content */}
            <Box className="flex-1 overflow-auto">
              {selectedTable && (
                <TabPanel value={selectedTable.name} selectedValue={selectedTabKey}>
                  <Box className="space-y-6">
                    <TablePreview table={selectedTable} />
                    
                    {selectedAnalysis && selectedAnalysis.length > 0 && (
                      <Divider />
                    )}
                    
                    {selectedAnalysis === null ? (
                      <Box className="flex items-center justify-center p-8">
                        <CircularProgress size={24} />
                        <Typography className="ml-2">Loading statistics...</Typography>
                      </Box>
                    ) : selectedAnalysis && selectedAnalysis.length > 0 ? (
                      <TableStatisticsView 
                        tableName={selectedTable.name}
                        columnStats={selectedAnalysis}
                      />
                    ) : null}
                  </Box>
                </TabPanel>
              )}
              
              {Object.entries(dataLoaderMetadata).map(([loaderType, loader]) => (
                <TabPanel 
                  key={`dataLoader:${loaderType}`}
                  value={`dataLoader:${loaderType}`} 
                  selectedValue={selectedTabKey}
                >
                  <DataLoaderPanel loaderType={loaderType} loader={loader} />
                </TabPanel>
              ))}
              
              {!selectedTabKey && (
                <Box className="flex items-center justify-center p-8 text-gray-500">
                  <Typography>Select a table or data loader to view details</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions className="p-4">
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DBTableManager