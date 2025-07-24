'use client'

/**
 * Table Upload Dialog - Upload CSV files and other data sources
 * Migrated from original TableSelectionView.tsx to Next.js with Tailwind
 */

import React, { useState, useCallback, useRef } from 'react'
import { useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'
import { csvToObjects } from '@/lib/utils'

// MUI components during migration
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Upload as UploadIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
  Link as LinkIcon,
  ContentPaste as PasteIcon,
  Description as FileIcon,
} from '@mui/icons-material'

interface TableUploadDialogProps {
  open: boolean
  onClose: () => void
}

interface TableUploadButtonProps {
  buttonElement?: React.ReactNode
  disabled?: boolean
  className?: string
}

type UploadMethod = 'file' | 'url' | 'paste'

export function TableUploadDialog({ open, onClose }: TableUploadDialogProps) {
  const dispatch = useAppDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('file')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form data
  const [tableName, setTableName] = useState('')
  const [pastedData, setPastedData] = useState('')
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!tableName) {
        setTableName(file.name.replace(/\.[^/.]+$/, '')) // Remove extension
      }
      setError(null)
    }
  }, [tableName])

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile || !tableName.trim()) {
      setError('Please select a file and provide a table name')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const text = await selectedFile.text()
      
      // Parse CSV data
      const data = csvToObjects(text)
      
      if (data.length === 0) {
        throw new Error('No data found in the file')
      }

      // Add to Redux store
      dispatch(dataFormulatorActions.addTable({
        name: tableName.trim(),
        data: data
      }))

      setSuccess(`Successfully uploaded ${data.length} rows to table "${tableName}"`)
      
      // Clear form
      setSelectedFile(null)
      setTableName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, tableName, dispatch])

  const handlePasteUpload = useCallback(async () => {
    if (!pastedData.trim() || !tableName.trim()) {
      setError('Please paste data and provide a table name')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Parse pasted CSV data
      const data = csvToObjects(pastedData.trim())
      
      if (data.length === 0) {
        throw new Error('No valid data found in the pasted content')
      }

      // Add to Redux store
      dispatch(dataFormulatorActions.addTable({
        name: tableName.trim(),
        data: data
      }))

      setSuccess(`Successfully created table "${tableName}" with ${data.length} rows`)
      
      // Clear form
      setPastedData('')
      setTableName('')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse pasted data')
    } finally {
      setIsUploading(false)
    }
  }, [pastedData, tableName, dispatch])

  const handleUrlUpload = useCallback(async () => {
    if (!url.trim() || !tableName.trim()) {
      setError('Please provide a URL and table name')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const response = await fetch(url.trim())
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const text = await response.text()
      const data = csvToObjects(text)
      
      if (data.length === 0) {
        throw new Error('No data found at the URL')
      }

      // Add to Redux store
      dispatch(dataFormulatorActions.addTable({
        name: tableName.trim(),
        data: data
      }))

      setSuccess(`Successfully loaded ${data.length} rows from URL to table "${tableName}"`)
      
      // Clear form
      setUrl('')
      setTableName('')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data from URL')
    } finally {
      setIsUploading(false)
    }
  }, [url, tableName, dispatch])

  const handleUpload = useCallback(() => {
    switch (uploadMethod) {
      case 'file':
        return handleFileUpload()
      case 'paste':
        return handlePasteUpload()
      case 'url':
        return handleUrlUpload()
    }
  }, [uploadMethod, handleFileUpload, handlePasteUpload, handleUrlUpload])

  const handleClose = useCallback(() => {
    setError(null)
    setSuccess(null)
    setIsUploading(false)
    onClose()
  }, [onClose])

  const canUpload = () => {
    if (!tableName.trim()) return false
    
    switch (uploadMethod) {
      case 'file':
        return !!selectedFile
      case 'paste':
        return !!pastedData.trim()
      case 'url':
        return !!url.trim()
      default:
        return false
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'max-h-[80vh]'
      }}
    >
      <DialogTitle className="flex items-center justify-between">
        <Box className="flex items-center space-x-2">
          <UploadIcon />
          <Typography variant="h6">Upload Data Table</Typography>
        </Box>
        
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box className="space-y-6">
          {/* Success/Error messages */}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Table name input */}
          <TextField
            fullWidth
            label="Table Name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="Enter a name for your data table"
            disabled={isUploading}
          />

          {/* Upload method tabs */}
          <Box>
            <Tabs
              value={uploadMethod}
              onChange={(_, value) => setUploadMethod(value)}
              variant="fullWidth"
            >
              <Tab
                value="file"
                label="Upload File"
                icon={<FileUploadIcon />}
                iconPosition="start"
              />
              <Tab
                value="paste"
                label="Paste Data"
                icon={<PasteIcon />}
                iconPosition="start"
              />
              <Tab
                value="url"
                label="From URL"
                icon={<LinkIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Upload method content */}
          <Box className="min-h-48">
            {uploadMethod === 'file' && (
              <Box className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Card 
                  className="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CardContent className="text-center py-8">
                    <FileIcon className="text-4xl text-gray-400 mb-2" />
                    <Typography variant="h6" className="mb-2">
                      Choose a file to upload
                    </Typography>
                    <Typography variant="body2" className="text-gray-600 mb-4">
                      Supports CSV, TSV, and TXT files
                    </Typography>
                    <Button variant="outlined">
                      Browse Files
                    </Button>
                  </CardContent>
                </Card>

                {selectedFile && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-3">
                      <Box className="flex items-center justify-between">
                        <Box className="flex items-center space-x-2">
                          <FileIcon className="text-blue-600" />
                          <Box>
                            <Typography variant="subtitle2">
                              {selectedFile.name}
                            </Typography>
                            <Typography variant="caption" className="text-gray-600">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Chip
                          label={selectedFile.type || 'text/csv'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}

            {uploadMethod === 'paste' && (
              <Box className="space-y-4">
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Paste CSV Data"
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  placeholder="Paste your CSV data here... Include headers in the first row."
                  disabled={isUploading}
                />
                
                <Alert severity="info" className="text-sm">
                  💡 Tip: Make sure your data includes column headers in the first row and uses commas to separate values.
                </Alert>
              </Box>
            )}

            {uploadMethod === 'url' && (
              <Box className="space-y-4">
                <TextField
                  fullWidth
                  label="Data URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/data.csv"
                  disabled={isUploading}
                />
                
                <Alert severity="info" className="text-sm">
                  💡 The URL should point to a publicly accessible CSV file. CORS restrictions may apply.
                </Alert>
              </Box>
            )}
          </Box>

          {/* Upload progress */}
          {isUploading && (
            <Box>
              <LinearProgress className="mb-2" />
              <Typography variant="body2" className="text-center text-gray-600">
                Processing your data...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions className="p-4">
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!canUpload() || isUploading}
          startIcon={<UploadIcon />}
        >
          Upload Data
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Table Upload Button Component
export function TableUploadButton({ 
  buttonElement, 
  disabled = false, 
  className = '' 
}: TableUploadButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const defaultButton = (
    <Button
      variant="outlined"
      startIcon={<UploadIcon />}
      disabled={disabled}
      className={className}
    >
      Upload Data
    </Button>
  )

  return (
    <>
      <Box onClick={() => !disabled && setDialogOpen(true)}>
        {buttonElement || defaultButton}
      </Box>

      <TableUploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  )
}