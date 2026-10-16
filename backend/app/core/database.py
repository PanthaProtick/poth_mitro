import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

engine = None
AsyncSessionLocal = None

if settings.DATABASE_URL:
    db_url = settings.DATABASE_URL
    # Ensure asyncpg driver prefix is used
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

    try:
        engine = create_async_engine(
            db_url,
            echo=settings.DEBUG,
            future=True,
            pool_pre_ping=True
        )
        AsyncSessionLocal = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False
        )
        logger.info("Configured Async Database Engine for Neon Postgres.")
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
else:
    logger.warning("DATABASE_URL is not set. Database features will operate in standby mode.")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if AsyncSessionLocal is None:
        yield None
        return
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
