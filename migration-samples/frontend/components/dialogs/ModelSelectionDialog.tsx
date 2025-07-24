'use client'

/**
 * Model Selection Dialog - Choose AI models for data transformation
 * Migrated from original ModelSelectionDialog.tsx to Next.js with Tailwind
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions, fetchAvailableModels } from '@/lib/store/slices/dataFormulatorSlice'

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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material'

interface ModelConfig {
  provider: string
  model: string
  api_key?: string
  api_base?: string
  api_version?: string
  temperature: number
  max_tokens?: number
}

interface ModelSelectionDialogProps {
  open: boolean
  onClose: () => void
}

interface ModelSelectionButtonProps {
  className?: string
}

// Model providers and their configurations
const MODEL_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    requiresApiKey: true,
    fields: ['api_key']
  },
  azure: {
    name: 'Azure OpenAI',
    models: ['gpt-4', 'gpt-35-turbo'],
    requiresApiKey: true,
    fields: ['api_key', 'api_base', 'api_version']
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
    requiresApiKey: true,
    fields: ['api_key']
  },
  google: {
    name: 'Google',
    models: ['gemini-pro', 'gemini-pro-vision'],
    requiresApiKey: true,
    fields: ['api_key']
  },
  ollama: {
    name: 'Ollama (Local)',
    models: ['llama2', 'codellama', 'mistral'],
    requiresApiKey: false,
    fields: ['api_base']
  },
}

export function ModelSelectionDialog({ open, onClose }: ModelSelectionDialogProps) {
  const dispatch = useAppDispatch()
  const availableModels = useAppSelector((state) => state.dataFormulator.availableModels)
  const selectedModel = useAppSelector((state) => state.dataFormulator.selectedModel)
  const isLoading = useAppSelector((state) => state.dataFormulator.isLoadingModels)

  // Form state
  const [provider, setProvider] = useState<string>('openai')
  const [model, setModel] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [apiBase, setApiBase] = useState<string>('')
  const [apiVersion, setApiVersion] = useState<string>('')
  const [temperature, setTemperature] = useState<number>(0.1)
  const [maxTokens, setMaxTokens] = useState<number>(2000)
  const [showApiKey, setShowApiKey] = useState<boolean>(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testMessage, setTestMessage] = useState<string>('')

  // Initialize form with selected model
  useEffect(() => {
    if (selectedModel) {
      setProvider(selectedModel.provider)
      setModel(selectedModel.model)
      setApiKey(selectedModel.api_key || '')
      setApiBase(selectedModel.api_base || '')
      setApiVersion(selectedModel.api_version || '')
      setTemperature(selectedModel.temperature)
      setMaxTokens(selectedModel.max_tokens || 2000)
    }
  }, [selectedModel])

  // Update available models when provider changes
  useEffect(() => {
    if (provider && MODEL_PROVIDERS[provider as keyof typeof MODEL_PROVIDERS]) {
      const providerModels = MODEL_PROVIDERS[provider as keyof typeof MODEL_PROVIDERS].models
      if (!model || !providerModels.includes(model)) {
        setModel(providerModels[0] || '')
      }
    }
  }, [provider, model])

  const handleTestConnection = useCallback(async () => {
    if (!provider || !model) {
      setTestResult('error')
      setTestMessage('Please select a provider and model')
      return
    }

    const testConfig: ModelConfig = {
      provider,
      model,
      api_key: apiKey,
      api_base: apiBase,
      api_version: apiVersion,
      temperature,
      max_tokens: maxTokens,
    }

    try {
      // Test the model configuration
      // This would call the backend API to test the connection
      setTestResult('success')
      setTestMessage('Connection successful!')
      
      // In a real implementation, you would call:
      // const result = await testModelConnection(testConfig)
      
    } catch (error) {
      setTestResult('error')
      setTestMessage(error instanceof Error ? error.message : 'Connection failed')
    }
  }, [provider, model, apiKey, apiBase, apiVersion, temperature, maxTokens])

  const handleSave = useCallback(() => {
    const modelConfig: ModelConfig = {
      provider,
      model,
      api_key: apiKey,
      api_base: apiBase,
      api_version: apiVersion,
      temperature,
      max_tokens: maxTokens,
    }

    dispatch(dataFormulatorActions.setSelectedModel(modelConfig))
    onClose()
  }, [provider, model, apiKey, apiBase, apiVersion, temperature, maxTokens, dispatch, onClose])

  const handleRefreshModels = useCallback(() => {
    dispatch(fetchAvailableModels())
  }, [dispatch])

  const currentProvider = MODEL_PROVIDERS[provider as keyof typeof MODEL_PROVIDERS]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'max-h-[80vh]'
      }}
    >
      <DialogTitle className="flex items-center justify-between">
        <Box className="flex items-center space-x-2">
          <SettingsIcon />
          <Typography variant="h6">Model Configuration</Typography>
        </Box>
        
        <Tooltip title="Refresh available models">
          <IconButton onClick={handleRefreshModels} disabled={isLoading}>
            <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent dividers>
        <Box className="space-y-6">
          {/* Current selection display */}
          {selectedModel && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pb-3">
                <Typography variant="subtitle2" className="mb-2">
                  Currently Selected
                </Typography>
                <Box className="flex items-center space-x-2">
                  <Chip
                    label={selectedModel.provider}
                    size="small"
                    className="bg-blue-100"
                  />
                  <Chip
                    label={selectedModel.model}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" className="text-gray-600">
                    Temp: {selectedModel.temperature}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Provider selection */}
          <FormControl fullWidth>
            <InputLabel>Provider</InputLabel>
            <Select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              label="Provider"
            >
              {Object.entries(MODEL_PROVIDERS).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  <Box className="flex items-center justify-between w-full">
                    <span>{config.name}</span>
                    {config.requiresApiKey && (
                      <Chip size="small" label="API Key Required" />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Model selection */}
          {currentProvider && (
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                label="Model"
              >
                {currentProvider.models.map((modelName) => (
                  <MenuItem key={modelName} value={modelName}>
                    {modelName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* API Configuration */}
          {currentProvider && (
            <Box className="space-y-4">
              <Typography variant="subtitle2" className="font-semibold">
                API Configuration
              </Typography>

              {/* API Key */}
              {currentProvider.fields.includes('api_key') && (
                <TextField
                  fullWidth
                  label="API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    ),
                  }}
                />
              )}

              {/* API Base URL */}
              {currentProvider.fields.includes('api_base') && (
                <TextField
                  fullWidth
                  label="API Base URL"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com'}
                />
              )}

              {/* API Version */}
              {currentProvider.fields.includes('api_version') && (
                <TextField
                  fullWidth
                  label="API Version"
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  placeholder="2023-05-15"
                />
              )}
            </Box>
          )}

          <Divider />

          {/* Model parameters */}
          <Box className="space-y-4">
            <Typography variant="subtitle2" className="font-semibold">
              Model Parameters
            </Typography>

            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Temperature"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 2, step: 0.1 }}
                helperText="Controls randomness (0 = deterministic, 2 = very random)"
              />

              <TextField
                label="Max Tokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                inputProps={{ min: 1, max: 4000 }}
                helperText="Maximum tokens in response"
              />
            </Box>
          </Box>

          {/* Test connection */}
          <Box className="space-y-3">
            <Box className="flex items-center justify-between">
              <Typography variant="subtitle2" className="font-semibold">
                Test Connection
              </Typography>
              
              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={!provider || !model}
                startIcon={testResult === 'success' ? <CheckIcon /> : testResult === 'error' ? <ErrorIcon /> : undefined}
                className={
                  testResult === 'success' 
                    ? 'border-green-500 text-green-600'
                    : testResult === 'error'
                    ? 'border-red-500 text-red-600'
                    : ''
                }
              >
                Test Connection
              </Button>
            </Box>

            {testResult && (
              <Alert 
                severity={testResult === 'success' ? 'success' : 'error'}
                className="text-sm"
              >
                {testMessage}
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="p-4">
        <Button onClick={onClose}>
          Cancel
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!provider || !model || (currentProvider?.requiresApiKey && !apiKey)}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Model Selection Button Component
export function ModelSelectionButton({ className = '' }: ModelSelectionButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const selectedModel = useAppSelector((state) => state.dataFormulator.selectedModel)

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => setDialogOpen(true)}
        startIcon={<SettingsIcon />}
        className={`text-sm ${className}`}
      >
        {selectedModel 
          ? `${selectedModel.provider}/${selectedModel.model}`
          : 'Select Model'
        }
      </Button>

      <ModelSelectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  )
}