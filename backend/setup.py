from setuptools import setup, find_packages

setup(
    name="assignmentai",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "pydantic",
        "pydantic-settings",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "python-multipart",
        "aioredis",
        "pytest",
        "pytest-asyncio",
        "pytest-cov",
        "httpx",
        "aiosqlite",
        "sqlalchemy[asyncio]"
    ],
    python_requires=">=3.8",
) 