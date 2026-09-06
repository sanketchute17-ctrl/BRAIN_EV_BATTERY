from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "BRAIN - EV Battery Risk & Analytics Intelligence Network"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "brain_ev_super_secret_jwt_key_2026_academic_research"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./brain_ev.db"
    
    # PKL File Directory
    PKL_DATA_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))

    class Config:
        case_sensitive = True

settings = Settings()
