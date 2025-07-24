/**
 * Redux store configuration for Next.js
 * Migrated from React/Vite Redux setup
 */

import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { WebStorage } from 'redux-persist/lib/types'

// Create a safe storage for SSR compatibility
const createNoopStorage = (): WebStorage => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null)
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value)
    },
    removeItem(_key: string) {
      return Promise.resolve()
    },
  }
}

// Use different storage based on environment
const storageInstance = typeof window !== 'undefined' ? storage : createNoopStorage()
import { combineReducers } from '@reduxjs/toolkit'

import dataFormulatorSlice from './slices/dataFormulatorSlice'

// Redux persist configuration
const persistConfig = {
  key: 'data-formulator',
  storage: storageInstance,
  whitelist: ['dataFormulator'], // Only persist the dataFormulator slice
}

// Combine reducers
const rootReducer = combineReducers({
  dataFormulator: dataFormulatorSlice,
})

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

// Create persistor
export const persistor = persistStore(store)

// Infer types from store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks for components
export { useAppDispatch, useAppSelector } from './hooks'