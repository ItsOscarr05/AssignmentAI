from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.class_model import Class
from app.schemas.class_schema import ClassCreate, ClassUpdate

class CRUDClass(CRUDBase[Class, ClassCreate, ClassUpdate]):
    async def get_by_code(self, db: AsyncSession, *, code: str) -> Optional[Class]:
        result = await db.execute(select(Class).filter(Class.code == code))
        return result.scalar_one_or_none()

    async def get_by_teacher_id(self, db: AsyncSession, *, teacher_id: int) -> List[Class]:
        result = await db.execute(select(Class).filter(Class.teacher_id == teacher_id))
        return result.scalars().all()

    async def get_by_student_id(self, db: AsyncSession, *, student_id: int) -> List[Class]:
        result = await db.execute(select(Class).filter(Class.students.any(id=student_id)))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: ClassCreate) -> Class:
        db_obj = Class(
            name=obj_in.name,
            code=obj_in.code,
            description=obj_in.description,
            teacher_id=obj_in.teacher_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

class_crud = CRUDClass(Class)

# Export functions
get_class = class_crud.get
get_classes = class_crud.get_multi
create_class = class_crud.create
update_class = class_crud.update
delete_class = class_crud.remove 