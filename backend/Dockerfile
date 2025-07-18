# Use Python 3.9
FROM python:3.9-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bundle app source
COPY . .

# Set Python path
ENV PYTHONPATH=/usr/src/app

# Expose port
EXPOSE 3000

# Start the application
CMD ["python", "app/main.py"]