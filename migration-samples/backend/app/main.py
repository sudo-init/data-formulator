# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

"""
FastAPI Main Application for Data Formulator
Migrated from original Flask app.py to FastAPI with async support
"""

import os
import sys
import json
import base64
import logging
import secrets
from pathlib import Path
from typing import Dict, Any, List
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import vega datasets
try:
    from vega_datasets import data as vega_data
except ImportError:
    vega_data = None

# Application root path
APP_ROOT = Path(__file__).parent.parent.absolute()

# Load environment variables
load_dotenv(os.path.join(APP_ROOT, "..", "..", 'api-keys.env'))
load_dotenv(os.path.join(APP_ROOT, 'api-keys.env'))
load_dotenv(os.path.join(APP_ROOT, '.env'))

# Custom JSON encoder for numpy types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.int64):
            return int(obj)
        if isinstance(obj, np.float64):
            return float(obj)
        if isinstance(obj, (bytes, bytearray)):
            return base64.b64encode(obj).decode('ascii')
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

# Custom JSON response class using our encoder
class CustomJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            cls=CustomJSONEncoder,
        ).encode("utf-8")

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    logging.info("Starting Data Formulator API server...")
    
    # Initialize any required services here
    # e.g., database connections, AI model loading, etc.
    
    yield
    
    # Shutdown
    logging.info("Shutting down Data Formulator API server...")

# Create FastAPI app
app = FastAPI(
    title="Data Formulator API",
    description="AI-Powered Data Visualization and Transformation API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    default_response_class=CustomJSONResponse
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vega datasets endpoints
@app.get("/api/vega-datasets")
async def get_example_dataset_list():
    """Get list of available Vega example datasets with challenges"""
    if not vega_data:
        raise HTTPException(status_code=503, detail="Vega datasets not available")
    
    try:
        example_datasets = [
            {
                "name": "gapminder", 
                "challenges": [
                    {"text": "Create a line chart to show the life expectancy trend of each country over time.", "difficulty": "easy"},
                    {"text": "Visualize the top 10 countries with highest life expectancy in 2005.", "difficulty": "medium"},
                    {"text": "Find top 10 countries that have the biggest difference of life expectancy in 1955 and 2005.", "difficulty": "hard"},
                    {"text": "Rank countries by their average population per decade. Then only show countries with population over 50 million in 2005.", "difficulty": "hard"}
                ]
            },
            {
                "name": "income", 
                "challenges": [
                    {"text": "Create a line chart to show the income trend of each state over time.", "difficulty": "easy"},
                    {"text": "Only show washington and california's percentage of population in each income group each year.", "difficulty": "medium"},
                    {"text": "Find the top 5 states with highest percentage of high income group in 2016.", "difficulty": "hard"}
                ]
            },
            {
                "name": "disasters", 
                "challenges": [
                    {"text": "Create a scatter plot to show the number of death from each disaster type each year.", "difficulty": "easy"},
                    {"text": "Filter the data and show the number of death caused by flood or drought each year.", "difficulty": "easy"},
                    {"text": "Create a heatmap to show the total number of death caused by each disaster type each decade.", "difficulty": "hard"},
                    {"text": "Exclude 'all natural disasters' from the previous chart.", "difficulty": "medium"}
                ]
            },
            {
                "name": "movies", 
                "challenges": [
                    {"text": "Create a scatter plot to show the relationship between budget and worldwide gross.", "difficulty": "easy"},
                    {"text": "Find the top 10 movies with highest profit after 2000 and visualize them in a bar chart.", "difficulty": "easy"},
                    {"text": "Visualize the median profit ratio of movies in each genre", "difficulty": "medium"},
                    {"text": "Create a scatter plot to show the relationship between profit and IMDB rating.", "difficulty": "medium"},
                    {"text": "Turn the above plot into a heatmap by bucketing IMDB rating and profit, color tiles by the number of movies in each bucket.", "difficulty": "hard"}
                ]
            },
            {
                "name": "unemployment-across-industries", 
                "challenges": [
                    {"text": "Create a scatter plot to show the relationship between unemployment rate and year.", "difficulty": "easy"},
                    {"text": "Create a line chart to show the average unemployment per year for each industry.", "difficulty": "medium"},
                    {"text": "Find the 5 most stable industries (least change in unemployment rate between 2000 and 2010) and visualize their trend over time using line charts.", "difficulty": "medium"},
                    {"text": "Create a bar chart to show the unemployment rate change between 2000 and 2010, and highlight the top 5 most stable industries with least change.", "difficulty": "hard"}
                ]
            }
        ]
        
        dataset_info = []
        for dataset in example_datasets:
            name = dataset["name"]
            challenges = dataset["challenges"]
            try:
                df = vega_data(name)
                snapshot = df.to_dict('records')
                info_obj = {
                    'name': name, 
                    'challenges': challenges, 
                    'snapshot': snapshot[:100]  # Limit snapshot size
                }
                dataset_info.append(info_obj)
            except Exception as e:
                logging.warning(f"Failed to load dataset {name}: {e}")
                continue
        
        return dataset_info
    
    except Exception as e:
        logging.error(f"Error getting dataset list: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dataset list")

@app.get("/api/vega-dataset/{path:path}")
async def get_datasets(path: str):
    """Get specific Vega dataset by name"""
    if not vega_data:
        raise HTTPException(status_code=503, detail="Vega datasets not available")
    
    try:
        df = vega_data(path)
        data_object = df.to_dict('records')
        return data_object
    except Exception as e:
        logging.error(f"Error loading dataset {path}: {e}")
        raise HTTPException(status_code=404, detail=f"Dataset {path} not found")

# Test endpoints
@app.get("/api/hello")
async def hello():
    """Test endpoint returning a simple Vega-Lite spec"""
    values = [
        {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43},
        {"a": "D", "b": 91}, {"a": "E", "b": 81}, {"a": "F", "b": 53},
        {"a": "G", "b": 19}, {"a": "H", "b": 87}, {"a": "I", "b": 52}
    ]
    spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "A simple bar chart with embedded data.",
        "data": {"values": values},
        "mark": "bar",
        "encoding": {
            "x": {"field": "a", "type": "nominal", "axis": {"labelAngle": 0}},
            "y": {"field": "b", "type": "quantitative"}
        }
    }
    return spec

@app.get("/stream")
async def hello_stream():
    """Test streaming endpoint for TestPanel compatibility"""
    async def generate():
        values = [
            {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43},
            {"a": "D", "b": 91}, {"a": "E", "b": 81}, {"a": "F", "b": 53},
            {"a": "G", "b": 19}, {"a": "H", "b": 87}, {"a": "I", "b": 52}
        ]
        
        for i in range(5):
            spec = {
                "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                "description": f"A simple bar chart with embedded data. Iteration {i+1}",
                "data": {"values": values[:i+3]},
                "mark": "bar",
                "encoding": {
                    "x": {"field": "a", "type": "nominal", "axis": {"labelAngle": 0}},
                    "y": {"field": "b", "type": "quantitative"}
                }
            }
            yield f"{json.dumps(spec, cls=CustomJSONEncoder)}\n"
            
            # Simulate some processing time
            import asyncio
            await asyncio.sleep(1)
    
    return StreamingResponse(generate(), media_type="text/plain")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "timestamp": secrets.token_hex(8)
    }

# App configuration endpoint
@app.get("/api/app-config")
async def get_app_config():
    """Get application configuration"""
    return {
        "exec_python_in_subprocess": os.environ.get('EXEC_PYTHON_IN_SUBPROCESS', 'false').lower() == 'true',
        "disable_display_keys": os.environ.get('DISABLE_DISPLAY_KEYS', 'false').lower() == 'true',
        "version": "2.0.0",
        "api_docs_url": "/api/docs"
    }

# Session management
@app.post("/api/get-session-id")
async def get_session_id(request: Request):
    """Get or create session ID"""
    try:
        body = await request.json()
        existing_session_id = body.get('session_id')
        
        if existing_session_id:
            # Validate existing session
            return {"session_id": existing_session_id}
        else:
            # Generate new session ID
            new_session_id = secrets.token_hex(16)
            return {"session_id": new_session_id}
            
    except Exception as e:
        logging.error(f"Error in session management: {e}")
        # Generate new session ID as fallback
        new_session_id = secrets.token_hex(16)
        return {"session_id": new_session_id}

# Serve static files (for development - in production use nginx/Apache)
if os.path.exists(os.path.join(APP_ROOT, "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(APP_ROOT, "static")), name="static")

# Root endpoint
@app.get("/")
async def read_root():
    """Root endpoint"""
    return HTMLResponse(content="""
    <html>
        <head><title>Data Formulator API</title></head>
        <body>
            <h1>Data Formulator API</h1>
            <p>API server is running. Visit <a href="/api/docs">/api/docs</a> for documentation.</p>
            <p>Test endpoints:</p>
            <ul>
                <li><a href="/api/hello">/api/hello</a> - Simple test</li>
                <li><a href="/api/health">/api/health</a> - Health check</li>
                <li><a href="/stream">/stream</a> - Streaming test</li>
            </ul>
        </body>
    </html>
    """)

if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    uvicorn.run(
        "main_new:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=True if os.environ.get("ENVIRONMENT") == "development" else False,
        log_level="info"
    )