"""
FastAPI configuration settings
Migrated from Flask environment variable handling
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Server configuration
    PORT: int = 8000
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Database configuration
    LOCAL_DB_DIR: Optional[str] = None
    USE_EXTERNAL_DB: bool = False
    DB_TYPE: Optional[str] = None
    DB_HOST: Optional[str] = None
    DB_PORT: Optional[int] = None
    DB_DATABASE: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_NAME: Optional[str] = None
    
    # Security configuration
    EXEC_PYTHON_IN_SUBPROCESS: bool = False
    DISABLE_DISPLAY_KEYS: bool = False
    SECRET_KEY: str = "your-secret-key-here"
    
    # LLM API Keys (loaded from environment)
    OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    
    # Agent configuration
    FORMULATE_TIMEOUT_SECONDS: int = 30
    MAX_REPAIR_ATTEMPTS: int = 1
    DEFAULT_CHART_WIDTH: int = 300
    DEFAULT_CHART_HEIGHT: int = 300
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()


def get_app_root() -> Path:
    """Get application root directory"""
    return Path(__file__).parent.parent.parent.absolute()


def load_api_keys():
    """Load API keys from api-keys.env file"""
    app_root = get_app_root()
    api_keys_file = app_root / "api-keys.env"
    
    if api_keys_file.exists():
        from dotenv import load_dotenv
        load_dotenv(api_keys_file)
        
        # Update settings with loaded values
        for key in ["OPENAI_API_KEY", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", 
                   "ANTHROPIC_API_KEY", "GOOGLE_API_KEY"]:
            if os.getenv(key):
                setattr(settings, key, os.getenv(key))


# Load API keys on import
load_api_keys()