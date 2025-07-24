'use client'

/**
 * ChartRecBox component - Chart recommendation and generation system
 * Migrated from original ChartRecBox.tsx to Next.js with Tailwind
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions, runAgent } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Chip,
  LinearProgress,
  CircularProgress,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Insights as InsightsIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  PrecisionManufacturing as AIIcon,
} from '@mui/icons-material'

// Types
interface ChartRecommendation {
  id: string
  title: string
  description: string
  chartType: 'bar' | 'line' | 'scatter' | 'area' | 'histogram' | 'heatmap' | 'pie'
  encoding: Record<string, any>
  confidence: number
  reasoning: string
}

interface ChartRecBoxProps {
  className?: string
}

interface ChartTypeOption {
  value: string
  label: string
  description: string
  icon: string
}

const CHART_TYPES: ChartTypeOption[] = [
  { value: 'bar', label: 'Bar Chart', description: 'Compare categorical data', icon: '📊' },
  { value: 'line', label: 'Line Chart', description: 'Show trends over time', icon: '📈' },
  { value: 'scatter', label: 'Scatter Plot', description: 'Explore relationships', icon: '⚫' },
  { value: 'area', label: 'Area Chart', description: 'Show quantities over time', icon: '📉' },
  { value: 'histogram', label: 'Histogram', description: 'Show distribution', icon: '📊' },
  { value: 'heatmap', label: 'Heatmap', description: 'Show correlations', icon: '🔥' },
  { value: 'pie', label: 'Pie Chart', description: 'Show proportions', icon: '🥧' },
]

// Chart Recommendation Card Component
const ChartRecommendationCard: React.FC<{
  recommendation: ChartRecommendation
  onSelect: () => void
  onDismiss: () => void
}> = ({ recommendation, onSelect, onDismiss }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <Card className="border border-blue-200 hover:shadow-md transition-shadow">
      <CardContent className="pb-2">
        <Box className="flex items-start justify-between mb-2">
          <Box className="flex items-center space-x-2">
            <span className="text-2xl">
              {CHART_TYPES.find(t => t.value === recommendation.chartType)?.icon || '📊'}
            </span>
            <Box>
              <Typography variant="subtitle2" className="font-semibold">
                {recommendation.title}
              </Typography>
              <Typography variant="caption" className="text-gray-600">
                {CHART_TYPES.find(t => t.value === recommendation.chartType)?.label}
              </Typography>
            </Box>
          </Box>
          
          <Box className="flex items-center space-x-1">
            <Chip
              size="small"
              label={`${Math.round(recommendation.confidence * 100)}%`}
              className={`text-xs ${getConfidenceColor(recommendation.confidence)}`}
            />
            
            <Tooltip title="Dismiss recommendation">
              <IconButton size="small" onClick={onDismiss}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="body2" className="text-gray-700 mb-3">
          {recommendation.description}
        </Typography>
        
        <Box className="mb-3">
          <Typography variant="caption" className="text-gray-600 block mb-1">
            AI Reasoning:
          </Typography>
          <Typography variant="caption" className="text-gray-500 italic">
            {recommendation.reasoning}
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions className="pt-0">
        <Button
          size="small"
          variant="contained"
          onClick={onSelect}
          startIcon={<AddIcon />}
          className="ml-auto"
        >
          Create Chart
        </Button>
      </CardActions>
    </Card>
  )
}

// Main Chart Recommendation Box Component
export function ChartRecBox({ className = '' }: ChartRecBoxProps) {
  const dispatch = useAppDispatch()
  
  // Redux state
  const tables = useAppSelector((state) => state.dataFormulator.tables)
  const selectedTableName = useAppSelector((state) => state.dataFormulator.selectedTableName)
  const selectedModel = useAppSelector((state) => state.dataFormulator.selectedModel)
  const sessionId = useAppSelector((state) => state.dataFormulator.sessionId)
  const isLoadingAgent = useAppSelector((state) => state.dataFormulator.isLoadingAgent)
  
  // Local state
  const [prompt, setPrompt] = useState('')
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Sample recommendations for demo
  useEffect(() => {
    if (selectedTableName && tables[selectedTableName]) {
      const sampleRecommendations: ChartRecommendation[] = [
        {
          id: 'rec-1',
          title: 'Population Trends',
          description: 'Show how population changes over time',
          chartType: 'line',
          encoding: { x: 'Year', y: 'Population', color: 'Country' },
          confidence: 0.9,
          reasoning: 'Time series data with quantitative measure is best shown as line chart'
        },
        {
          id: 'rec-2', 
          title: 'Country Comparison',
          description: 'Compare populations across countries',
          chartType: 'bar',
          encoding: { x: 'Country', y: 'Population' },
          confidence: 0.8,
          reasoning: 'Categorical comparison with quantitative measure works well with bar charts'
        },
        {
          id: 'rec-3',
          title: 'GDP vs Population',
          description: 'Explore relationship between GDP and population',
          chartType: 'scatter',
          encoding: { x: 'Population', y: 'GDP', color: 'Country' },
          confidence: 0.7,
          reasoning: 'Two quantitative variables suggest scatter plot for correlation analysis'
        }
      ]
      
      setRecommendations(sampleRecommendations)
    }
  }, [selectedTableName, tables])

  const handleGenerateRecommendations = useCallback(async () => {
    if (!prompt.trim() || !selectedModel || !sessionId || !selectedTableName) return

    setIsGenerating(true)

    try {
      const result = await dispatch(runAgent({
        agentType: 'sql_data_rec',
        prompt: prompt.trim(),
        data: { tableName: selectedTableName },
        tables,
        modelConfig: selectedModel,
        sessionId,
      })).unwrap()

      if (result.status === 'ok' && result.content.recommendations) {
        setRecommendations(result.content.recommendations)
      }

    } catch (error) {
      console.error('Failed to generate recommendations:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, selectedModel, sessionId, selectedTableName, tables, dispatch])

  const handleCreateCustomChart = useCallback(async () => {
    if (!prompt.trim() || !selectedChartType || !selectedModel || !sessionId) return

    setIsGenerating(true)

    try {
      const result = await dispatch(runAgent({
        agentType: 'python_data_transform',
        prompt: `Create a ${selectedChartType} chart: ${prompt.trim()}`,
        data: { 
          tableName: selectedTableName,
          chartType: selectedChartType 
        },
        tables,
        modelConfig: selectedModel,
        sessionId,
      })).unwrap()

      if (result.status === 'ok') {
        // Chart created successfully
        setPrompt('')
        setSelectedChartType('')
      }

    } catch (error) {
      console.error('Failed to create custom chart:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, selectedChartType, selectedModel, sessionId, selectedTableName, tables, dispatch])

  const handleSelectRecommendation = useCallback(async (recommendation: ChartRecommendation) => {
    if (!selectedModel || !sessionId) return

    setIsGenerating(true)

    try {
      const result = await dispatch(runAgent({
        agentType: 'python_data_transform',
        prompt: `Create a chart: ${recommendation.description}`,
        data: {
          tableName: selectedTableName,
          chartType: recommendation.chartType,
          encoding: recommendation.encoding,
        },
        tables,
        modelConfig: selectedModel,
        sessionId,
      })).unwrap()

      if (result.status === 'ok') {
        // Remove the selected recommendation
        setRecommendations(prev => prev.filter(r => r.id !== recommendation.id))
      }

    } catch (error) {
      console.error('Failed to create recommended chart:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedModel, sessionId, selectedTableName, tables, dispatch])

  const handleDismissRecommendation = useCallback((recommendationId: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== recommendationId))
  }, [])

  const canGenerate = prompt.trim() && selectedModel && !isGenerating && !isLoadingAgent

  return (
    <Card className={`chart-rec-box ${className}`}>
      <CardContent className="p-4">
        <Box className="flex items-center justify-between mb-4">
          <Box className="flex items-center space-x-2">
            <InsightsIcon className="text-blue-600" />
            <Typography variant="h6" className="font-semibold">
              Chart Recommendations
            </Typography>
          </Box>
          
          {recommendations.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setRecommendations([])}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          )}
        </Box>

        {/* Chart creation interface */}
        <Box className="space-y-4 mb-6">
          {/* Natural language input */}
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Describe the chart you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating || isLoadingAgent}
            helperText="Example: 'Show population growth by country over time' or 'Compare GDP across regions'"
          />

          <Box className="flex items-center space-x-3">
            {/* Quick generate button */}
            <Button
              variant="contained"
              onClick={handleGenerateRecommendations}
              disabled={!canGenerate}
              startIcon={isGenerating ? <CircularProgress size={16} /> : <AIIcon />}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : 'Get AI Recommendations'}
            </Button>

            {/* Advanced options toggle */}
            <Button
              variant="outlined"
              onClick={() => setShowAdvanced(!showAdvanced)}
              size="small"
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </Box>

          {/* Advanced options */}
          {showAdvanced && (
            <Box className="p-4 bg-gray-50 rounded-lg space-y-3">
              <FormControl size="small" fullWidth>
                <InputLabel>Preferred Chart Type</InputLabel>
                <Select
                  value={selectedChartType}
                  onChange={(e) => setSelectedChartType(e.target.value)}
                  label="Preferred Chart Type"
                >
                  <MenuItem value="">Auto-select</MenuItem>
                  {CHART_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box className="flex items-center space-x-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                onClick={handleCreateCustomChart}
                disabled={!canGenerate || !selectedChartType}
                startIcon={<AddIcon />}
                fullWidth
              >
                Create Specific Chart Type
              </Button>
            </Box>
          )}
        </Box>

        <Divider className="mb-4" />

        {/* Recommendations list */}
        {isGenerating && (
          <Box className="mb-4">
            <LinearProgress className="mb-2" />
            <Typography variant="body2" className="text-center text-gray-600">
              AI is analyzing your data and generating chart recommendations...
            </Typography>
          </Box>
        )}

        {recommendations.length > 0 ? (
          <Box className="space-y-3">
            <Typography variant="subtitle2" className="font-semibold">
              Recommended Charts ({recommendations.length})
            </Typography>
            
            {recommendations.map((recommendation) => (
              <ChartRecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onSelect={() => handleSelectRecommendation(recommendation)}
                onDismiss={() => handleDismissRecommendation(recommendation.id)}
              />
            ))}
          </Box>
        ) : !isGenerating && (
          <Box className="text-center py-8 text-gray-500">
            <InsightsIcon className="text-4xl mb-2 text-gray-300" />
            <Typography variant="body2" className="mb-2">
              No recommendations yet
            </Typography>
            <Typography variant="caption">
              {selectedTableName 
                ? 'Describe what you want to visualize to get AI-powered chart suggestions'
                : 'Select a data table first, then describe your visualization needs'
              }
            </Typography>
          </Box>
        )}

        {/* Help text */}
        <Box className="mt-6 p-3 bg-blue-50 rounded-lg">
          <Typography variant="caption" className="text-blue-800">
            💡 The AI analyzes your data structure and generates contextual chart recommendations based on your description
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}