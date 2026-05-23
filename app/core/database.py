from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import redis.asyncio as aioredis
from loguru import logger


# ─── SQLAlchemy ───────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── Redis ───────────────────────────────────────────────────────────────────
redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return redis_client


async def init_db():
    """Create all tables on startup"""
    async with engine.begin() as conn:
        from app.models import user, organization, expense, vendor, audit_log
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables created successfully")


async def close_db():
    """Close database connections on shutdown"""
    await engine.dispose()
    if redis_client:
        await redis_client.close()
    logger.info("✅ Database connections closed")
