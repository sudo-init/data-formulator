/**
 * Redux Store Configuration for Data Formulator
 * Migrated from original store.ts to Next.js with SSR compatibility
 */

import { configureStore } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import { dataFormulatorReducer } from './slices/dataFormulatorSlice'

// Import storage with SSR compatibility
let storage: any = undefined

if (typeof window !== 'undefined') {
  // Client-side: use localforage for better performance
  try {
    const localforage = require('localforage')
    storage = localforage
  } catch (e) {
    // Fallback to localStorage if localforage is not available
    storage = {
      getItem: (key: string) => {
        return new Promise((resolve) => {
          resolve(localStorage.getItem(key))
        })
      },
      setItem: (key: string, value: string) => {
        return new Promise((resolve) => {
          localStorage.setItem(key, value)
          resolve(value)
        })
      },
      removeItem: (key: string) => {
        return new Promise<void>((resolve) => {
          localStorage.removeItem(key)
          resolve()
        })
      }
    }
  }
} else {
  // Server-side: use noop storage
  storage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(undefined),
    removeItem: () => Promise.resolve(undefined)
  }
}

const persistConfig = {
  key: 'data-formulator-root',
  storage,
  // Blacklist certain fields that shouldn't be persisted
  blacklist: ['pendingSSEActions', 'chartSynthesisInProgress'],
  // Version for handling migrations
  version: 1,
  migrate: (state: any) => {
    // Handle any necessary data migrations here
    return Promise.resolve(state)
  }
}

const persistedReducer = persistReducer(persistConfig, dataFormulatorReducer)

export const store = configureStore({
  reducer: {
    dataFormulator: persistedReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
        ignoredPaths: ['dataFormulator._persist']
      },
      thunk: {
        extraArgument: {
          // Add any extra services here (e.g., API client)
        }
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export helper for server-side rendering
export const createStore = () => {
  return configureStore({
    reducer: {
      dataFormulator: dataFormulatorReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: true
      }),
    devTools: false
  })
}

export default store