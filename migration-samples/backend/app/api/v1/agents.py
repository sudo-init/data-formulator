"""
FastAPI agent endpoints
Migrated from Flask agent_routes.py
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any
import asyncio
import time
import logging

from app.models.agent import (
    AgentRunRequest, 
    AgentFollowupRequest, 
    AgentResponse, 
    ModelListResponse,
    AgentStatus
)
from app.services.agent_service import AgentService
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def get_agent_service() -> AgentService:
    """Dependency to get agent service instance"""
    return AgentService()


@router.post("/agents/run", response_model=AgentResponse)
async def run_agent(
    request: AgentRunRequest,
    agent_service: AgentService = Depends(get_agent_service)
) -> AgentResponse:
    """
    Run an AI agent for data transformation
    Migrated from Flask /api/agent/run endpoint
    """
    start_time = time.time()
    
    try:
        logger.info(f"Running agent {request.agent_type} for session {request.session_id}")
        
        # Run agent in thread pool to avoid blocking
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            agent_service.run_agent,
            request
        )
        
        execution_time = time.time() - start_time
        result.execution_time = execution_time
        
        logger.info(f"Agent {request.agent_type} completed in {execution_time:.2f}s")
        return result
        
    except Exception as e:
        logger.error(f"Agent execution failed: {str(e)}")
        return AgentResponse(
            status=AgentStatus.ERROR,
            agent=request.agent_type.value,
            error_message=str(e),
            execution_time=time.time() - start_time
        )


@router.post("/agents/followup", response_model=AgentResponse)
async def followup_agent(
    request: AgentFollowupRequest,
    agent_service: AgentService = Depends(get_agent_service)
) -> AgentResponse:
    """
    Follow up with an AI agent for iterative refinement
    """
    start_time = time.time()
    
    try:
        logger.info(f"Following up with agent {request.agent_type} for session {request.session_id}")
        
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            agent_service.followup_agent,
            request
        )
        
        execution_time = time.time() - start_time
        result.execution_time = execution_time
        
        return result
        
    except Exception as e:
        logger.error(f"Agent followup failed: {str(e)}")
        return AgentResponse(
            status=AgentStatus.ERROR,
            agent=request.agent_type.value,
            error_message=str(e),
            execution_time=time.time() - start_time
        )


@router.get("/agents/models", response_model=ModelListResponse)
async def get_available_models(
    agent_service: AgentService = Depends(get_agent_service)
) -> ModelListResponse:
    """
    Get list of available LLM models and providers
    Migrated from Flask /api/get-models endpoint
    """
    try:
        models_data = await asyncio.get_event_loop().run_in_executor(
            None,
            agent_service.get_available_models
        )
        
        return ModelListResponse(
            models=models_data.get("models", []),
            providers=models_data.get("providers", [])
        )
        
    except Exception as e:
        logger.error(f"Failed to get available models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/config")
async def get_agent_config() -> Dict[str, Any]:
    """
    Get agent configuration settings
    """
    return {
        "formulate_timeout_seconds": settings.FORMULATE_TIMEOUT_SECONDS,
        "max_repair_attempts": settings.MAX_REPAIR_ATTEMPTS,
        "default_chart_width": settings.DEFAULT_CHART_WIDTH,
        "default_chart_height": settings.DEFAULT_CHART_HEIGHT,
        "exec_python_in_subprocess": settings.EXEC_PYTHON_IN_SUBPROCESS,
        "disable_display_keys": settings.DISABLE_DISPLAY_KEYS
    }


@router.post("/agents/explain-code")
async def explain_code(
    request: Dict[str, Any],
    agent_service: AgentService = Depends(get_agent_service)
) -> AgentResponse:
    """
    Explain generated code in natural language
    """
    try:
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            agent_service.explain_code,
            request.get("code", ""),
            request.get("model_config", {}),
            request.get("session_id", "")
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Code explanation failed: {str(e)}")
        return AgentResponse(
            status=AgentStatus.ERROR,
            agent="code_explanation",
            error_message=str(e)
        )