# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Formulator is an AI-powered data visualization tool that combines UI interactions with natural language processing to help analysts create rich visualizations. It's a hybrid React/TypeScript frontend with a Python Flask backend, featuring a sophisticated multi-agent AI system for data transformation.

## Key Architecture

### Frontend (React/TypeScript)
- **Framework**: React 18 with TypeScript, built using Vite
- **State Management**: Redux Toolkit with persistent state
- **UI Library**: Material-UI (MUI) v7
- **Visualization**: Vega-Lite through react-vega
- **Data Grid**: AG Grid for tabular data display
- **Drag & Drop**: React DnD for visual encoding creation

### Backend (Python/Flask)
- **Web Framework**: Flask with blueprints architecture
- **Database**: DuckDB for analytical workloads and data storage
- **AI Integration**: Multi-agent system with 14 specialized agents
- **LLM Support**: Unified client supporting OpenAI, Azure, Anthropic, Google, Ollama via LiteLLM
- **Data Processing**: Pandas for data manipulation, secure Python sandboxing

### Multi-Agent AI System
The core innovation is a sophisticated agent system in `py-src/data_formulator/agents/`:
- **Data Transformation**: Python and SQL code generation agents
- **Concept Derivation**: TypeScript/Python function generation for new columns
- **Data Processing**: Data loading, cleaning, and recommendation agents
- **Safety**: Sandboxed execution with ethical guidelines and security measures

## Development Commands

### Frontend Development
```bash
# Install dependencies
yarn

# Start development server (frontend only)
yarn start
# Opens http://localhost:5173

# Build for production
yarn build

# Lint code
yarn lint
```

### Backend Development
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start development server (full stack)
./local_server.sh  # Unix/Linux/macOS
.\local_server.bat  # Windows

# Build Python package
python -m build
```

### Full Development Setup
For development with hot reload:
1. Start backend: `./local_server.sh`
2. In separate terminal, start frontend: `yarn start`
3. Frontend runs on :5173, backend on :5000

### Testing
No formal test framework is configured. Testing relies on manual validation and the built-in example datasets with visualization challenges.

## Key Files and Components

### Core Frontend Components
- `src/app/App.tsx` - Main application shell and routing
- `src/views/DataFormulator.tsx` - Primary workspace with split panes
- `src/views/VisualizationView.tsx` - Chart rendering and visualization controls
- `src/views/ConceptShelf.tsx` - Drag-and-drop encoding interface
- `src/views/DataView.tsx` - Data table display and management
- `src/app/dfSlice.tsx` - Redux state management with actions and selectors

### Core Backend Components
- `py-src/data_formulator/app.py` - Flask application entry point
- `py-src/data_formulator/agents/` - Multi-agent AI system
- `py-src/data_formulator/agent_routes.py` - API endpoints for agent interactions
- `py-src/data_formulator/tables_routes.py` - Data table management APIs
- `py-src/data_formulator/db_manager.py` - DuckDB database operations

### Configuration
- `package.json` - Frontend dependencies and scripts
- `pyproject.toml` - Python package configuration
- `vite.config.ts` - Frontend build configuration
- `eslint.config.js` - Linting rules
- `api-keys.env.template` - Environment variables template for API keys

## Data Flow

1. **Data Loading**: Upload CSV, connect to databases, or use sample datasets
2. **Visual Encoding**: Drag fields to chart properties (x, y, color, etc.)
3. **AI Transformation**: Type non-existent field names to trigger AI agents
4. **Code Generation**: Agents generate Python/SQL code for data transformation
5. **Execution**: Code runs in sandboxed environments with DuckDB backend
6. **Visualization**: Results rendered as Vega-Lite charts
7. **Iteration**: Natural language follow-ups for refinement

## Development Patterns

### State Management
- All application state managed through Redux with persistence
- Actions defined in `dfSlice.tsx` with TypeScript types
- Async operations use RTK Query patterns

### Agent Integration
- Agents follow consistent interface: `run()` and `followup()` methods
- Standardized response format with status, content, code, and dialog
- Two-phase processing: goal refinement → code generation
- Safety-first design with ethical guidelines and sandboxed execution

### Security Considerations
- Python code execution in restricted sandbox environments
- SQL injection prevention through parameterized queries
- API key management through environment variables
- Audit hooks to prevent dangerous operations

### Code Style
- Frontend: TypeScript with Material-UI design patterns
- Backend: Python with type hints and secure coding practices
- Consistent error handling and logging throughout
- Modular architecture with clear separation of concerns

## External Data Sources

### Supported Data Loaders
- **MySQL**: `mysql_data_loader.py`
- **PostgreSQL**: `postgresql_data_loader.py`
- **Azure Data Explorer (Kusto)**: `kusto_data_loader.py`
- **Azure Blob Storage**: `azure_blob_data_loader.py`
- **Amazon S3**: `s3_data_loader.py`
- **Microsoft SQL Server**: `mssql_data_loader.py`

### Sample Datasets
Built-in Vega datasets with pre-configured visualization challenges for testing and learning.

## Environment Variables

Key configuration options in `.env`:
- `EXEC_PYTHON_IN_SUBPROCESS`: Enhanced security mode (slower)
- `DISABLE_DISPLAY_KEYS`: Hide API keys in frontend
- `LOCAL_DB_DIR`: Database storage location
- External database connection settings when `USE_EXTERNAL_DB=true`

For API keys, copy `api-keys.env.template` to `api-keys.env` and configure LLM provider credentials.