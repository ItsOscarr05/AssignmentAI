from pydantic import BaseModel

class FileResponse(BaseModel):
    filename: str
    path: str
    size: int

    class Config:
        from_attributes = True 