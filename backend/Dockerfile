# Use an official Python image with version 3.11 as the base
FROM python:3.11

# Set the working directory inside the container
WORKDIR /app

# Copy all backend files to the container
COPY . .

# Install the required Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 8000 for the FastAPI app
EXPOSE 8000

# Command to start the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
