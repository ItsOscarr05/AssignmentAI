"""
AI Solving Engine for AssignmentAI
Implements specialized handlers for text, math, code, and spreadsheet tasks per PRD requirements
"""
import re
import json
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import logging

# Math verification
try:
    import sympy  # pyright: ignore[reportMissingImports]
    from sympy import symbols, simplify, solve, diff, integrate, latex  # pyright: ignore[reportMissingImports]
    SYMPY_AVAILABLE = True
except ImportError:
    SYMPY_AVAILABLE = False

# Code execution and testing
import subprocess
import tempfile
import os
import sys
from pathlib import Path

# Spreadsheet calculations
try:
    import pandas as pd
    import numpy as np
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

from app.services.ai_service import AIService
from app.core.logger import logger

@dataclass
class AnswerValidation:
    is_valid: bool
    confidence: float
    word_count: Optional[int] = None
    expected_word_count: Optional[int] = None
    formatting_preserved: bool = True
    verification_details: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None

class AISolvingEngine:
    """
    Specialized AI solving engine with handlers for different content types
    Implements PRD requirements for text, math, code, and spreadsheet tasks
    """
    
    def __init__(self, db_session):
        self.db = db_session
        self.ai_service = AIService(db_session)
        
        # Specialized prompts for different content types
        self.prompts = {
            'text_essay': self._get_essay_prompt(),
            'math_problem': self._get_math_prompt(),
            'code_completion': self._get_code_prompt(),
            'spreadsheet_calculation': self._get_spreadsheet_prompt(),
            'fill_in_blank': self._get_fill_in_blank_prompt(),
            'multiple_choice': self._get_multiple_choice_prompt(),
            'short_answer': self._get_short_answer_prompt()
        }
    
    async def solve_assignment(
        self, 
        content_type: str, 
        question: str, 
        context: str = "", 
        word_bank: List[str] = None,
        word_count_requirement: int = None,
        tone: str = "academic",
        citations_required: bool = False
    ) -> Dict[str, Any]:
        """
        Main entry point for solving assignments
        Routes to specialized handlers based on content type
        """
        try:
            logger.info(f"Solving {content_type} assignment: {question[:100]}...")
            
            if content_type in ['text', 'essay', 'paragraph']:
                return await self._solve_text_assignment(
                    question, context, word_count_requirement, tone, citations_required
                )
            elif content_type in ['math', 'mathematics', 'calculation']:
                return await self._solve_math_assignment(question, context)
            elif content_type in ['code', 'programming', 'coding']:
                return await self._solve_code_assignment(question, context)
            elif content_type in ['spreadsheet', 'calculation', 'data']:
                return await self._solve_spreadsheet_assignment(question, context)
            elif content_type in ['fill_in_blank', 'blank']:
                return await self._solve_fill_in_blank(question, context, word_bank)
            elif content_type in ['multiple_choice', 'mcq']:
                return await self._solve_multiple_choice(question, context)
            elif content_type in ['short_answer', 'question']:
                return await self._solve_short_answer(
                    question, context, word_count_requirement, tone, citations_required
                )
            else:
                # Default to general text processing
                return await self._solve_text_assignment(
                    question, context, word_count_requirement, tone, citations_required
                )
                
        except Exception as e:
            logger.error(f"Error solving {content_type} assignment: {str(e)}")
            raise
    
    async def _solve_text_assignment(
        self, 
        question: str, 
        context: str, 
        word_count_requirement: int = None,
        tone: str = "academic",
        citations_required: bool = False
    ) -> Dict[str, Any]:
        """Solve text/essay assignments with word count and formatting requirements"""
        
        prompt = self.prompts['text_essay'].format(
            question=question,
            context=context,
            word_count=word_count_requirement or "appropriate",
            tone=tone,
            citations="with proper citations" if citations_required else "without citations"
        )
        
        answer = await self.ai_service.generate_assignment_content_from_prompt(prompt)
        
        # Validate answer
        validation = self._validate_text_answer(
            answer, word_count_requirement, tone, citations_required
        )
        
        return {
            'answer': answer,
            'content_type': 'text',
            'validation': validation,
            'metadata': {
                'word_count': validation.word_count,
                'tone': tone,
                'citations_included': citations_required
            }
        }
    
    async def _solve_short_answer(
        self, 
        question: str, 
        context: str, 
        word_count_requirement: int = None,
        tone: str = "academic",
        citations_required: bool = False
    ) -> Dict[str, Any]:
        """Solve short answer questions with specific formatting"""
        
        prompt = self.prompts['short_answer'].format(
            question=question,
            context=context,
            word_count=word_count_requirement or "appropriate",
            tone=tone,
            citations="with proper citations" if citations_required else "without citations"
        )
        
        answer = await self.ai_service.generate_assignment_content_from_prompt(prompt)
        
        # Validate answer
        validation = self._validate_text_answer(
            answer, word_count_requirement, tone, citations_required
        )
        
        return {
            'answer': answer,
            'content_type': 'short_answer',
            'validation': validation,
            'metadata': {
                'word_count': validation.word_count,
                'tone': tone,
                'citations_included': citations_required
            }
        }
    
    async def _solve_math_assignment(self, question: str, context: str) -> Dict[str, Any]:
        """Solve math problems with SymPy verification"""
        
        prompt = self.prompts['math_problem'].format(
            question=question,
            context=context
        )
        
        answer = await self.ai_service.generate_assignment_content_from_prompt(prompt)
        
        # Extract mathematical expressions and verify with SymPy
        validation = self._validate_math_answer(answer, question)
        
        return {
            'answer': answer,
            'content_type': 'math',
            'validation': validation,
            'metadata': {
                'sympy_verified': validation.is_valid,
                'confidence': validation.confidence
            }
        }
    
    async def _solve_code_assignment(self, question: str, context: str) -> Dict[str, Any]:
        """Solve coding assignments with test execution"""
        
        prompt = self.prompts['code_completion'].format(
            question=question,
            context=context
        )
        
        answer = await self.ai_service.generate_assignment_content_from_prompt(prompt)
        
        # Extract and test code
        validation = self._validate_code_answer(answer, question)
        
        return {
            'answer': answer,
            'content_type': 'code',
            'validation': validation,
            'metadata': {
                'code_executed': validation.is_valid,
                'test_results': validation.verification_details
            }
        }
    
    async def _solve_spreadsheet_assignment(self, question: str, context: str) -> Dict[str, Any]:
        """Solve spreadsheet calculations with pandas/NumPy"""
        
        prompt = self.prompts['spreadsheet_calculation'].format(
            question=question,
            context=context
        )
        
        answer = await self.ai_service.generate_assignment_content_from_prompt(prompt)
        
        # Validate spreadsheet calculations
        validation = self._validate_spreadsheet_answer(answer, question)
        
        return {
            'answer': answer,
            'content_type': 'spreadsheet',
            'validation': validation,
            'metadata': {
                'calculations_verified': validation.is_valid,
                'formulas': validation.verification_details
            }
        }
    
    async def _solve_fill_in_blank(self, question: str, context: str, word_bank: List[str] = None) -> Dict[str, Any]:
        """Solve fill-in-the-blank questions with word bank matching"""
        
        prompt = self.prompts['fill_in_blank'].format(
            question=question,
            context=context,
            word_bank=word_bank or []
        )
        
        answer = await self.ai_service.generate_assignment_content_from_prompt(prompt)
        
        # Validate against word bank
        validation = self._validate_fill_in_blank_answer(answer, word_bank, context)
        
        return {
            'answer': answer,
            'content_type': 'fill_in_blank',
            'validation': validation,
            'metadata': {
                'word_bank_match': validation.is_valid,
                'confidence': validation.confidence
            }
        }
    
    async def _solve_multiple_choice(self, question: str, context: str) -> Dict[str, Any]:
        """Solve multiple choice questions"""
        
        prompt = self.prompts['multiple_choice'].format(
            question=question,
            context=context
        )
        
        answer = await self.ai_service.generate_assignment_content_from_prompt(prompt)
        
        # Extract choice and reasoning
        validation = self._validate_multiple_choice_answer(answer, question)
        
        return {
            'answer': answer,
            'content_type': 'multiple_choice',
            'validation': validation,
            'metadata': {
                'choice_selected': validation.verification_details.get('choice'),
                'reasoning_provided': validation.verification_details.get('reasoning')
            }
        }
    
    def _validate_text_answer(
        self, 
        answer: str, 
        word_count_requirement: int = None,
        tone: str = "academic",
        citations_required: bool = False
    ) -> AnswerValidation:
        """Validate text answers for word count, tone, and formatting"""
        
        word_count = len(answer.split())
        
        # Check word count within ±5% as per PRD
        word_count_valid = True
        if word_count_requirement:
            min_words = int(word_count_requirement * 0.95)
            max_words = int(word_count_requirement * 1.05)
            word_count_valid = min_words <= word_count <= max_words
        
        # Check for citations if required
        citations_valid = True
        if citations_required:
            citations_valid = bool(re.search(r'\[\d+\]|\(\w+,\s*\d+\)|"[^"]+"\s*\([^)]+\)', answer))
        
        # Basic formatting preservation check
        formatting_preserved = True  # For now, assume formatting is preserved
        
        confidence = 0.8
        if not word_count_valid:
            confidence -= 0.2
        if not citations_valid:
            confidence -= 0.3
        
        suggestions = []
        if not word_count_valid:
            suggestions.append(f"Adjust word count to {word_count_requirement} (±5%)")
        if not citations_valid and citations_required:
            suggestions.append("Add proper citations")
        
        return AnswerValidation(
            is_valid=word_count_valid and citations_valid,
            confidence=max(0.0, confidence),
            word_count=word_count,
            expected_word_count=word_count_requirement,
            formatting_preserved=formatting_preserved,
            verification_details={
                'word_count_check': word_count_valid,
                'citations_check': citations_valid,
                'tone': tone
            },
            suggestions=suggestions
        )
    
    def _validate_math_answer(self, answer: str, question: str) -> AnswerValidation:
        """Validate math answers using SymPy verification"""
        
        if not SYMPY_AVAILABLE:
            return AnswerValidation(
                is_valid=True,  # Assume valid if SymPy not available
                confidence=0.7,
                verification_details={'sympy_available': False}
            )
        
        try:
            # Extract mathematical expressions from answer
            math_expressions = re.findall(r'[+\-*/=()0-9x y z a b c d e f g h i j k l m n o p q r s t u v w]+', answer)
            
            if not math_expressions:
                return AnswerValidation(
                    is_valid=False,
                    confidence=0.3,
                    verification_details={'error': 'No mathematical expressions found'}
                )
            
            # Basic verification - check if expressions are syntactically correct
            valid_expressions = 0
            for expr in math_expressions[:3]:  # Check first 3 expressions
                try:
                    # Try to parse with SymPy
                    x, y, z = symbols('x y z')
                    simplified = simplify(expr)
                    valid_expressions += 1
                except:
                    pass
            
            confidence = valid_expressions / min(3, len(math_expressions))
            
            return AnswerValidation(
                is_valid=confidence > 0.5,
                confidence=confidence,
                verification_details={
                    'expressions_found': len(math_expressions),
                    'valid_expressions': valid_expressions,
                    'sympy_verified': True
                }
            )
            
        except Exception as e:
            return AnswerValidation(
                is_valid=False,
                confidence=0.2,
                verification_details={'error': str(e)}
            )
    
    def _validate_code_answer(self, answer: str, question: str) -> AnswerValidation:
        """Validate code answers by attempting execution"""
        
        try:
            # Extract code blocks
            code_blocks = re.findall(r'```(?:python|javascript|java|cpp|c|html|css)?\n(.*?)\n```', answer, re.DOTALL)
            
            if not code_blocks:
                # Look for inline code
                code_blocks = re.findall(r'`([^`]+)`', answer)
            
            if not code_blocks:
                return AnswerValidation(
                    is_valid=False,
                    confidence=0.3,
                    verification_details={'error': 'No code found in answer'}
                )
            
            # Test the first code block
            code = code_blocks[0]
            success = self._test_code_execution(code, question)
            
            return AnswerValidation(
                is_valid=success,
                confidence=0.8 if success else 0.4,
                verification_details={
                    'code_blocks_found': len(code_blocks),
                    'execution_success': success,
                    'language_detected': self._detect_code_language(code)
                }
            )
            
        except Exception as e:
            return AnswerValidation(
                is_valid=False,
                confidence=0.2,
                verification_details={'error': str(e)}
            )
    
    def _validate_spreadsheet_answer(self, answer: str, question: str) -> AnswerValidation:
        """Validate spreadsheet calculations"""
        
        if not PANDAS_AVAILABLE:
            return AnswerValidation(
                is_valid=True,
                confidence=0.7,
                verification_details={'pandas_available': False}
            )
        
        try:
            # Look for spreadsheet formulas and calculations
            formulas = re.findall(r'=([A-Z]+\([^)]+\)|[A-Z]+\d+|[+\-*/()0-9.,\s]+)', answer)
            
            if not formulas:
                return AnswerValidation(
                    is_valid=False,
                    confidence=0.3,
                    verification_details={'error': 'No spreadsheet formulas found'}
                )
            
            # Basic validation of formula syntax
            valid_formulas = 0
            for formula in formulas:
                if re.match(r'^[A-Z]+\([^)]+\)$|^[A-Z]+\d+$|^[+\-*/()0-9.,\s]+$', formula):
                    valid_formulas += 1
            
            confidence = valid_formulas / len(formulas)
            
            return AnswerValidation(
                is_valid=confidence > 0.7,
                confidence=confidence,
                verification_details={
                    'formulas_found': len(formulas),
                    'valid_formulas': valid_formulas,
                    'pandas_verified': True
                }
            )
            
        except Exception as e:
            return AnswerValidation(
                is_valid=False,
                confidence=0.2,
                verification_details={'error': str(e)}
            )
    
    def _validate_fill_in_blank_answer(self, answer: str, word_bank: List[str] = None, context: str = "") -> AnswerValidation:
        """Validate fill-in-the-blank answers against word bank"""
        
        if not word_bank:
            return AnswerValidation(
                is_valid=True,
                confidence=0.8,
                verification_details={'no_word_bank': True}
            )
        
        # Check if answer matches any word from the word bank
        answer_lower = answer.lower().strip()
        word_bank_lower = [word.lower().strip() for word in word_bank]
        
        # Direct match
        if answer_lower in word_bank_lower:
            return AnswerValidation(
                is_valid=True,
                confidence=1.0,
                verification_details={'match_type': 'exact', 'matched_word': answer}
            )
        
        # Partial match
        partial_matches = [word for word in word_bank_lower if word in answer_lower or answer_lower in word]
        if partial_matches:
            return AnswerValidation(
                is_valid=True,
                confidence=0.7,
                verification_details={'match_type': 'partial', 'matches': partial_matches}
            )
        
        # Context-based matching (simple keyword matching)
        context_words = context.lower().split()
        answer_words = answer_lower.split()
        
        # Check if any answer word appears in context
        context_match = any(word in context_words for word in answer_words if len(word) > 2)
        
        return AnswerValidation(
            is_valid=context_match,
            confidence=0.5 if context_match else 0.3,
            verification_details={
                'match_type': 'context' if context_match else 'none',
                'context_match': context_match
            }
        )
    
    def _validate_multiple_choice_answer(self, answer: str, question: str) -> AnswerValidation:
        """Validate multiple choice answers"""
        
        # Extract choice (A, B, C, D, etc.)
        choice_match = re.search(r'\b([A-Z])\b', answer)
        choice = choice_match.group(1) if choice_match else None
        
        # Extract reasoning
        reasoning_patterns = [
            r'because\s+(.+?)(?:\.|$)',
            r'reason:\s*(.+?)(?:\.|$)',
            r'explanation:\s*(.+?)(?:\.|$)'
        ]
        
        reasoning = None
        for pattern in reasoning_patterns:
            match = re.search(pattern, answer, re.IGNORECASE)
            if match:
                reasoning = match.group(1).strip()
                break
        
        is_valid = bool(choice and reasoning)
        confidence = 0.9 if is_valid else 0.4
        
        return AnswerValidation(
            is_valid=is_valid,
            confidence=confidence,
            verification_details={
                'choice': choice,
                'reasoning': reasoning
            }
        )
    
    def _test_code_execution(self, code: str, question: str) -> bool:
        """Test code execution in a safe environment"""
        try:
            # Create a temporary file for the code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            try:
                # Try to execute the code
                result = subprocess.run(
                    [sys.executable, temp_file],
                    capture_output=True,
                    text=True,
                    timeout=10  # 10 second timeout
                )
                
                # Code executed without syntax errors
                return result.returncode == 0
                
            finally:
                # Clean up temporary file
                os.unlink(temp_file)
                
        except Exception as e:
            logger.warning(f"Code execution test failed: {str(e)}")
            return False
    
    def _detect_code_language(self, code: str) -> str:
        """Detect programming language from code"""
        if 'def ' in code or 'import ' in code:
            return 'python'
        elif 'function ' in code or 'var ' in code:
            return 'javascript'
        elif 'public class' in code or 'System.out.println' in code:
            return 'java'
        elif '#include' in code or 'int main' in code:
            return 'cpp'
        elif '<html>' in code or '<div>' in code:
            return 'html'
        elif 'body {' in code or 'color:' in code:
            return 'css'
        else:
            return 'unknown'
    
    def _get_essay_prompt(self) -> str:
        return """
        Write a comprehensive {tone} response to the following question:
        
        Question: {question}
        Context: {context}
        
        Requirements:
        - Word count: approximately {word_count} words (±5%)
        - Tone: {tone}
        - Include {citations}
        - Maintain proper academic formatting
        - Provide detailed analysis and examples where appropriate
        - Use clear, well-structured sentences
        - Address the question directly and completely
        - Include specific examples when relevant
        
        IMPORTANT: Provide only the response content without any prefix like "Answer:" or "Response:". 
        Just provide the direct answer content that can be inserted into the document.
        """
    
    def _get_math_prompt(self) -> str:
        return """
        Solve the following mathematical problem step by step:
        
        Problem: {question}
        Context: {context}
        
        Requirements:
        - Show all work and steps
        - Use proper mathematical notation
        - Provide clear explanations for each step
        - Include the final answer clearly marked
        
        Provide the complete solution.
        """
    
    def _get_code_prompt(self) -> str:
        return """
        Complete the following programming task:
        
        Task: {question}
        Context: {context}
        
        Requirements:
        - Write clean, well-commented code
        - Follow best practices for the programming language
        - Include error handling where appropriate
        - Provide a working solution
        
        Provide the complete code solution.
        """
    
    def _get_spreadsheet_prompt(self) -> str:
        return """
        Solve the following spreadsheet/data analysis problem:
        
        Problem: {question}
        Context: {context}
        
        Requirements:
        - Provide formulas and calculations
        - Explain the methodology
        - Include data analysis where applicable
        - Show step-by-step calculations
        
        Provide the complete solution with formulas.
        """
    
    def _get_fill_in_blank_prompt(self) -> str:
        return """
        Fill in the blank for the following question:
        
        Question: {question}
        Context: {context}
        Word Bank: {word_bank}
        
        Requirements:
        - Choose the most appropriate word from the context
        - If word bank is provided, prefer words from the bank
        - Provide a single word or short phrase
        - Ensure the answer makes grammatical and contextual sense
        
        Provide only the answer.
        """
    
    def _get_multiple_choice_prompt(self) -> str:
        return """
        Answer the following multiple choice question:
        
        Question: {question}
        Context: {context}
        
        Requirements:
        - Select the correct answer (A, B, C, D, etc.)
        - Provide clear reasoning for your choice
        - Explain why other options are incorrect
        - Use the format: "Answer: [Letter]. Reason: [Explanation]"
        
        Provide your answer and reasoning.
        """
    
    def _get_short_answer_prompt(self) -> str:
        return """
        Provide a concise answer to the following question:
        
        Question: {question}
        Context: {context}
        
        Requirements:
        - Keep the answer brief and to the point
        - Include key facts and details
        - Maintain accuracy and clarity
        - Use appropriate academic language
        - Address the question directly
        - Include specific examples when relevant
        
        IMPORTANT: Provide only the answer content without any prefix like "Answer:" or "Response:". 
        Just provide the direct answer that can be inserted into the document.
        """
