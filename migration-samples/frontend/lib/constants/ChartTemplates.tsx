'use client'

/**
 * Chart Templates - Complete chart template definitions for Data Formulator
 * Migrated from original ChartTemplates.tsx to Next.js with static image imports
 */

import React from 'react'
import { ChartTemplate } from '@/lib/types/componentTypes'
import { InsightsIcon } from '@mui/icons-material'

// Chart type utility functions
export function getChartTemplate(chartType: string): ChartTemplate | undefined {
  return Object.values(CHART_TEMPLATES).flat().find(t => t.chart === chartType)
}

export const getChartChannels = (chartType: string) => {
  return getChartTemplate(chartType)?.channels || []
}

// Channel definitions
export const CHANNEL_LIST = [
  'x', 'x2', 'y', 'y2', 'id', 'color', 'opacity', 'size', 'shape', 'column', 
  'row', 'latitude', 'longitude', 'theta', 'radius', 'detail', 'group',
  'field 1', 'field 2', 'field 3', 'field 4', 'field 5', 'field 6'
] as const

export const ChannelGroups = {
  '': ['x', 'y', 'x2', 'y2', 'latitude', 'longitude', 'id', 'radius', 'theta', 'detail'],
  'legends': ['color', 'group', 'size', 'shape', 'text', 'opacity'],
  'facets': ['column', 'row'],
  'data fields': ['field 1', 'field 2', 'field 3', 'field 4', 'field 5', 'field 6']
}

// Chart template definitions
const tablePlots: ChartTemplate[] = [
  {
    chart: 'Auto',
    icon: <InsightsIcon color="primary" />,
    template: {},
    channels: [],
    paths: {}
  },
  {
    chart: 'Table',
    icon: '/assets/chart-icon-table.png',
    template: {},
    channels: [],
    paths: {}
  }
]

const scatterPlots: ChartTemplate[] = [
  {
    chart: 'Scatter Plot',
    icon: '/assets/chart-icon-scatter.png',
    template: {
      mark: 'circle',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'size', 'column', 'row'],
    paths: {
      x: ['encoding', 'x'],
      y: ['encoding', 'y'],
      color: ['encoding', 'color'],
      size: ['encoding', 'size'],
      column: ['encoding', 'column'],
      row: ['encoding', 'row']
    }
  },
  {
    chart: 'Linear Regression',
    icon: '/assets/chart-icon-linear-regression.png',
    template: {
      layer: [
        {
          mark: 'circle',
          encoding: { x: {}, y: {}, color: {}, size: {} }
        },
        {
          mark: {
            type: 'line',
            color: 'red'
          },
          transform: [
            {
              regression: 'field1',
              on: 'field2',
              group: 'field3'
            }
          ],
          encoding: {
            x: {},
            y: {}
          }
        }
      ]
    },
    channels: ['x', 'y', 'size', 'color', 'column'],
    paths: {
      x: [['layer', 0, 'encoding', 'x'], ['layer', 1, 'encoding', 'x'], ['layer', 1, 'transform', 0, 'on']],
      y: [['layer', 0, 'encoding', 'y'], ['layer', 1, 'encoding', 'y'], ['layer', 1, 'transform', 0, 'regression']],
      color: ['layer', 0, 'encoding', 'color'],
      size: ['layer', 0, 'encoding', 'size']
    }
  },
  {
    chart: 'Ranged Dot Plot',
    icon: '/assets/chart-icon-dot-plot-horizontal.png',
    template: {
      encoding: {},
      layer: [
        {
          mark: 'line',
          encoding: {
            detail: {}
          }
        },
        {
          mark: {
            type: 'point',
            filled: true
          },
          encoding: {
            color: {}
          }
        }
      ]
    },
    channels: ['x', 'y', 'color'],
    paths: {
      x: ['encoding', 'x'],
      y: ['encoding', 'y'],
      color: ['layer', 1, 'encoding', 'color']
    },
    postProcessor: (vgSpec: any, table: any[]) => {
      if (vgSpec.encoding.y?.type === 'nominal') {
        vgSpec.layer[0].encoding.detail = JSON.parse(JSON.stringify(vgSpec.encoding.y))
      } else if (vgSpec.encoding.x?.type === 'nominal') {
        vgSpec.layer[0].encoding.detail = JSON.parse(JSON.stringify(vgSpec.encoding.x))
      }
      return vgSpec
    }
  },
  {
    chart: 'Boxplot',
    icon: '/assets/chart-icon-box-plot.png',
    template: {
      mark: 'boxplot',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'opacity', 'column', 'row'],
    paths: Object.fromEntries(
      ['x', 'y', 'color', 'opacity', 'column', 'row'].map(channel => [channel, ['encoding', channel]])
    ),
    postProcessor: (vgSpec: any, table: any[]) => {
      if (vgSpec.encoding.x && vgSpec.encoding.x.type !== 'nominal') {
        vgSpec.encoding.x.type = 'nominal'
      }
      return vgSpec
    }
  }
]

const barCharts: ChartTemplate[] = [
  {
    chart: 'Bar Chart',
    icon: '/assets/chart-icon-column.png',
    template: {
      mark: 'bar',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'column', 'row'],
    paths: {
      x: ['encoding', 'x'],
      y: ['encoding', 'y'],
      color: ['encoding', 'color'],
      column: ['encoding', 'column'],
      row: ['encoding', 'row']
    }
  },
  {
    chart: 'Pyramid Chart',
    icon: '/assets/chart-icon-column.png',
    template: {
      spacing: 0,
      resolve: { scale: { y: 'shared' } },
      hconcat: [
        {
          mark: 'bar',
          encoding: {
            y: {},
            x: { scale: { reverse: true }, stack: null },
            color: { legend: null },
            opacity: { value: 0.9 }
          }
        },
        {
          mark: 'bar',
          encoding: {
            y: { axis: null },
            x: { stack: null },
            color: { legend: null },
            opacity: { value: 0.9 }
          }
        }
      ],
      config: {
        view: { stroke: null },
        axis: { grid: false }
      }
    },
    channels: ['x', 'y', 'color'],
    paths: {
      x: [['hconcat', 0, 'encoding', 'x'], ['hconcat', 1, 'encoding', 'x']],
      y: [['hconcat', 0, 'encoding', 'y'], ['hconcat', 1, 'encoding', 'y']],
      color: [['hconcat', 0, 'encoding', 'color'], ['hconcat', 1, 'encoding', 'color']]
    },
    postProcessor: (vgSpec: any, table: any[]) => {
      try {
        if (table) {
          const colorField = vgSpec.hconcat[0].encoding.color.field
          const colorValues = [...new Set(table.map(r => r[colorField]))]
          vgSpec.hconcat[0].transform = [{ filter: `datum["${colorField}"] == "${colorValues[0]}"` }]
          vgSpec.hconcat[0].title = colorValues[0]
          vgSpec.hconcat[1].transform = [{ filter: `datum["${colorField}"] == "${colorValues[1]}"` }]
          vgSpec.hconcat[1].title = colorValues[1]
          const xField = vgSpec.hconcat[0].encoding.x.field
          const xValues = [...new Set(table
            .filter(r => r[colorField] === colorValues[0] || r[colorField] === colorValues[1])
            .map(r => r[xField]))]
          const domain = [Math.min(...xValues, 0), Math.max(...xValues)]
          vgSpec.hconcat[0].encoding.x.scale.domain = domain
          vgSpec.hconcat[1].encoding.x.scale = { domain }
        }
      } catch (error) {
        console.warn('Pyramid chart post-processor error:', error)
      }
      return vgSpec
    }
  },
  {
    chart: 'Grouped Bar Chart',
    icon: '/assets/chart-icon-column-grouped.png',
    template: {
      mark: 'bar',
      encoding: {}
    },
    channels: ['x', 'y', 'group'],
    paths: {
      x: ['encoding', 'x'],
      y: ['encoding', 'y'],
      group: [['encoding', 'xOffset'], ['encoding', 'color']]
    }
  },
  {
    chart: 'Stacked Bar Chart',
    icon: '/assets/chart-icon-column-stacked.png',
    template: {
      mark: 'bar',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'column', 'row'],
    paths: {
      x: ['encoding', 'x'],
      y: ['encoding', 'y'],
      color: ['encoding', 'color'],
      column: ['encoding', 'column'],
      row: ['encoding', 'row']
    }
  },
  {
    chart: 'Histogram',
    icon: '/assets/chart-icon-histogram.png',
    template: {
      mark: 'bar',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'column', 'row'],
    paths: {
      x: ['encoding', 'x'],
      y: ['encoding', 'y'],
      color: ['encoding', 'color'],
      column: ['encoding', 'column'],
      row: ['encoding', 'row']
    }
  }
]

const lineCharts: ChartTemplate[] = [
  {
    chart: 'Line Chart',
    icon: '/assets/chart-icon-line.png',
    template: {
      mark: 'line',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'column', 'row'],
    paths: {
      x: ['encoding', 'x'],
      y: ['encoding', 'y'],
      color: ['encoding', 'color'],
      column: ['encoding', 'column'],
      row: ['encoding', 'row']
    }
  },
  {
    chart: 'Dotted Line Chart',
    icon: '/assets/chart-icon-dotted-line.png',
    template: {
      mark: { type: 'line', point: true },
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'column', 'row'],
    paths: {
      x: ['encoding', 'x'],
      y: ['encoding', 'y'],
      color: ['encoding', 'color'],
      column: ['encoding', 'column'],
      row: ['encoding', 'row']
    }
  }
]

const customCharts: ChartTemplate[] = [
  {
    chart: 'Custom Point',
    icon: '/assets/chart-icon-custom-point.png',
    template: {
      mark: 'circle',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'opacity', 'size', 'shape', 'column', 'row'],
    paths: Object.fromEntries(
      ['x', 'y', 'color', 'opacity', 'size', 'shape', 'column', 'row'].map(
        channel => [channel, ['encoding', channel]]
      )
    )
  },
  {
    chart: 'Custom Line',
    icon: '/assets/chart-icon-custom-line.png',
    template: {
      mark: 'line',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'opacity', 'detail', 'column', 'row'],
    paths: Object.fromEntries([
      ...['x', 'y', 'color', 'opacity', 'column', 'row'].map(
        channel => [channel, ['encoding', channel]]
      ),
      ['detail', ['encoding', 'detail']]
    ])
  },
  {
    chart: 'Custom Bar',
    icon: '/assets/chart-icon-custom-bar.png',
    template: {
      mark: 'bar',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'opacity', 'size', 'shape', 'column', 'row'],
    paths: Object.fromEntries(
      ['x', 'y', 'color', 'opacity', 'size', 'shape', 'column', 'row'].map(
        channel => [channel, ['encoding', channel]]
      )
    )
  },
  {
    chart: 'Custom Rect',
    icon: '/assets/chart-icon-custom-rect.png',
    template: {
      mark: 'rect',
      encoding: {}
    },
    channels: ['x', 'y', 'x2', 'y2', 'color', 'opacity', 'column', 'row'],
    paths: Object.fromEntries(
      ['x', 'y', 'x2', 'y2', 'color', 'opacity', 'column', 'row'].map(
        channel => [channel, ['encoding', channel]]
      )
    )
  },
  {
    chart: 'Custom Area',
    icon: '/assets/chart-icon-custom-area.png',
    template: {
      mark: 'area',
      encoding: {}
    },
    channels: ['x', 'y', 'x2', 'y2', 'color', 'column', 'row'],
    paths: Object.fromEntries(
      ['x', 'y', 'x2', 'y2', 'color', 'column', 'row'].map(
        channel => [channel, ['encoding', channel]]
      )
    )
  }
]

const tableCharts: ChartTemplate[] = [
  {
    chart: 'Heat Map',
    icon: '/assets/chart-icon-heat-map.png',
    template: {
      mark: 'rect',
      encoding: {}
    },
    channels: ['x', 'y', 'color', 'column', 'row'],
    paths: Object.fromEntries(
      ['x', 'y', 'color', 'column', 'row'].map(
        channel => [channel, ['encoding', channel]]
      )
    ),
    postProcessor: (vgSpec: any, table: any[]) => {
      if (vgSpec.encoding.y && vgSpec.encoding.y.type !== 'nominal') {
        vgSpec.encoding.y.type = 'nominal'
      }
      if (vgSpec.encoding.x && vgSpec.encoding.x.type !== 'nominal') {
        vgSpec.encoding.x.type = 'nominal'
      }
      return vgSpec
    }
  }
]

// Main chart templates export
export const CHART_TEMPLATES: { [key: string]: ChartTemplate[] } = {
  table: tablePlots,
  scatter: scatterPlots,
  bar: barCharts,
  line: lineCharts,
  'table-based': tableCharts,
  custom: customCharts
}

// Utility functions for chart template management
export const getAllChartTypes = (): string[] => {
  return Object.values(CHART_TEMPLATES)
    .flat()
    .map(template => template.chart)
}

export const getChartTemplatesByCategory = (category: string): ChartTemplate[] => {
  return CHART_TEMPLATES[category] || []
}

export const getChartTemplateIcon = (chartType: string): any => {
  const template = getChartTemplate(chartType)
  return template?.icon || '/chart-icons/default.png'
}

export const validateChartTemplate = (template: ChartTemplate): boolean => {
  return !!(
    template.chart &&
    template.template &&
    template.channels &&
    template.paths
  )
}

export default CHART_TEMPLATES