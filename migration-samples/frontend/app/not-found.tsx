import Link from 'next/link'
import { Box, Typography, Button, Container } from '@mui/material'

export default function NotFound() {
  return (
    <Container maxWidth="sm" className="min-h-screen flex items-center justify-center">
      <Box className="text-center">
        <Typography variant="h1" className="text-6xl font-bold text-gray-300 mb-4">
          404
        </Typography>
        
        <Typography variant="h4" className="mb-4">
          Page Not Found
        </Typography>
        
        <Typography variant="body1" className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        
        <Link href="/">
          <Button variant="contained" size="large">
            Return Home
          </Button>
        </Link>
      </Box>
    </Container>
  )
}