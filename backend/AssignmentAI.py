# Standard library imports
import sys
import os
import argparse
from datetime import datetime
import logging
import traceback
import asyncio
from typing import Dict, Optional, Union
from pathlib import Path

# Third-party imports
try:
    from openai import OpenAI
except ImportError as e:
    print(f"Error importing OpenAI: {e}")
    print("Please install openai using: pip install openai")
    sys.exit(1)

# Local imports
from ai_models.ai_engine import AIEngine, SubjectType, AssignmentType
from ai_models.file_processor import FileProcessor, FileType

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('assignment_debug.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Storage Configuration
STORAGE_TYPE = "local"  # Options: "local", "cloud", "hybrid"
UPLOAD_DIR = "/path/to/local/storage"
BASE_URL = "http://your-api-url"

# Cloud Storage Configuration
AWS_BUCKET_NAME = "your-bucket"
AWS_REGION = "your-region"
AWS_ACCESS_KEY_ID = "your-key"
AWS_SECRET_ACCESS_KEY = "your-secret"

class AssignmentAutomator:
    def __init__(self, api_key=None):
        """Initialize the assignment automator with AI capabilities"""
        try:
            logging.info("Initializing AssignmentAutomator")
            self.api_key = api_key or os.getenv('OPENAI_API_KEY')
            if not self.api_key:
                raise ValueError("OpenAI API key is required. Please set OPENAI_API_KEY environment variable.")
            
            # Initialize AI Engine and File Processor
            self.ai_engine = AIEngine()
            self.file_processor = FileProcessor()
            logging.info("Successfully initialized AI Engine and File Processor")
        except Exception as e:
            logging.error(f"Error initializing AssignmentAutomator: {str(e)}")
            logging.error(f"Traceback: {traceback.format_exc()}")
            raise

    async def process_assignment(
        self,
        assignment_input: Union[str, Path],
        subject: str,
        grade_level: str,
        assignment_type: Optional[str] = None,
        additional_context: Optional[Dict] = None,
        is_file: bool = False
    ) -> Dict:
        """Process the assignment and generate a comprehensive response"""
        try:
            logging.info(f"Processing assignment for subject: {subject}, grade: {grade_level}")
            
            # Get assignment text
            if is_file:
                file_result = await self.file_processor.process_file(assignment_input)
                assignment_text = file_result["content"]
                
                # Add file metadata to context
                if additional_context is None:
                    additional_context = {}
                additional_context["file_metadata"] = file_result["metadata"]
            else:
                assignment_text = assignment_input
            
            if not assignment_text or not subject or not grade_level:
                raise ValueError("Assignment text, subject, and grade level are required")
            
            # Map subject to SubjectType
            try:
                subject_type = SubjectType[subject.upper()]
            except KeyError:
                subject_type = SubjectType.GENERAL
                logging.warning(f"Unknown subject {subject}, using GENERAL")
            
            # Determine assignment type
            if assignment_type:
                try:
                    assignment_type = AssignmentType[assignment_type.upper()]
                except KeyError:
                    assignment_type = self._detect_assignment_type(assignment_text)
            else:
                assignment_type = self._detect_assignment_type(assignment_text)
            
            logging.debug("Making AI Engine call")
            response = await self.ai_engine.process_assignment(
                assignment_text=assignment_text,
                subject=subject_type,
                assignment_type=assignment_type,
                grade_level=grade_level,
                additional_context=additional_context
            )
            
            logging.info("Successfully received response from AI Engine")
            
            # Save the response
            filename = await self.save_response(
                assignment_text=assignment_text,
                response=response,
                subject=subject,
                original_file=assignment_input if is_file else None
            )
            response["saved_file"] = filename
            
            return response
        except Exception as e:
            logging.error(f"Error in process_assignment: {str(e)}")
            logging.error(f"Traceback: {traceback.format_exc()}")
            return {
                "error": str(e),
                "status": "error",
                "metadata": {
                    "subject": subject,
                    "grade_level": grade_level,
                    "timestamp": datetime.now().isoformat()
                }
            }

    def _detect_assignment_type(self, assignment_text: str) -> AssignmentType:
        """Detect the type of assignment based on the text content"""
        text_lower = assignment_text.lower()
        
        # Check for programming/code assignments
        if any(keyword in text_lower for keyword in ["code", "program", "function", "algorithm"]):
            return AssignmentType.CODE
        
        # Check for research assignments
        if any(keyword in text_lower for keyword in ["research", "investigate", "analyze", "study"]):
            return AssignmentType.RESEARCH
        
        # Check for essay assignments
        if any(keyword in text_lower for keyword in ["essay", "write", "discuss", "explain"]):
            return AssignmentType.ESSAY
        
        # Check for problem-solving assignments
        if any(keyword in text_lower for keyword in ["solve", "calculate", "find", "determine"]):
            return AssignmentType.PROBLEM_SOLVING
        
        # Check for analysis assignments
        if any(keyword in text_lower for keyword in ["analyze", "evaluate", "compare", "contrast"]):
            return AssignmentType.ANALYSIS
        
        return AssignmentType.GENERAL

    async def save_response(
        self,
        assignment_text: str,
        response: Dict,
        subject: str,
        original_file: Optional[Union[str, Path]] = None
    ) -> Optional[str]:
        """Save the assignment and response to a file"""
        try:
            logging.info("Attempting to save response")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"assignment_{subject}_{timestamp}.json"
            
            # Prepare the complete response object
            complete_response = {
                "assignment": assignment_text,
                "response": response["response"],
                "key_points": response.get("key_points", []),
                "citations": response.get("citations", []),
                "metadata": {
                    "subject": subject,
                    "timestamp": timestamp,
                    "assignment_type": response["metadata"]["assignment_type"],
                    "model_provider": response["metadata"]["model_provider"]
                }
            }
            
            # Add original file information if provided
            if original_file:
                if isinstance(original_file, Path):
                    original_file = str(original_file)
                complete_response["metadata"]["original_file"] = {
                    "name": os.path.basename(original_file),
                    "path": original_file,
                    "type": response.get("file_type", "unknown")
                }
            
            # Add plagiarism check if available
            if "plagiarism_check" in response:
                complete_response["plagiarism_check"] = response["plagiarism_check"]
            
            # Save as JSON
            import json
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(complete_response, f, indent=2, ensure_ascii=False)
            
            logging.info(f"Successfully saved response to {filename}")
            return filename
        except Exception as e:
            logging.error(f"Error while saving response: {str(e)}")
            logging.error(f"Traceback: {traceback.format_exc()}")
            return None

async def main():
    try:
        logging.info("Starting AssignmentAI")
        
        # Create an ArgumentParser object with a description
        parser = argparse.ArgumentParser(description='Enhanced Assignment Helper')
        
        # Add arguments
        parser.add_argument('--subject', required=True, help='Subject of the assignment')
        parser.add_argument('--grade', required=True, help='Grade level')
        parser.add_argument('--assignment', required=True, help='Assignment text or file path')
        parser.add_argument('--type', help='Assignment type (optional)')
        parser.add_argument('--context', help='Additional context in JSON format (optional)')
        parser.add_argument('--is-file', action='store_true', help='Treat assignment as file path')
        
        # Parse the arguments
        args = parser.parse_args()
        logging.info(f"Parsed arguments: subject={args.subject}, grade={args.grade}")
        
        # Load additional context if provided
        additional_context = None
        if args.context:
            try:
                import json
                with open(args.context, 'r') as f:
                    additional_context = json.load(f)
            except Exception as e:
                logging.warning(f"Failed to load additional context: {e}")
        
        # Initialize the automator
        try:
            automator = AssignmentAutomator()
        except Exception as e:
            logging.error(f"Failed to initialize AssignmentAutomator: {str(e)}")
            sys.exit(1)
        
        # Process assignment
        logging.info("Processing assignment")
        response = await automator.process_assignment(
            assignment_input=args.assignment,
            subject=args.subject,
            grade_level=args.grade,
            assignment_type=args.type,
            additional_context=additional_context,
            is_file=args.is_file
        )
        
        if "error" in response:
            logging.error(f"Error in processing: {response['error']}")
            sys.exit(1)
        
        # Print the response
        print("\nAssignment Response:")
        print("-" * 50)
        print(response["response"])
        print("\nKey Points:")
        for point in response.get("key_points", []):
            print(f"- {point}")
        
        if response.get("citations"):
            print("\nCitations:")
            for citation in response["citations"]:
                print(f"- {citation['text']}")
        
        if response.get("plagiarism_check"):
            print("\nPlagiarism Check:")
            print(f"Risk Level: {response['plagiarism_check']['risk_level']}")
            print("Recommendations:")
            for rec in response['plagiarism_check']['recommendations']:
                print(f"- {rec}")
        
        print(f"\nResponse saved to: {response['saved_file']}")
        logging.info("Assignment processing completed successfully")

    except KeyboardInterrupt:
        logging.info("Operation cancelled by user")
        print("\nOperation cancelled by user")
        sys.exit(0)
    except Exception as e:
        logging.error(f"An unexpected error occurred: {str(e)}")
        logging.error(f"Traceback: {traceback.format_exc()}")
        print(f"An unexpected error occurred: {str(e)}")
        print("Check assignment_debug.log for more details")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
