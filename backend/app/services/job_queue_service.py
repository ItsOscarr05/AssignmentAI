"""
Job Queue Service for AssignmentAI
Implements queue-based job system for scalable file processing as required by PRD
"""
import asyncio
import json
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, asdict
import logging

from app.core.config import settings
from app.core.logger import logger

class JobStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"

class JobPriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4

@dataclass
class Job:
    id: str
    user_id: int
    job_type: str
    payload: Dict[str, Any]
    priority: JobPriority
    status: JobStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    result: Optional[Dict[str, Any]] = None
    subscription_tier: str = "free"  # free, plus, pro, max
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['priority'] = self.priority.value
        data['status'] = self.status.value
        data['created_at'] = self.created_at.isoformat()
        data['started_at'] = self.started_at.isoformat() if self.started_at else None
        data['completed_at'] = self.completed_at.isoformat() if self.completed_at else None
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Job':
        data['priority'] = JobPriority(data['priority'])
        data['status'] = JobStatus(data['status'])
        data['created_at'] = datetime.fromisoformat(data['created_at'])
        data['started_at'] = datetime.fromisoformat(data['started_at']) if data['started_at'] else None
        data['completed_at'] = datetime.fromisoformat(data['completed_at']) if data['completed_at'] else None
        return cls(**data)

class JobQueueService:
    """
    Queue-based job system for scalable file processing
    Implements priority queues, retry logic, and subscription-based processing
    """
    
    def __init__(self):
        self.jobs: Dict[str, Job] = {}
        self.job_processors: Dict[str, Callable] = {}
        self.running = False
        self.workers: List[asyncio.Task] = []
        
        # Subscription-based processing limits (per PRD)
        self.subscription_limits = {
            "free": {
                "max_concurrent": 1,
                "max_file_size": 10 * 1024 * 1024,  # 10MB
                "max_questions": 10,
                "watermark": True,
                "priority_multiplier": 1.0
            },
            "plus": {
                "max_concurrent": 2,
                "max_file_size": 25 * 1024 * 1024,  # 25MB
                "max_questions": 50,
                "watermark": False,
                "priority_multiplier": 1.5
            },
            "pro": {
                "max_concurrent": 5,
                "max_file_size": 25 * 1024 * 1024,  # 25MB
                "max_questions": 200,
                "watermark": False,
                "priority_multiplier": 2.0
            },
            "max": {
                "max_concurrent": 10,
                "max_file_size": 25 * 1024 * 1024,  # 25MB
                "max_questions": -1,  # Unlimited
                "watermark": False,
                "priority_multiplier": 3.0
            }
        }
    
    async def start(self, num_workers: int = 5):
        """Start the job queue system with specified number of workers"""
        if self.running:
            return
        
        self.running = True
        logger.info(f"Starting job queue service with {num_workers} workers")
        
        # Start worker tasks
        for i in range(num_workers):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)
        
        # Start cleanup task for old jobs
        cleanup_task = asyncio.create_task(self._cleanup_old_jobs())
        self.workers.append(cleanup_task)
        
        logger.info("Job queue service started successfully")
    
    async def stop(self):
        """Stop the job queue system"""
        if not self.running:
            return
        
        self.running = False
        logger.info("Stopping job queue service...")
        
        # Cancel all worker tasks
        for worker in self.workers:
            worker.cancel()
        
        # Wait for workers to finish
        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers.clear()
        
        logger.info("Job queue service stopped")
    
    async def enqueue_job(
        self,
        user_id: int,
        job_type: str,
        payload: Dict[str, Any],
        priority: JobPriority = JobPriority.NORMAL,
        subscription_tier: str = "free"
    ) -> str:
        """Enqueue a new job for processing"""
        job_id = str(uuid.uuid4())
        
        # Validate subscription limits
        limits = self.subscription_limits.get(subscription_tier, self.subscription_limits["free"])
        
        # Check file size limit
        file_size = payload.get('file_size', 0)
        if file_size > limits['max_file_size']:
            raise ValueError(f"File size {file_size} exceeds limit {limits['max_file_size']} for {subscription_tier} tier")
        
        # Create job
        job = Job(
            id=job_id,
            user_id=user_id,
            job_type=job_type,
            payload=payload,
            priority=priority,
            status=JobStatus.PENDING,
            created_at=datetime.utcnow(),
            subscription_tier=subscription_tier
        )
        
        self.jobs[job_id] = job
        
        logger.info(f"Enqueued job {job_id} for user {user_id} with priority {priority.name}")
        return job_id
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a job"""
        job = self.jobs.get(job_id)
        return job.to_dict() if job else None
    
    async def get_user_jobs(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Get jobs for a specific user"""
        user_jobs = [
            job.to_dict() for job in self.jobs.values()
            if job.user_id == user_id
        ]
        
        # Sort by created_at descending
        user_jobs.sort(key=lambda x: x['created_at'], reverse=True)
        return user_jobs[:limit]
    
    async def cancel_job(self, job_id: str, user_id: int) -> bool:
        """Cancel a job (only if it belongs to the user and is pending)"""
        job = self.jobs.get(job_id)
        if not job or job.user_id != user_id:
            return False
        
        if job.status == JobStatus.PENDING:
            job.status = JobStatus.CANCELLED
            job.completed_at = datetime.utcnow()
            logger.info(f"Cancelled job {job_id} for user {user_id}")
            return True
        
        return False
    
    def register_processor(self, job_type: str, processor: Callable):
        """Register a job processor for a specific job type"""
        self.job_processors[job_type] = processor
        logger.info(f"Registered processor for job type: {job_type}")
    
    async def _worker(self, worker_name: str):
        """Worker coroutine that processes jobs from the queue"""
        logger.info(f"Worker {worker_name} started")
        
        while self.running:
            try:
                # Get next job to process
                job = await self._get_next_job()
                
                if job:
                    await self._process_job(job, worker_name)
                else:
                    # No jobs available, wait a bit
                    await asyncio.sleep(1)
                    
            except asyncio.CancelledError:
                logger.info(f"Worker {worker_name} cancelled")
                break
            except Exception as e:
                logger.error(f"Worker {worker_name} error: {str(e)}")
                await asyncio.sleep(5)  # Wait before retrying
        
        logger.info(f"Worker {worker_name} stopped")
    
    async def _get_next_job(self) -> Optional[Job]:
        """Get the next job to process based on priority and subscription tier"""
        # Filter pending jobs
        pending_jobs = [
            job for job in self.jobs.values()
            if job.status == JobStatus.PENDING
        ]
        
        if not pending_jobs:
            return None
        
        # Sort by priority (considering subscription tier multiplier)
        def job_priority(job: Job) -> float:
            base_priority = job.priority.value
            tier_multiplier = self.subscription_limits[job.subscription_tier]['priority_multiplier']
            return base_priority * tier_multiplier
        
        pending_jobs.sort(key=job_priority, reverse=True)
        
        # Check concurrent job limits per subscription tier
        tier_counts = {}
        for job in pending_jobs:
            tier = job.subscription_tier
            tier_counts[tier] = tier_counts.get(tier, 0)
        
        # Find a job that doesn't exceed tier limits
        for job in pending_jobs:
            tier = job.subscription_tier
            limits = self.subscription_limits[tier]
            
            # Count currently processing jobs for this tier
            processing_count = sum(
                1 for j in self.jobs.values()
                if j.status == JobStatus.PROCESSING and j.subscription_tier == tier
            )
            
            if processing_count < limits['max_concurrent']:
                return job
        
        return None
    
    async def _process_job(self, job: Job, worker_name: str):
        """Process a single job"""
        try:
            logger.info(f"Worker {worker_name} processing job {job.id}")
            
            # Update job status
            job.status = JobStatus.PROCESSING
            job.started_at = datetime.utcnow()
            
            # Get processor for this job type
            processor = self.job_processors.get(job.job_type)
            if not processor:
                raise ValueError(f"No processor registered for job type: {job.job_type}")
            
            # Process the job
            result = await processor(job.payload)
            
            # Mark job as completed
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            job.result = result
            
            logger.info(f"Job {job.id} completed successfully by {worker_name}")
            
        except Exception as e:
            logger.error(f"Job {job.id} failed: {str(e)}")
            
            # Handle retry logic
            job.retry_count += 1
            job.error_message = str(e)
            
            if job.retry_count < job.max_retries:
                # Retry the job
                job.status = JobStatus.RETRYING
                await asyncio.sleep(min(2 ** job.retry_count, 60))  # Exponential backoff
                job.status = JobStatus.PENDING
                logger.info(f"Retrying job {job.id} (attempt {job.retry_count + 1}/{job.max_retries})")
            else:
                # Mark as failed
                job.status = JobStatus.FAILED
                job.completed_at = datetime.utcnow()
                logger.error(f"Job {job.id} failed after {job.max_retries} retries")
    
    async def _cleanup_old_jobs(self):
        """Clean up old completed/failed jobs"""
        while self.running:
            try:
                cutoff_time = datetime.utcnow() - timedelta(hours=24)  # Keep jobs for 24 hours
                
                jobs_to_remove = []
                for job_id, job in self.jobs.items():
                    if (job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED] and
                        job.created_at < cutoff_time):
                        jobs_to_remove.append(job_id)
                
                for job_id in jobs_to_remove:
                    del self.jobs[job_id]
                
                if jobs_to_remove:
                    logger.info(f"Cleaned up {len(jobs_to_remove)} old jobs")
                
                # Wait 1 hour before next cleanup
                await asyncio.sleep(3600)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup task: {str(e)}")
                await asyncio.sleep(300)  # Wait 5 minutes before retrying

# Global job queue service instance
job_queue_service = JobQueueService()
