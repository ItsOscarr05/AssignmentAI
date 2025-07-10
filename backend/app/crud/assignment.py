from typing import List, Optional, Any, Dict, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func, select
from app.crud.base import CRUDBase
from app.models.assignment import Assignment, AssignmentStatus
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate
from app.models.class_model import Class

class CRUDAssignment(CRUDBase[Assignment, AssignmentCreate, AssignmentUpdate]):
    async def get_by_teacher(
        self, db: AsyncSession, *, teacher_id: int, skip: int = 0, limit: int = 100
    ) -> List[Assignment]:
        result = await db.execute(
            select(self.model)
            .filter(Assignment.teacher_id == teacher_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_active_assignments(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[Assignment]:
        result = await db.execute(
            select(self.model)
            .filter(Assignment.status == "published")
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_user(
        self, db: AsyncSession, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> list[Assignment]:
        result = await db.execute(
            select(self.model)
            .filter(Assignment.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_with_user(
        self, db: AsyncSession, *, obj_in: AssignmentCreate, user_id: int
    ) -> Assignment:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def duplicate(
        self, db: AsyncSession, *, assignment_id: int, user_id: int, title: str
    ) -> Assignment:
        assignment = await self.get(db, id=assignment_id)
        if not assignment or assignment.user_id != user_id:
            return None
        
        # Create a copy of the assignment
        new_assignment = Assignment(
            title=title,
            subject=assignment.subject,
            grade_level=assignment.grade_level,
            assignment_type=assignment.assignment_type,
            topic=assignment.topic,
            difficulty=assignment.difficulty,
            estimated_time=assignment.estimated_time,
            additional_requirements=assignment.additional_requirements,
            description=assignment.description,
            max_score=assignment.max_score,
            status=assignment.status,
            is_active=assignment.is_active,
            user_id=user_id
        )
        db.add(new_assignment)
        await db.commit()
        await db.refresh(new_assignment)
        return new_assignment

# Synchronous versions for use with regular sessions
def create_assignment_sync(db: Session, assignment: AssignmentCreate, user_id: int) -> Assignment:
    # Create a class for the assignment if one does not exist
    unique_code = f"TEST{user_id}"
    test_class = db.query(Class).filter_by(code=unique_code).first()
    if not test_class:
        test_class = Class(
            name=f"Test Class {user_id}",
            code=unique_code,
            description=f"Test Description for user {user_id}",
            teacher_id=user_id
        )
        db.add(test_class)
        db.commit()
        db.refresh(test_class)
    db_assignment = Assignment(
        **assignment.model_dump(),
        user_id=user_id,
        created_by_id=user_id,
        teacher_id=user_id
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def get_assignment_sync(db: Session, assignment_id: int) -> Optional[Assignment]:
    return db.query(Assignment).filter(Assignment.id == assignment_id).first()

def get_assignments_sync(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    search: Optional[str] = None,
    status: Optional[AssignmentStatus] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None
) -> List[Assignment]:
    query = db.query(Assignment)
    
    if search:
        query = query.filter(Assignment.title.ilike(f"%{search}%"))
    if status:
        query = query.filter(Assignment.status == status)
    if subject:
        query = query.filter(Assignment.subject == subject)
    if grade_level:
        query = query.filter(Assignment.grade_level == grade_level)
    
    if sort_order == "desc":
        query = query.order_by(desc(getattr(Assignment, sort_by)))
    else:
        query = query.order_by(asc(getattr(Assignment, sort_by)))
    
    return query.offset(skip).limit(limit).all()

def update_assignment_sync(
    db: Session,
    assignment_id: int,
    assignment: AssignmentUpdate
) -> Optional[Assignment]:
    db_assignment = get_assignment_sync(db, assignment_id)
    if not db_assignment:
        return None
    
    for field, value in assignment.model_dump(exclude_unset=True).items():
        setattr(db_assignment, field, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def delete_assignment_sync(db: Session, assignment_id: int) -> bool:
    db_assignment = get_assignment_sync(db, assignment_id)
    if not db_assignment:
        return False
    
    db.delete(db_assignment)
    db.commit()
    return True

def get_assignments_count_sync(
    db: Session,
    search: Optional[str] = None,
    status: Optional[AssignmentStatus] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None
) -> int:
    query = db.query(Assignment)
    
    if search:
        query = query.filter(Assignment.title.ilike(f"%{search}%"))
    if status:
        query = query.filter(Assignment.status == status)
    if subject:
        query = query.filter(Assignment.subject == subject)
    if grade_level:
        query = query.filter(Assignment.grade_level == grade_level)
    
    return query.count()

def count(db: Session) -> int:
    """Count total assignments"""
    return db.query(Assignment).count()

async def create_assignment(db: AsyncSession, assignment: AssignmentCreate, user_id: int) -> Assignment:
    db_assignment = Assignment(
        **assignment.model_dump(),
        created_by_id=user_id
    )
    db.add(db_assignment)
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment

async def get_assignment(db: AsyncSession, assignment_id: int) -> Optional[Assignment]:
    result = await db.execute(select(Assignment).filter(Assignment.id == assignment_id))
    return result.scalar_one_or_none()

async def get_assignments(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    search: Optional[str] = None,
    status: Optional[AssignmentStatus] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None
) -> List[Assignment]:
    query = select(Assignment)
    
    if search:
        query = query.filter(Assignment.title.ilike(f"%{search}%"))
    if status:
        query = query.filter(Assignment.status == status)
    if subject:
        query = query.filter(Assignment.subject == subject)
    if grade_level:
        query = query.filter(Assignment.grade_level == grade_level)
    
    if sort_order == "desc":
        query = query.order_by(desc(getattr(Assignment, sort_by)))
    else:
        query = query.order_by(asc(getattr(Assignment, sort_by)))
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def update_assignment(
    db: AsyncSession,
    assignment_id: int,
    assignment: AssignmentUpdate
) -> Optional[Assignment]:
    db_assignment = await get_assignment(db, assignment_id)
    if not db_assignment:
        return None
    
    for field, value in assignment.model_dump(exclude_unset=True).items():
        setattr(db_assignment, field, value)
    
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment

async def delete_assignment(db: AsyncSession, assignment_id: int) -> bool:
    db_assignment = await get_assignment(db, assignment_id)
    if not db_assignment:
        return False
    
    await db.delete(db_assignment)
    await db.commit()
    return True

async def get_assignments_count(
    db: AsyncSession,
    search: Optional[str] = None,
    status: Optional[AssignmentStatus] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None
) -> int:
    query = select(Assignment)
    
    if search:
        query = query.filter(Assignment.title.ilike(f"%{search}%"))
    if status:
        query = query.filter(Assignment.status == status)
    if subject:
        query = query.filter(Assignment.subject == subject)
    if grade_level:
        query = query.filter(Assignment.grade_level == grade_level)
    
    result = await db.execute(select(func.count()).select_from(query.subquery()))
    return result.scalar_one()

assignment = CRUDAssignment(Assignment) 