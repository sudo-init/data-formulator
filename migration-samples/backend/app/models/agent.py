"""
Pydantic models for agent API endpoints
Migrated from Flask request/response handling
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
from enum import Enum


class AgentType(str, Enum):
    """Available agent types"""
    PYTHON_DATA_TRANSFORM = "python_data_transform"
    SQL_DATA_TRANSFORM = "sql_data_transform"
    PYTHON_DATA_REC = "python_data_rec"
    SQL_DATA_REC = "sql_data_rec"
    CONCEPT_DERIVE = "concept_derive"
    PY_CONCEPT_DERIVE = "py_concept_derive"
    DATA_LOAD = "data_load"
    DATA_CLEAN = "data_clean"
    SORT_DATA = "sort_data"
    CODE_EXPLANATION = "code_explanation"
    QUERY_COMPLETION = "query_completion"


class ModelConfig(BaseModel):
    """LLM model configuration"""
    provider: str = Field(..., description="LLM provider (openai, azure, anthropic, etc.)")
    model: str = Field(..., description="Model name")
    api_key: Optional[str] = Field(None, description="API key for the model")
    api_base: Optional[str] = Field(None, description="Custom API base URL")
    api_version: Optional[str] = Field(None, description="API version")
    temperature: float = Field(0.1, ge=0.0, le=2.0, description="Model temperature")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens to generate")


class AgentRunRequest(BaseModel):
    """Request model for agent run endpoint"""
    agent_type: AgentType = Field(..., description="Type of agent to run")
    model_config: ModelConfig = Field(..., description="LLM model configuration")
    prompt: str = Field(..., description="User prompt/instruction")
    data: Dict[str, Any] = Field(default_factory=dict, description="Input data")
    tables: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict, description="Available tables")
    session_id: str = Field(..., description="Session identifier")
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional configuration")


class AgentFollowupRequest(BaseModel):
    """Request model for agent followup endpoint"""
    agent_type: AgentType = Field(..., description="Type of agent to run")
    model_config: ModelConfig = Field(..., description="LLM model configuration")
    prompt: str = Field(..., description="Follow-up prompt/instruction")
    data: Dict[str, Any] = Field(default_factory=dict, description="Input data")
    tables: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict, description="Available tables")
    session_id: str = Field(..., description="Session identifier")
    previous_dialog: List[Dict[str, Any]] = Field(default_factory=list, description="Previous conversation")
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional configuration")


class AgentStatus(str, Enum):
    """Agent execution status"""
    OK = "ok"
    ERROR = "error"
    OTHER_ERROR = "other error"


class AgentResponse(BaseModel):
    """Response model for agent endpoints"""
    status: AgentStatus = Field(..., description="Execution status")
    content: Dict[str, Any] = Field(default_factory=dict, description="Agent-specific output")
    code: Optional[str] = Field(None, description="Generated code")
    dialog: List[Dict[str, Any]] = Field(default_factory=list, description="Conversation history")
    agent: str = Field(..., description="Agent name/type")
    refined_goal: Optional[Dict[str, Any]] = Field(None, description="Structured goal representation")
    error_message: Optional[str] = Field(None, description="Error details if status is error")
    execution_time: Optional[float] = Field(None, description="Execution time in seconds")


class ModelListResponse(BaseModel):
    """Response model for available models endpoint"""
    models: List[Dict[str, str]] = Field(..., description="List of available models")
    providers: List[str] = Field(..., description="List of supported providers")


class SessionInfo(BaseModel):
    """Session information model"""
    session_id: str = Field(..., description="Unique session identifier")
    created_at: str = Field(..., description="Session creation timestamp")
    last_activity: Optional[str] = Field(None, description="Last activity timestamp")