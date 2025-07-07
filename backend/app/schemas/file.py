from pydantic import BaseModel, ConfigDict

class FileUploadResponse(BaseModel):
    filename: str
    path: str
    size: int

    model_config = ConfigDict(from_attributes=True)

class FileResponse(BaseModel):
    filename: str
    path: str
    size: int

    model_config = ConfigDict(from_attributes=True)

class FileCreate(BaseModel):
    filename: str
    path: str 