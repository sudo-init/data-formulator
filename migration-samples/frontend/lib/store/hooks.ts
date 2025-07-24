/**
 * Redux Typed Hooks for Data Formulator
 * Migrated from original store hooks to Next.js with proper typing
 */

import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Convenience hooks for common data formulator state
export const useDataFormulatorState = () => useAppSelector((state) => state.dataFormulator)

export const useTables = () => useAppSelector((state) => state.dataFormulator.tables)
export const useCharts = () => useAppSelector((state) => state.dataFormulator.charts)
export const useConceptShelfItems = () => useAppSelector((state) => state.dataFormulator.conceptShelfItems)
export const useMessages = () => useAppSelector((state) => state.dataFormulator.messages)
export const useSessionId = () => useAppSelector((state) => state.dataFormulator.sessionId)
export const useConfig = () => useAppSelector((state) => state.dataFormulator.config)
export const useVisViewMode = () => useAppSelector((state) => state.dataFormulator.visViewMode)

export const useFocusedTable = () => {
  return useAppSelector((state) => {
    const focusedTableId = state.dataFormulator.focusedTableId
    return state.dataFormulator.tables.find((t) => t.id === focusedTableId)
  })
}

export const useFocusedChart = () => {
  return useAppSelector((state) => {
    const focusedChartId = state.dataFormulator.focusedChartId
    return state.dataFormulator.charts.find((c) => c.id === focusedChartId)
  })
}

export const useActiveModel = () => {
  return useAppSelector((state) => {
    const generationModelId = state.dataFormulator.modelSlots.generation
    return state.dataFormulator.models.find((m) => m.id === generationModelId)
  })
}

export const useModels = () => useAppSelector((state) => state.dataFormulator.models)
export const useModelSlots = () => useAppSelector((state) => state.dataFormulator.modelSlots)
export const useTestedModels = () => useAppSelector((state) => state.dataFormulator.testedModels)