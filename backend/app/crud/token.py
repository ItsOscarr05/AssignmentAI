from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.token import Token
from app.schemas.token import TokenCreate, TokenUpdate

class CRUDToken(CRUDBase[Token, TokenCreate, TokenUpdate]):
    async def get_by_token(self, db: AsyncSession, *, token: str) -> Optional[Token]:
        result = await db.execute(select(Token).filter(Token.token == token))
        return result.scalar_one_or_none()

    async def get_by_user_id(self, db: AsyncSession, *, user_id: int) -> Optional[Token]:
        result = await db.execute(select(Token).filter(Token.user_id == user_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: TokenCreate) -> Token:
        db_obj = Token(
            token=obj_in.token,
            user_id=obj_in.user_id,
            expires_at=obj_in.expires_at
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

token = CRUDToken(Token)

# Export functions
create_token = token.create
get_token = token.get_by_token
delete_token = token.remove 