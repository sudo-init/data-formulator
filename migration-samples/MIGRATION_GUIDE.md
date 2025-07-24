# Data Formulator Migration Guide: Flask/React → FastAPI/Next.js

## Overview

This guide provides detailed instructions for migrating Data Formulator from Flask/React/Vite to FastAPI/Next.js with Tailwind CSS.

## Key Migration Considerations

### 1. SSR Compatibility Issues & Solutions

#### AG Grid with Next.js
```typescript
// Problem: AG Grid expects browser environment
// Solution: Use dynamic imports with SSR disabled

import dynamic from 'next/dynamic'

const AgGridReact = dynamic(
  () => import('ag-grid-react').then(mod => mod.AgGridReact),
  { 
    ssr: false,
    loading: () => <div>Loading grid...</div>
  }
)
```

#### Vega-Lite Chart Rendering
```typescript
// Problem: Vega-Lite uses browser-specific APIs
// Solution: Dynamic import with loading state

const VegaLite = dynamic(
  () => import('react-vega').then((mod) => mod.VegaLite),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg h-64">
        Loading chart...
      </div>
    )
  }
)
```

#### React DnD Configuration
```typescript
// app/providers.tsx
'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

export function Providers({ children }) {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  )
}
```

### 2. MUI to Tailwind CSS Migration Strategy

#### Phase 1: Coexistence Setup
```css
/* globals.css - Maintain MUI compatibility */
.MuiButton-root {
  @apply transition-all duration-200;
}

.MuiPaper-root {
  @apply shadow-sm;
}
```

#### Phase 2: Component-by-Component Migration
```typescript
// Before (MUI)
<Button 
  variant="contained" 
  color="primary"
  startIcon={<SaveIcon />}
>
  Save Chart
</Button>

// After (Tailwind + Custom Component)
<button className="btn-primary inline-flex items-center">
  <SaveIcon className="mr-2" />
  Save Chart
</button>
```

#### Phase 3: Custom Component Library
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors'
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50'
  }
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

### 3. FastAPI Backend Migration Patterns

#### Flask Blueprint → FastAPI Router
```python
# Before (Flask)
from flask import Blueprint, request, jsonify

agent_bp = Blueprint('agent', __name__)

@agent_bp.route('/api/agent/run', methods=['POST'])
def run_agent():
    data = request.get_json()
    # Process request
    return jsonify(result)

# After (FastAPI)
from fastapi import APIRouter, Depends
from app.models.agent import AgentRunRequest, AgentResponse

router = APIRouter()

@router.post("/agents/run", response_model=AgentResponse)
async def run_agent(
    request: AgentRunRequest,
    agent_service: AgentService = Depends(get_agent_service)
) -> AgentResponse:
    return await agent_service.run_agent(request)
```

#### Environment Configuration Migration
```python
# Before (Flask)
import os
from dotenv import load_dotenv

load_dotenv('api-keys.env')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# After (FastAPI with Pydantic)
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    class Config:
        env_file = "api-keys.env"

settings = Settings()
```

#### Async Agent Execution
```python
# FastAPI async wrapper for existing sync agents
import asyncio
from concurrent.futures import ThreadPoolExecutor

class AgentService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def run_agent(self, request: AgentRunRequest) -> AgentResponse:
        loop = asyncio.get_event_loop()
        
        # Run sync agent in thread pool
        result = await loop.run_in_executor(
            self.executor,
            self._run_agent_sync,
            request
        )
        
        return result
    
    def _run_agent_sync(self, request: AgentRunRequest) -> AgentResponse:
        # Existing agent logic remains the same
        agent = self.get_agent(request.agent_type)
        return agent.run(request.prompt, request.data)
```

### 4. API Communication Patterns

#### Type-Safe API Client
```typescript
// lib/api/client.ts
export class APIClient {
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new APIError(`HTTP ${response.status}`, response.status)
    }
    
    return response.json()
  }
}
```

#### React Hook Integration
```typescript
// hooks/useAgent.ts
import { useState, useCallback } from 'react'
import { AgentAPI } from '@/lib/api/agents'

export function useAgent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const runAgent = useCallback(async (request: AgentRunRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await AgentAPI.runAgent(request)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { runAgent, loading, error }
}
```

### 5. Environment Variable Management

#### Next.js Environment Variables
```bash
# .env.local (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

#### FastAPI Environment Variables
```bash
# .env (FastAPI)
PORT=8000
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000"]
DATABASE_URL=sqlite:///./data-formulator.db
```

### 6. State Management Migration

#### Redux Store Configuration
```typescript
// lib/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const persistConfig = {
  key: 'data-formulator',
  storage,
  whitelist: ['dataFormulator']
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
})
```

#### State Schema Compatibility
```typescript
// Maintain backward compatibility with existing state
interface DataFormulatorState {
  // Keep same structure as original React app
  tables: Record<string, any[]>
  charts: Record<string, ChartSpec>
  threads: ThreadData[]
  sessionId: string
  config: AppConfig
}
```

## Common Migration Pitfalls & Solutions

### 1. Hydration Mismatches
```typescript
// Problem: Client/server render differences
// Solution: Use useEffect for client-only code

const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <div>Loading...</div>
}
```

### 2. Dynamic Imports Not Working
```typescript
// Problem: Dynamic imports failing
// Solution: Proper Next.js configuration

// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false
      }
    }
    return config
  }
}
```

### 3. Redux Persistence Issues
```typescript
// Problem: Redux state not persisting
// Solution: Proper PersistGate setup

import { PersistGate } from 'redux-persist/integration/react'

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
```

## Testing Strategy

### Component Testing
```typescript
// __tests__/DataView.test.tsx
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { DataView } from '@/components/data-formulator/DataView'

test('renders data table correctly', () => {
  render(
    <Provider store={mockStore}>
      <DataView tableName="test-table" />
    </Provider>
  )
  
  expect(screen.getByText('test-table')).toBeInTheDocument()
})
```

### API Testing
```python
# tests/test_agents.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_run_agent():
    response = client.post(
        "/api/v1/agents/run",
        json={
            "agent_type": "python_data_transform",
            "prompt": "Create a bar chart",
            "model_config": {"provider": "openai", "model": "gpt-4"},
            "session_id": "test-session"
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

## Performance Optimization

### Bundle Size Optimization
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    }
    return config
  }
}
```

### Code Splitting
```typescript
// Lazy load heavy components
const HeavyChartComponent = lazy(() => import('./HeavyChartComponent'))

function MyComponent() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChartComponent />
    </Suspense>
  )
}
```

This migration guide provides the foundation for a successful transition from Flask/React to FastAPI/Next.js while maintaining all the sophisticated AI-powered data transformation capabilities of Data Formulator.