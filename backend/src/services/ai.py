from typing import List, Dict, Any, Optional
import openai
from sqlalchemy.orm import Session
from models.assignment import Assignment, AssignmentSubmission
from models.feedback import Feedback, FeedbackType
from dotenv import load_dotenv
import os

load_dotenv()

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

class AIService:
    def __init__(self, db: Session):
        self.db = db
        self.model = "gpt-4"  # Using GPT-4 for better analysis

    async def analyze_submission(
        self,
        submission: AssignmentSubmission,
        rubric_criteria: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a submission using AI
        
        Args:
            submission: The submission to analyze
            rubric_criteria: Optional rubric criteria for structured analysis
            
        Returns:
            Dictionary containing analysis results
        """
        # Prepare the prompt
        prompt = f"""
        Analyze the following assignment submission:
        
        Assignment Title: {submission.assignment.title}
        Assignment Description: {submission.assignment.description}
        
        Submission Content:
        {submission.content}
        
        Please provide:
        1. Overall quality assessment
        2. Key strengths
        3. Areas for improvement
        4. Suggested feedback
        """
        
        if rubric_criteria:
            prompt += "\n\nRubric Criteria:\n"
            for criterion in rubric_criteria:
                prompt += f"- {criterion['name']}: {criterion['description']}\n"
        
        # Get AI analysis
        response = await openai.ChatCompletion.acreate(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert educator analyzing student assignments."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        analysis = response.choices[0].message.content
        
        # Generate structured feedback
        feedback_prompt = f"""
        Based on the following analysis, generate structured feedback for the student:
        
        {analysis}
        
        Please provide:
        1. A concise summary of the submission
        2. Specific points of praise
        3. Constructive criticism
        4. Actionable suggestions for improvement
        """
        
        feedback_response = await openai.ChatCompletion.acreate(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert educator providing constructive feedback."},
                {"role": "user", "content": feedback_prompt}
            ],
            temperature=0.7
        )
        
        feedback = feedback_response.choices[0].message.content
        
        return {
            "analysis": analysis,
            "feedback": feedback,
            "raw_response": response.choices[0].message.content
        }

    async def detect_plagiarism(
        self,
        submission: AssignmentSubmission
    ) -> Dict[str, Any]:
        """
        Check submission for potential plagiarism
        
        Args:
            submission: The submission to check
            
        Returns:
            Dictionary containing plagiarism check results
        """
        prompt = f"""
        Analyze the following text for potential plagiarism. Consider:
        1. Unusual language patterns
        2. Inconsistent writing style
        3. Sudden changes in tone or complexity
        4. Potential copied content
        
        Text to analyze:
        {submission.content}
        
        Provide:
        1. Plagiarism probability (0-100%)
        2. Specific concerns
        3. Recommended actions
        """
        
        response = await openai.ChatCompletion.acreate(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert in academic integrity and plagiarism detection."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3  # Lower temperature for more consistent results
        )
        
        return {
            "analysis": response.choices[0].message.content,
            "raw_response": response.choices[0].message.content
        }

    async def generate_smart_grade(
        self,
        submission: AssignmentSubmission,
        rubric_criteria: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate a smart grade for a submission
        
        Args:
            submission: The submission to grade
            rubric_criteria: Optional rubric criteria for structured grading
            
        Returns:
            Dictionary containing grading results
        """
        prompt = f"""
        Grade the following assignment submission:
        
        Assignment Title: {submission.assignment.title}
        Assignment Description: {submission.assignment.description}
        Maximum Score: {submission.assignment.max_score}
        
        Submission Content:
        {submission.content}
        
        Please provide:
        1. Numerical score (0-{submission.assignment.max_score})
        2. Justification for the score
        3. Key strengths that contributed to the score
        4. Areas that could have improved the score
        """
        
        if rubric_criteria:
            prompt += "\n\nRubric Criteria:\n"
            for criterion in rubric_criteria:
                prompt += f"- {criterion['name']}: {criterion['description']} (Weight: {criterion.get('weight', 1)})\n"
        
        response = await openai.ChatCompletion.acreate(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert educator grading student assignments."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3  # Lower temperature for more consistent grading
        )
        
        return {
            "grade_analysis": response.choices[0].message.content,
            "raw_response": response.choices[0].message.content
        }

    async def generate_feedback(
        self,
        submission: AssignmentSubmission,
        analysis_results: Dict[str, Any]
    ) -> Feedback:
        """
        Generate AI-powered feedback for a submission
        
        Args:
            submission: The submission to generate feedback for
            analysis_results: Results from the AI analysis
            
        Returns:
            Created feedback object
        """
        feedback = Feedback(
            submission_id=submission.id,
            teacher_id=submission.assignment.teacher_id,
            type=FeedbackType.GENERAL,
            content=analysis_results["feedback"]
        )
        
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        
        return feedback 