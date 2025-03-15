from setuptools import setup, find_packages

setup(
    name="config-manager",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "click>=8.0.0",
        "pyyaml>=6.0.0",
        "psutil>=5.8.0",
    ],
    entry_points={
        "console_scripts": [
            "config-manager=config.cli:cli",
        ],
    },
    author="AssignmentAI Team",
    author_email="team@assignmentai.com",
    description="Configuration Management System for AssignmentAI",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/assignmentai/backend",
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
) 