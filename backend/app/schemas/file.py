from pydantic import BaseModel

class FileUploadResponse(BaseModel):
    filename: str
    path: str
    size: int

    class Config:
        from_attributes = True

class FileResponse(BaseModel):
    filename: str
    path: str
    size: int

    class Config:
        from_attributes = True

class FileCreate(BaseModel):
    filename: str
    path: str 