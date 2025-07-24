'use client'

/**
 * OperatorCard component - Draggable aggregation operator cards
 * Migrated from original OperatorCard.tsx to Next.js with Tailwind
 */

import React from 'react'
import { useDrag } from 'react-dnd'

// MUI components during migration
import {
  Card,
  Box,
  Typography,
} from '@mui/material'

export interface OperatorCardProps {
  operator: string
  className?: string
}

export function OperatorCard({ operator, className = '' }: OperatorCardProps) {
  // Drag functionality
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "operator-card",
    item: { type: 'operator-card', operator, source: "conceptShelf" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }))

  const opacity = isDragging ? 0.4 : 1
  const cursorStyle = isDragging ? "grabbing" : "grab"

  return (
    <Card
      ref={drag}
      className={`
        operator-card min-w-20 w-full max-w-32 
        bg-orange-100 border-orange-300 border-2
        hover:shadow-md transition-all duration-200
        ${className}
      `}
      style={{ 
        opacity, 
        cursor: cursorStyle, 
        marginLeft: '3px' 
      }}
    >
      <Box className="p-2">
        <Typography 
          className="text-sm italic text-center font-medium text-gray-800"
          component="span"
        >
          {operator.toUpperCase()}
        </Typography>
      </Box>
    </Card>
  )
}

// Predefined operator cards for common aggregations
export const AGGREGATION_OPERATORS = [
  'count',
  'sum', 
  'mean',
  'median',
  'min',
  'max',
  'distinct'
] as const

export type AggregationOperator = typeof AGGREGATION_OPERATORS[number]

// Operator Cards Collection Component
export function OperatorCardsCollection({ 
  operators = AGGREGATION_OPERATORS,
  className = '' 
}: {
  operators?: readonly string[]
  className?: string
}) {
  return (
    <Box className={`operator-cards-collection ${className}`}>
      <Typography variant="caption" className="block mb-2 text-gray-600 font-medium">
        Aggregation Functions
      </Typography>
      
      <Box className="grid grid-cols-2 gap-2">
        {operators.map((operator) => (
          <OperatorCard
            key={operator}
            operator={operator}
          />
        ))}
      </Box>
      
      <Typography variant="caption" className="block mt-2 text-gray-500 text-xs">
        💡 Drag these operators to encoding channels that support aggregation (like Y-axis)
      </Typography>
    </Box>
  )
}