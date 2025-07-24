# Data Formulator Frontend

This is the migrated frontend for Data Formulator, converted from React/Vite to Next.js 14 with TypeScript and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── dashboard/          # Dashboard page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── providers.tsx       # React providers
├── components/             # React components
│   ├── app/                # App-level components
│   ├── data-formulator/    # Core Data Formulator components
│   ├── data-management/    # Data management components
│   ├── data-table/         # Table components
│   ├── dialogs/            # Modal dialogs
│   └── ui/                 # UI components
├── lib/                    # Shared libraries
│   ├── constants/          # Constants and templates
│   ├── data/               # Data processing utilities
│   ├── store/              # Redux store and slices
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── hooks/                  # Custom React hooks
└── public/                 # Static assets
    └── assets/             # Images and icons
```

## 🛠️ Technologies

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Material-UI
- **State Management**: Redux Toolkit with Redux Persist
- **Data Visualization**: Vega-Lite, D3.js
- **Data Grid**: AG Grid
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

## 📋 Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler
pnpm format       # Format code with Prettier

# Testing
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode

# Analysis
pnpm analyze      # Analyze bundle size
```

## 🔧 Configuration

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_ENABLE_DEBUG`: Enable debug mode
- Other feature flags and configuration options

### API Integration

The frontend communicates with the FastAPI backend via:
- REST API endpoints for data operations
- Server-Sent Events (SSE) for real-time updates
- WebSocket connections for live collaboration

## 🎨 Styling System

### Tailwind CSS Classes

The application uses a custom Tailwind configuration with:
- Custom color palette for Data Formulator
- Responsive design utilities
- Custom components and utilities
- Material-UI integration

### Component Structure

Components are organized by function:
- **App**: Application-level components (header, layout)
- **Data Formulator**: Core visualization components
- **Data Management**: Database and table management
- **Dialogs**: Modal windows and overlays
- **UI**: Reusable UI components

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm test:watch
```

## 🚀 Deployment

### Production Build

```bash
pnpm build
pnpm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t data-formulator-frontend .

# Run container
docker run -p 3000:3000 data-formulator-frontend
```

## 🔍 Key Features

- **Interactive Data Visualization**: Drag-and-drop chart builder
- **AI-Powered Data Transformation**: Natural language data queries
- **Real-time Collaboration**: Live updates and sharing
- **Responsive Design**: Works on desktop and tablet devices
- **Accessibility**: WCAG 2.1 compliant interface
- **Performance**: Optimized for large datasets

## 🐛 Troubleshooting

### Common Issues

1. **Module not found errors**: Check import paths and aliases
2. **SSR hydration issues**: Ensure client-only components use dynamic imports
3. **Vega-Lite rendering**: Check CSP headers and script loading
4. **Redux persistence**: Clear localStorage if state issues occur

### Debug Mode

Enable debug mode by setting `NEXT_PUBLIC_ENABLE_DEBUG=true` in `.env.local`.

## 📖 Migration Notes

This frontend was migrated from React/Vite to Next.js while maintaining:
- All original functionality
- Component structure and logic
- Redux state management
- Material-UI styling
- Data visualization capabilities

### Breaking Changes

- Import paths updated to use Next.js aliases (`@/lib/...`)
- SSR compatibility added for all components
- Asset paths updated for Next.js public directory
- Environment variables prefixed with `NEXT_PUBLIC_`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Material-UI Documentation](https://mui.com/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Vega-Lite Documentation](https://vega.github.io/vega-lite/)