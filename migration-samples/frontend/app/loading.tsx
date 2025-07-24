import { Box, CircularProgress, Typography } from '@mui/material'

export default function Loading() {
  return (
    <Box className="min-h-screen flex items-center justify-center">
      <Box className="text-center">
        <CircularProgress size={48} className="mb-4" />
        <Typography variant="h6" className="text-gray-600">
          Loading Data Formulator...
        </Typography>
      </Box>
    </Box>
  )
}