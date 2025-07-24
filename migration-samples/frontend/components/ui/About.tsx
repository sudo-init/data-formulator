'use client'

/**
 * About component - About page for Data Formulator
 * Migrated from original About.tsx to Next.js with Tailwind
 */

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

// MUI components during migration
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Divider,
} from '@mui/material'
import {
  GitHub as GitHubIcon,
  Article as PaperIcon,
  PlayArrow as VideoIcon,
  Star as StarIcon,
} from '@mui/icons-material'

interface AboutProps {
  className?: string
}

const TOOL_NAME = 'Data Formulator'

export function About({ className = '' }: AboutProps) {
  
  const features = [
    {
      title: 'AI-Powered Visualization',
      description: 'Create rich visualizations using natural language descriptions combined with drag-and-drop interfaces.'
    },
    {
      title: 'Data Transformation',
      description: 'Transform and derive new data fields using AI agents that understand your intent and data context.'
    },
    {
      title: 'Interactive Exploration',
      description: 'Explore visualizations beyond your initial dataset with intelligent recommendations and insights.'
    },
    {
      title: 'Multi-Modal Interface',
      description: 'Seamlessly switch between GUI interactions and natural language commands for maximum flexibility.'
    }
  ]

  const links = [
    {
      title: 'GitHub Repository',
      description: 'View source code and contribute',
      url: 'https://github.com/microsoft/data-formulator',
      icon: <GitHubIcon />,
      color: 'text-gray-700'
    },
    {
      title: 'Research Paper',
      description: 'Read the academic paper',
      url: 'https://arxiv.org/abs/2408.16119',
      icon: <PaperIcon />,
      color: 'text-blue-600'
    },
    {
      title: 'Demo Video',
      description: 'Watch the demonstration',
      url: 'https://youtu.be/3ndlwt0Wi3c',
      icon: <VideoIcon />,
      color: 'text-red-600'
    }
  ]

  return (
    <Container maxWidth="lg" className={`py-8 ${className}`}>
      <Box className="flex flex-col items-center text-center space-y-8">
        
        {/* Header */}
        <Box className="flex items-end justify-center space-x-4">
          <Box className="relative w-16 h-16">
            <Image
              src="/assets/df-logo.png"
              alt="Data Formulator Logo"
              fill
              className="object-contain"
              onError={(e) => {
                // Fallback if logo doesn't exist
                const target = e.target as HTMLImageElement
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzE5NzZkMiIvPgo8dGV4dCB4PSIzMiIgeT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+REY8L3RleHQ+Cjwvc3ZnPgo='
              }}
            />
          </Box>
          <Typography variant="h2" className="font-bold text-gray-800">
            {TOOL_NAME}
          </Typography>
        </Box>

        {/* Action Button */}
        <Link href="/" passHref>
          <Button 
            variant="contained" 
            size="large"
            className="px-8 py-3 text-lg"
          >
            Use {TOOL_NAME}
          </Button>
        </Link>

        {/* Description */}
        <Box className="max-w-4xl text-left space-y-4">
          <Typography variant="h6" className="text-gray-700 leading-relaxed">
            {TOOL_NAME} lets you create and iterate between rich visualizations using combined user interface and natural language descriptions.
          </Typography>
          <Typography variant="h6" className="text-gray-700 leading-relaxed">
            The AI agent in {TOOL_NAME} helps you explore visualizations{' '}
            <em className="font-semibold text-blue-600">beyond your initial dataset</em>.
          </Typography>
        </Box>

        {/* Screenshot */}
        <Box className="relative w-full max-w-4xl h-96 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
          <Image
            src="/data-formulator-screenshot.png"
            alt="Data Formulator Screenshot"
            fill
            className="object-cover"
            onError={(e) => {
              // Fallback placeholder
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDgwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjQwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNmI3MjgwIiBmb250LXNpemU9IjE4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+RGF0YSBGb3JtdWxhdG9yIFNjcmVlbnNob3Q8L3RleHQ+Cjwvc3ZnPgo='
            }}
          />
        </Box>

        <Divider className="w-full my-8" />

        {/* Features */}
        <Box className="w-full">
          <Typography variant="h4" className="text-center mb-8 font-semibold">
            Key Features
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <Typography variant="h6" className="font-semibold mb-3 text-gray-800">
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider className="w-full my-8" />

        {/* Links */}
        <Box className="w-full">
          <Typography variant="h4" className="text-center mb-8 font-semibold">
            Learn More
          </Typography>
          
          <Grid container spacing={4} justifyContent="center">
            {links.map((link, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent 
                    className="p-6 text-center"
                    onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                  >
                    <Box className={`mb-4 ${link.color}`}>
                      {React.cloneElement(link.icon, { fontSize: 'large' })}
                    </Box>
                    <Typography variant="h6" className="font-semibold mb-2 text-gray-800">
                      {link.title}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      {link.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Footer */}
        <Box className="text-center space-y-4 pt-8">
          <Typography variant="body2" className="text-gray-500">
            {TOOL_NAME} v2.0 - AI-Powered Data Visualization
          </Typography>
          
          <Box className="flex items-center justify-center space-x-4">
            <Typography variant="body2" className="text-gray-500">
              Built with ❤️ by Microsoft Research
            </Typography>
            <Box className="flex items-center space-x-1">
              <StarIcon className="text-yellow-500" fontSize="small" />
              <Typography variant="body2" className="text-gray-500">
                Open Source
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="caption" className="text-gray-400 block">
            Copyright © Microsoft Corporation. Licensed under the MIT License.
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default About