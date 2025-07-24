'use client'

/**
 * Home page for Data Formulator
 * Next.js App Router main page
 */

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { fetchAvailableModels, getSessionId } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import { Box, Typography, Button, Container } from '@mui/material'

export default function HomePage() {
  const dispatch = useAppDispatch()
  const sessionId = useAppSelector((state) => state.dataFormulator.sessionId)
  const isLoading = useAppSelector((state) => state.dataFormulator.isLoadingModels)

  useEffect(() => {
    // Initialize the application
    dispatch(getSessionId())
    dispatch(fetchAvailableModels())
  }, [dispatch])

  const handleStartAnalysis = () => {
    // Navigate to dashboard or main application
    window.location.href = '/dashboard'
  }

  return (
    <Container maxWidth="lg" className="min-h-screen flex items-center justify-center">
      <Box className="text-center">
        <Typography variant="h2" component="h1" className="mb-4 font-bold">
          Data Formulator
        </Typography>
        
        <Typography variant="h5" className="mb-8 text-gray-600">
          AI-powered data visualization and transformation tool
        </Typography>
        
        <Typography variant="body1" className="mb-8 max-w-2xl mx-auto">
          Transform data and create rich visualizations iteratively with AI. 
          Combine UI interactions with natural language processing to analyze your data.
        </Typography>

        <Box className="space-y-4">
          <Button
            variant="contained"
            size="large"
            onClick={handleStartAnalysis}
            disabled={isLoading}
            className="px-8 py-3"
          >
            {isLoading ? 'Initializing...' : 'Get Started'}
          </Button>
          
          {sessionId && (
            <Typography variant="caption" className="block text-gray-500">
              Session: {sessionId.substring(0, 8)}...
            </Typography>
          )}
        </Box>

        {/* Feature highlights */}
        <Box className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Box className="text-center">
            <Typography variant="h6" className="mb-2">
              🤖 AI-Powered
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Use natural language to transform and visualize your data
            </Typography>
          </Box>
          
          <Box className="text-center">
            <Typography variant="h6" className="mb-2">
              📊 Interactive Charts
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Create rich visualizations with drag-and-drop interactions
            </Typography>
          </Box>
          
          <Box className="text-center">
            <Typography variant="h6" className="mb-2">
              🔄 Iterative Analysis
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Refine your analysis through conversational interactions
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}