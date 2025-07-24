# Data Formulator Migration Checklist: Flask/React → FastAPI/Next.js

## Phase 1: Project Setup and Structure

### Backend (FastAPI) Setup
- [ ] **Create new FastAPI project structure**
  - [ ] Set up `backend/app/` directory structure
  - [ ] Configure `pyproject.toml` and `requirements.txt`
  - [ ] Create `app/main.py` with FastAPI application
  - [ ] Set up `app/core/config.py` with Pydantic settings

- [ ] **Environment Configuration**
  - [ ] Migrate environment variables from Flask to FastAPI
  - [ ] Create `.env` file with FastAPI-specific settings
  - [ ] Set up `api-keys.env` for LLM credentials
  - [ ] Configure CORS settings for Next.js frontend

- [ ] **Database Migration**
  - [ ] Port DuckDB connection logic to `app/core/database.py`
  - [ ] Migrate `db_manager.py` functionality
  - [ ] Test database connections and operations

### Frontend (Next.js) Setup
- [ ] **Create Next.js project with App Router**
  - [ ] Initialize Next.js project: `npx create-next-app@latest`
  - [ ] Set up App Router structure in `app/` directory
  - [ ] Configure `next.config.js` for external dependencies

- [ ] **Styling Migration**
  - [ ] Install and configure Tailwind CSS
  - [ ] Set up `tailwind.config.js` with custom theme
  - [ ] Create `globals.css` with base styles
  - [ ] Plan gradual MUI → Tailwind migration strategy

- [ ] **State Management**
  - [ ] Install Redux Toolkit and react-redux
  - [ ] Set up Redux store with persistence
  - [ ] Create typed hooks for Redux
  - [ ] Set up providers in `app/providers.tsx`

## Phase 2: API Layer Migration

### FastAPI Backend Development
- [ ] **Pydantic Models**
  - [ ] Create `app/models/agent.py` with request/response models
  - [ ] Create `app/models/table.py` for table operations
  - [ ] Create `app/models/common.py` for shared types
  - [ ] Add validation and documentation to all models

- [ ] **API Routes Migration**
  - [ ] Migrate Flask blueprints to FastAPI routers
  - [ ] Port `agent_routes.py` → `app/api/v1/agents.py`
  - [ ] Port `tables_routes.py` → `app/api/v1/tables.py`
  - [ ] Port `sse_routes.py` → `app/api/v1/streaming.py`
  - [ ] Add proper error handling and status codes

- [ ] **Agent System Migration**
  - [ ] Copy existing agent classes to `app/agents/`
  - [ ] Create `app/services/agent_service.py` wrapper
  - [ ] Update agent interfaces for async operations
  - [ ] Test agent functionality with new API endpoints

- [ ] **Authentication & Security**
  - [ ] Implement session management
  - [ ] Add API key validation
  - [ ] Set up security middleware
  - [ ] Configure rate limiting if needed

### Frontend API Client
- [ ] **Base API Client**
  - [ ] Create `lib/api/client.ts` with fetch-based client
  - [ ] Implement error handling and type safety
  - [ ] Add request/response interceptors
  - [ ] Support streaming endpoints for SSE

- [ ] **Specific API Modules**
  - [ ] Create `lib/api/agents.ts` for agent operations
  - [ ] Create `lib/api/tables.ts` for table management
  - [ ] Create `lib/api/datasets.ts` for dataset operations
  - [ ] Add TypeScript types for all API responses

## Phase 3: Component Migration

### Core Component Migration
- [ ] **App Structure**
  - [ ] Create `app/layout.tsx` root layout
  - [ ] Migrate main app logic to `app/page.tsx`
  - [ ] Set up dashboard route in `app/dashboard/`
  - [ ] Implement navigation and routing logic

- [ ] **Data Formulator Components**
  - [ ] Migrate `DataFormulator.tsx` to Next.js component structure
  - [ ] Port `DataView.tsx` with AG Grid SSR considerations
  - [ ] Port `VisualizationView.tsx` with Vega-Lite dynamic imports
  - [ ] Port `ConceptShelf.tsx` with React DnD functionality
  - [ ] Port `DataThread.tsx` for conversation history

- [ ] **UI Components**
  - [ ] Create reusable UI components in `components/ui/`
  - [ ] Gradually replace MUI components with Tailwind equivalents
  - [ ] Maintain design consistency during transition
  - [ ] Test component functionality in SSR environment

### Third-Party Library Integration
- [ ] **AG Grid Configuration**
  - [ ] Ensure AG Grid works with Next.js App Router
  - [ ] Configure server-side rendering compatibility
  - [ ] Test grid functionality and performance
  - [ ] Handle hydration issues if any

- [ ] **Vega-Lite Integration**
  - [ ] Use dynamic imports to avoid SSR issues
  - [ ] Create loading states for chart components
  - [ ] Test chart rendering and interactions
  - [ ] Ensure chart export functionality works

- [ ] **React DnD Setup**
  - [ ] Configure DnD provider in app layout
  - [ ] Test drag-and-drop functionality
  - [ ] Handle touch devices if needed
  - [ ] Verify concept shelf interactions

## Phase 4: Feature Parity & Testing

### Core Features
- [ ] **Data Loading**
  - [ ] Test CSV file upload functionality
  - [ ] Verify database connections work
  - [ ] Test sample dataset loading
  - [ ] Validate data type inference

- [ ] **AI Agent Integration**
  - [ ] Test all agent types with new API
  - [ ] Verify LLM provider integrations
  - [ ] Test code generation and execution
  - [ ] Validate error handling and recovery

- [ ] **Visualization Pipeline**
  - [ ] Test chart creation workflow
  - [ ] Verify Vega-Lite spec generation
  - [ ] Test chart editing and customization
  - [ ] Validate export functionality

- [ ] **Session Management**
  - [ ] Test session persistence
  - [ ] Verify state synchronization
  - [ ] Test import/export functionality
  - [ ] Validate multi-session handling

### Performance & Optimization
- [ ] **Bundle Optimization**
  - [ ] Analyze bundle size and optimize imports
  - [ ] Implement code splitting where appropriate
  - [ ] Configure proper caching strategies
  - [ ] Optimize image and asset loading

- [ ] **Runtime Performance**
  - [ ] Test large dataset handling
  - [ ] Optimize React component rendering
  - [ ] Profile API response times
  - [ ] Monitor memory usage patterns

## Phase 5: Production Readiness

### Security & Configuration
- [ ] **Environment Configuration**
  - [ ] Set up production environment variables
  - [ ] Configure proper CORS policies
  - [ ] Set up API rate limiting
  - [ ] Implement proper logging

- [ ] **Security Hardening**
  - [ ] Validate all input sanitization
  - [ ] Test API authentication flows
  - [ ] Review dependency security
  - [ ] Implement proper error responses

### Deployment Preparation
- [ ] **Docker Configuration**
  - [ ] Create Dockerfiles for both services
  - [ ] Set up docker-compose for development
  - [ ] Configure production deployment
  - [ ] Test containerized deployment

- [ ] **CI/CD Pipeline**
  - [ ] Set up automated testing
  - [ ] Configure build and deployment pipeline
  - [ ] Set up monitoring and logging
  - [ ] Create rollback procedures

## Phase 6: Migration Execution

### Gradual Migration Strategy
- [ ] **Feature Flags**
  - [ ] Implement feature toggles for new components
  - [ ] Allow gradual rollout of new features
  - [ ] Maintain backward compatibility during transition
  - [ ] Monitor performance metrics

- [ ] **Data Migration**
  - [ ] Export existing user sessions
  - [ ] Migrate database schemas if needed
  - [ ] Test data integrity after migration
  - [ ] Provide import tools for existing users

### Validation & Rollback
- [ ] **User Acceptance Testing**
  - [ ] Test all critical user workflows
  - [ ] Validate feature parity with original system
  - [ ] Gather performance feedback
  - [ ] Document any breaking changes

- [ ] **Rollback Planning**
  - [ ] Prepare rollback procedures
  - [ ] Maintain old system during transition
  - [ ] Create migration documentation
  - [ ] Train team on new system

## Migration Timeline Estimate

### Phase 1-2: Foundation (2-3 weeks)
- Backend API structure and core endpoints
- Frontend project setup and basic routing
- Database and configuration migration

### Phase 3: Component Migration (3-4 weeks)
- Core component porting and testing
- Third-party library integration
- Basic functionality validation

### Phase 4: Feature Completion (2-3 weeks)
- Complete feature parity
- Performance optimization
- Integration testing

### Phase 5-6: Production (1-2 weeks)
- Security hardening
- Deployment preparation
- Migration execution

**Total Estimated Time: 8-12 weeks**

## Risk Mitigation

### High-Risk Areas
1. **SSR Compatibility**: AG Grid and Vega-Lite with Next.js
2. **State Management**: Redux persistence across migration
3. **Agent System**: Async compatibility with existing Python code
4. **Performance**: Bundle size and runtime performance with new stack

### Mitigation Strategies
1. Use dynamic imports and proper loading states
2. Maintain state schema compatibility
3. Thorough testing of agent endpoints
4. Regular performance monitoring and optimization

## Success Criteria

- [ ] All original features working in new system
- [ ] Performance equal to or better than original
- [ ] No data loss during migration
- [ ] User experience maintained or improved
- [ ] Successful deployment to production