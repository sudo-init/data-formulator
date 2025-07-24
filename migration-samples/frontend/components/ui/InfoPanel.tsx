'use client'

/**
 * InfoPanel component - Help and information panel
 * Migrated from original InfoPanel.tsx to Next.js with Tailwind
 */

import React, { useState, useCallback } from 'react'
import { useAppSelector } from '@/lib/store/hooks'

// MUI components during migration
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon,
  Code as CodeIcon,
  DataUsage as DataIcon,
  Timeline as ChartIcon,
  Close as CloseIcon,
} from '@mui/icons-material'

interface InfoPanelProps {
  className?: string
  onClose?: () => void
}

interface InfoSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
}

// Info Section Component
const InfoSection: React.FC<InfoSectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultExpanded = false 
}) => {
  return (
    <Accordion defaultExpanded={defaultExpanded} className="shadow-none border border-gray-200">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box className="flex items-center space-x-2">
          {icon}
          <Typography variant="subtitle2" className="font-semibold">
            {title}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails className="pt-0">
        {children}
      </AccordionDetails>
    </Accordion>
  )
}

// Getting Started Section
const GettingStartedSection: React.FC = () => {
  const steps = [
    {
      title: 'Upload Your Data',
      description: 'Import CSV files, paste data, or connect to external sources',
      icon: <DataIcon className="text-blue-600" />,
    },
    {
      title: 'Explore Fields',
      description: 'Browse your data fields in the Concept Shelf on the left',
      icon: <HelpIcon className="text-green-600" />,
    },
    {
      title: 'Create Visualizations',
      description: 'Drag fields to chart properties or use natural language descriptions',
      icon: <ChartIcon className="text-purple-600" />,
    },
    {
      title: 'Ask Questions',
      description: 'Use the Data Threads panel to have AI analyze your data',
      icon: <TipIcon className="text-orange-600" />,
    },
  ]

  return (
    <List className="py-0">
      {steps.map((step, index) => (
        <ListItem key={index} className="px-0 py-2">
          <ListItemIcon className="min-w-0 mr-3">
            <Box className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </Box>
          </ListItemIcon>
          <ListItemText
            primary={
              <Box className="flex items-center space-x-2">
                {step.icon}
                <Typography variant="body2" className="font-medium">
                  {step.title}
                </Typography>
              </Box>
            }
            secondary={
              <Typography variant="caption" className="text-gray-600">
                {step.description}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  )
}

// Tips Section
const TipsSection: React.FC = () => {
  const tips = [
    'Type field names that don\'t exist to trigger AI-powered data transformations',
    'Use natural language like "show top 5 countries by population" in Data Threads',
    'Drag fields between chart properties to quickly change visualizations',
    'Use the chart recommendations to discover interesting patterns in your data',
    'Save your session to preserve your analysis progress',
  ]

  return (
    <Box className="space-y-2">
      {tips.map((tip, index) => (
        <Box key={index} className="flex items-start space-x-2">
          <TipIcon className="text-yellow-500 mt-0.5" fontSize="small" />
          <Typography variant="body2" className="text-gray-700">
            {tip}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

// Chart Types Section
const ChartTypesSection: React.FC = () => {
  const chartTypes = [
    { name: 'Bar Chart', use: 'Compare categories', example: 'Population by country' },
    { name: 'Line Chart', use: 'Show trends over time', example: 'Temperature over months' },
    { name: 'Scatter Plot', use: 'Explore relationships', example: 'Height vs weight' },
    { name: 'Histogram', use: 'Show distributions', example: 'Age distribution' },
    { name: 'Heatmap', use: 'Show correlations', example: 'Sales by region and time' },
    { name: 'Area Chart', use: 'Show quantities over time', example: 'Cumulative sales' },
  ]

  return (
    <Box className="space-y-3">
      {chartTypes.map((chart, index) => (
        <Box key={index} className="p-3 bg-gray-50 rounded-lg">
          <Typography variant="subtitle2" className="font-medium mb-1">
            {chart.name}
          </Typography>
          <Typography variant="body2" className="text-gray-700 mb-1">
            {chart.use}
          </Typography>
          <Typography variant="caption" className="text-gray-600 italic">
            Example: {chart.example}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

// AI Features Section
const AIFeaturesSection: React.FC = () => {
  const features = [
    {
      name: 'Data Transformation',
      description: 'Create new fields using natural language descriptions',
      example: 'Type "population_density" to calculate population per area',
    },
    {
      name: 'Chart Recommendations',
      description: 'Get AI-suggested visualizations based on your data',
      example: 'AI analyzes data types and suggests appropriate charts',
    },
    {
      name: 'Natural Language Queries',
      description: 'Ask questions about your data in plain English',
      example: '"What are the top 5 countries with highest GDP growth?"',
    },
    {
      name: 'Code Generation',
      description: 'AI generates Python/SQL code for complex transformations',
      example: 'Automatic pivot tables, aggregations, and calculations',
    },
  ]

  return (
    <Box className="space-y-3">
      {features.map((feature, index) => (
        <Box key={index}>
          <Box className="flex items-center space-x-2 mb-1">
            <CodeIcon className="text-blue-600" fontSize="small" />
            <Typography variant="subtitle2" className="font-medium">
              {feature.name}
            </Typography>
          </Box>
          <Typography variant="body2" className="text-gray-700 mb-1">
            {feature.description}
          </Typography>
          <Typography variant="caption" className="text-gray-600 italic bg-blue-50 px-2 py-1 rounded">
            {feature.example}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

// Keyboard Shortcuts Section
const ShortcutsSection: React.FC = () => {
  const shortcuts = [
    { key: 'Ctrl/Cmd + Enter', action: 'Send message in Data Thread' },
    { key: 'Ctrl/Cmd + K', action: 'Focus on search/input fields' },
    { key: 'Escape', action: 'Close dialogs and cancel operations' },
    { key: 'Ctrl/Cmd + S', action: 'Save current session' },
    { key: 'Ctrl/Cmd + Z', action: 'Undo last action' },
  ]

  return (
    <Box className="space-y-2">
      {shortcuts.map((shortcut, index) => (
        <Box key={index} className="flex items-center justify-between">
          <Typography variant="body2" className="text-gray-700">
            {shortcut.action}
          </Typography>
          <Chip
            label={shortcut.key}
            size="small"
            variant="outlined"
            className="font-mono text-xs"
          />
        </Box>
      ))}
    </Box>
  )
}

// Main InfoPanel Component
export function InfoPanel({ className = '', onClose }: InfoPanelProps) {
  const [activeSection, setActiveSection] = useState<string | null>('getting-started')
  const sessionId = useAppSelector((state) => state.dataFormulator.sessionId)
  const tables = useAppSelector((state) => state.dataFormulator.tables)
  
  const tableCount = Object.keys(tables).length
  const totalRows = Object.values(tables).reduce((sum, table) => sum + table.length, 0)

  return (
    <Card className={`info-panel ${className}`}>
      <CardContent className="p-4">
        {/* Header */}
        <Box className="flex items-center justify-between mb-4">
          <Box className="flex items-center space-x-2">
            <InfoIcon className="text-blue-600" />
            <Typography variant="h6" className="font-semibold">
              Help & Information
            </Typography>
          </Box>
          
          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {/* Session info */}
        {sessionId && (
          <Box className="mb-4 p-3 bg-blue-50 rounded-lg">
            <Typography variant="subtitle2" className="font-medium mb-1">
              Current Session
            </Typography>
            <Box className="flex items-center space-x-4 text-sm text-gray-600">
              <span>ID: {sessionId.substring(0, 8)}...</span>
              <span>Tables: {tableCount}</span>
              <span>Rows: {totalRows.toLocaleString()}</span>
            </Box>
          </Box>
        )}

        {/* Information sections */}
        <Box className="space-y-2">
          <InfoSection
            title="Getting Started"
            icon={<HelpIcon className="text-blue-600" />}
            defaultExpanded={true}
          >
            <GettingStartedSection />
          </InfoSection>

          <InfoSection
            title="AI Features"
            icon={<CodeIcon className="text-purple-600" />}
          >
            <AIFeaturesSection />
          </InfoSection>

          <InfoSection
            title="Chart Types"
            icon={<ChartIcon className="text-green-600" />}
          >
            <ChartTypesSection />
          </InfoSection>

          <InfoSection
            title="Tips & Tricks"
            icon={<TipIcon className="text-orange-600" />}
          >
            <TipsSection />
          </InfoSection>

          <InfoSection
            title="Keyboard Shortcuts"
            icon={<HelpIcon className="text-gray-600" />}
          >
            <ShortcutsSection />
          </InfoSection>
        </Box>

        {/* Footer links */}
        <Divider className="my-4" />
        
        <Box className="text-center space-y-2">
          <Typography variant="caption" className="text-gray-600 block">
            Data Formulator v2.0 - AI-Powered Data Visualization
          </Typography>
          
          <Box className="flex justify-center space-x-4">
            <Button
              size="small"
              variant="text"
              onClick={() => window.open('https://github.com/microsoft/data-formulator', '_blank')}
            >
              GitHub
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => window.open('https://arxiv.org/abs/2408.16119', '_blank')}
            >
              Paper
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => window.open('https://youtu.be/3ndlwt0Wi3c', '_blank')}
            >
              Video
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}