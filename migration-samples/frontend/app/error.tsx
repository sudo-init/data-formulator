'use client'

import { useEffect } from 'react'
import { Box, Typography, Button, Container } from '@mui/material'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <Container maxWidth="sm" className="min-h-screen flex items-center justify-center">
      <Box className="text-center">
        <Typography variant="h4" className="mb-4 text-red-600">
          Something went wrong!
        </Typography>
        
        <Typography variant="body1" className="text-gray-600 mb-8">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </Typography>
        
        <Box className="space-x-4">
          <Button
            variant="contained"
            onClick={reset}
            className="bg-red-600 hover:bg-red-700"
          >
            Try again
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => window.location.href = '/'}
          >
            Go home
          </Button>
        </Box>
        
        {process.env.NODE_ENV === 'development' && (
          <Box className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
            <Typography variant="caption" className="font-mono">
              {error.message}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  )
}