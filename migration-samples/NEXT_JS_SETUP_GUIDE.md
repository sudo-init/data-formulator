# Next.js Setup Guide for Data Formulator

## Quick Start

### 1. 프로젝트 초기화
```bash
# 프로젝트 디렉토리 생성
mkdir data-formulator-frontend
cd data-formulator-frontend

# 의존성 설치
npm install
# 또는
yarn install
```

### 2. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

## 해결된 문제들

### ❌ style-loader 오류 해결

**문제**: `Module not found: Can't resolve 'style-loader'`

**원인**: Next.js는 자체 CSS 처리 시스템을 사용하므로 webpack에서 `style-loader`를 사용할 필요가 없음

**해결책**:
1. `next.config.js`에서 `style-loader` 설정 제거
2. `transpilePackages` 옵션 사용으로 외부 패키지 처리
3. AG Grid CSS를 `layout.tsx`에서 직접 import

### ✅ 수정된 next.config.js

```javascript
const nextConfig = {
  transpilePackages: [
    'ag-grid-community',
    'ag-grid-react', 
    'ag-grid-enterprise',
    'react-vega',
    'vega',
    'vega-lite',
    'vega-embed',
    'd3',
  ],
  
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
      }
    }
    return config
  },
}
```

### ✅ AG Grid SSR 처리

```typescript
// components/data-formulator/DataView.tsx
const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg">
        <span className="text-gray-500">Loading data grid...</span>
      </div>
    ),
  }
)
```

### ✅ CSS 임포트 처리

```typescript
// app/layout.tsx
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import './globals.css'
```

## 추가 설정사항

### TypeScript 경로 별명 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"]
    }
  }
}
```

### ESLint & Prettier 설정
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ]
}
```

### Tailwind CSS 설정
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'ag-theme-alpine',
    'vega-embed',
  ]
}
```

## 개발 스크립트

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

## 추천 개발 환경

### VS Code 확장프로그램
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense  
- TypeScript Importer
- Prettier - Code formatter
- ESLint

### 환경변수 설정
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

## 문제 해결 팁

### 1. Hydration 오류
```typescript
// 클라이언트 전용 컴포넌트 처리
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) return null
```

### 2. Dynamic Import 패턴
```typescript
// 무거운 라이브러리 지연 로딩
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  ssr: false,
  loading: () => <div>Loading...</div>
})
```

### 3. Redux Persist 설정
```typescript
// SSR 호환 Redux Persist
import { PersistGate } from 'redux-persist/integration/react'

<PersistGate loading={<div>Loading...</div>} persistor={persistor}>
  {children}
</PersistGate>
```

## 성능 최적화

### 번들 분석
```bash
npm run analyze
```

### 이미지 최적화
```typescript
import Image from 'next/image'

<Image
  src="/chart-icon.png"
  alt="Chart"
  width={24}
  height={24}
  priority
/>
```

### 코드 분할
```typescript
import { lazy, Suspense } from 'react'

const LazyChart = lazy(() => import('./Chart'))

<Suspense fallback={<div>Loading chart...</div>}>
  <LazyChart />
</Suspense>
```

이 설정으로 Next.js 환경에서 Data Formulator를 성공적으로 실행할 수 있습니다!