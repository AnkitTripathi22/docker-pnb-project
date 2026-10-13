import os
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, BigInteger, String, Integer, DateTime, func, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Load .env variables
load_dotenv()

APP_NAME = os.getenv("APP_NAME", "FastAPI Docker Service")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
DB_HOST = os.getenv("DB_HOST", "13.234.155.172")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "jrp_pnb")
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# SQLAlchemy Setup (Using working DB from PNB)
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# SQLAlchemy Model matching jrp_pnb masters_country table
class MastersCountry(Base):
    __tablename__ = "masters_country"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, nullable=True, default=0)
    updated_by = Column(Integer, nullable=True, default=0)

# Database Session Dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# FastAPI App
app = FastAPI(title=APP_NAME, version="1.0.0")

# CORS Middleware (Frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class CountryResponse(BaseModel):
    id: int
    name: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CountryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)

class CountryUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)


# ---------------- API ROUTES ----------------

@app.get("/")
def read_root():
    return {
        "app": APP_NAME,
        "status": "online",
        "database_connected": DB_NAME,
        "database_host": DB_HOST,
        "delete_api_status": "DISABLED (Safety Mode ON)",
    }

@app.get("/api/db-info")
async def get_db_info(db: AsyncSession = Depends(get_db)):
    """Database connectivity test aur summary"""
    try:
        result = await db.execute(select(func.count(MastersCountry.id)))
        total_countries = result.scalar() or 0
        return {
            "status": "connected",
            "database": DB_NAME,
            "host": DB_HOST,
            "port": DB_PORT,
            "table": "masters_country",
            "total_records": total_countries,
            "delete_allowed": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")

# 1. READ: Get all countries
@app.get("/api/countries", response_model=List[CountryResponse])
async def get_all_countries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MastersCountry).order_by(MastersCountry.id.asc()))
    countries = result.scalars().all()
    return countries

# 2. READ: Get country by ID
@app.get("/api/countries/{country_id}", response_model=CountryResponse)
async def get_country_by_id(country_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MastersCountry).where(MastersCountry.id == country_id))
    country = result.scalar_one_or_none()
    if not country:
        raise HTTPException(status_code=404, detail="Country nahi mili")
    return country

# 3. CREATE: Add new country (POST)
@app.post("/api/countries", response_model=CountryResponse, status_code=status.HTTP_201_CREATED)
async def create_country(payload: CountryCreate, db: AsyncSession = Depends(get_db)):
    # Check if name already exists
    existing = await db.execute(select(MastersCountry).where(MastersCountry.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ye Country pehle se exist karti hai")

    new_country = MastersCountry(name=payload.name, created_by=1, updated_by=1)
    db.add(new_country)
    await db.commit()
    await db.refresh(new_country)
    return new_country

# 4. UPDATE: Update country name (PUT)
@app.put("/api/countries/{country_id}", response_model=CountryResponse)
async def update_country(country_id: int, payload: CountryUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MastersCountry).where(MastersCountry.id == country_id))
    country = result.scalar_one_or_none()
    if not country:
        raise HTTPException(status_code=404, detail="Country nahi mili")

    country.name = payload.name
    country.updated_at = func.now()
    country.updated_by = 1
    await db.commit()
    await db.refresh(country)
    return country

# ---------------- IMPORTANT SAFETY INSTRUCTION ----------------
# DELETE API is STRICTLY DISABLED to prevent accidental deletion
# from production/working database jrp_pnb.
