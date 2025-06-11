from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.ai_assignment import AIAssignment
from app.schemas.ai_assignment import AIAssignmentCreate, AIAssignmentUpdate

async def get_ai_assignment(db: AsyncSession, ai_assignment_id: int) -> Optional[AIAssignment]:
    result = await db.execute(select(AIAssignment).filter(AIAssignment.id == ai_assignment_id))
    return result.scalar_one_or_none()

async def get_ai_assignment_by_assignment(db: AsyncSession, assignment_id: int) -> List[AIAssignment]:
    result = await db.execute(select(AIAssignment).filter(AIAssignment.assignment_id == assignment_id))
    return result.scalars().all()

async def create_ai_assignment(db: AsyncSession, ai_assignment: AIAssignmentCreate) -> AIAssignment:
    db_ai_assignment = AIAssignment(**ai_assignment.model_dump())
    db.add(db_ai_assignment)
    await db.commit()
    await db.refresh(db_ai_assignment)
    return db_ai_assignment

async def update_ai_assignment(db: AsyncSession, ai_assignment_id: int, ai_assignment: AIAssignmentUpdate) -> Optional[AIAssignment]:
    db_ai_assignment = await get_ai_assignment(db, ai_assignment_id)
    if not db_ai_assignment:
        return None
    
    for field, value in ai_assignment.model_dump(exclude_unset=True).items():
        setattr(db_ai_assignment, field, value)
    
    await db.commit()
    await db.refresh(db_ai_assignment)
    return db_ai_assignment

async def delete_ai_assignment(db: AsyncSession, ai_assignment_id: int) -> bool:
    db_ai_assignment = await get_ai_assignment(db, ai_assignment_id)
    if not db_ai_assignment:
        return False
    
    await db.delete(db_ai_assignment)
    await db.commit()
    return True 