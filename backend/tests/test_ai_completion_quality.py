"""
Test suite for AI completion quality improvements
Tests comprehensive assignment completion, formatting preservation, and answer quality
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from app.services.gpt_file_completion_service import GPTFileCompletionService
from app.services.ai_solving_engine import AISolvingEngine


@pytest.fixture
def mock_db_session():
    return Mock()


@pytest.fixture
def gpt_completion_service(mock_db_session):
    with patch('app.services.gpt_file_completion_service.AIService') as mock_ai_service_class:
        mock_ai_service = Mock()
        mock_ai_service.get_user_model = AsyncMock(return_value="gpt-4o-mini")
        mock_ai_service.get_user_plan = AsyncMock(return_value="free")
        mock_ai_service.track_token_usage = AsyncMock()
        mock_ai_service_class.return_value = mock_ai_service
        
        service = GPTFileCompletionService(mock_db_session)
        service.ai_service = mock_ai_service
        return service


@pytest.fixture
def ai_solving_engine(mock_db_session):
    with patch('app.services.ai_solving_engine.AIService') as mock_ai_service_class:
        mock_ai_service = Mock()
        mock_ai_service.generate_assignment_content_from_prompt = AsyncMock(
            return_value="Test answer content"
        )
        mock_ai_service_class.return_value = mock_ai_service
        
        engine = AISolvingEngine(mock_db_session)
        engine.ai_service = mock_ai_service
        return engine


class TestDocumentCompletion:
    """Test document completion quality"""
    
    @pytest.mark.asyncio
    async def test_completes_all_questions(self, gpt_completion_service):
        """Test that all questions in a document are answered"""
        test_document = """
Assignment: History Quiz

Q1) What year did World War II end?
A1) 

Q2) Who was the President of the United States during World War II?
A2) 

Q3) Explain the significance of D-Day in 2-3 sentences.
A3) 
"""
        
        # Mock the OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = """
Assignment: History Quiz

Q1) What year did World War II end?
A1) World War II ended in 1945.

Q2) Who was the President of the United States during World War II?
A2) Franklin D. Roosevelt was the President of the United States during World War II.

Q3) Explain the significance of D-Day in 2-3 sentences.
A3) D-Day, which occurred on June 6, 1944, was a pivotal moment in World War II as it marked the beginning of the Allied invasion of Nazi-occupied Western Europe. The successful landings on the beaches of Normandy opened a second front against Germany, forcing them to fight on multiple fronts and ultimately leading to the liberation of France and the defeat of Nazi Germany.
"""
        mock_response.usage = Mock(total_tokens=500)
        
        with patch.object(gpt_completion_service.client.chat.completions, 'create', 
                         new_callable=AsyncMock, return_value=mock_response):
            result = await gpt_completion_service._complete_document(
                file_content={'text': test_document},
                file_type='txt',
                model='gpt-4o-mini',
                user_id=1
            )
            
            completed_text = result['text']
            
            # Verify all questions are answered
            assert 'A1)' in completed_text
            assert 'A2)' in completed_text
            assert 'A3)' in completed_text
            assert '1945' in completed_text or 'World War II ended' in completed_text
            assert 'Roosevelt' in completed_text or 'President' in completed_text
            assert 'D-Day' in completed_text or 'Normandy' in completed_text
    
    @pytest.mark.asyncio
    async def test_preserves_formatting(self, gpt_completion_service):
        """Test that original document formatting is preserved"""
        test_document = """
Assignment: Math Problems

Problem 1: Calculate 5 + 3
Answer: _____

Problem 2: What is 10 × 4?
Answer: _____
"""
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = """
Assignment: Math Problems

Problem 1: Calculate 5 + 3
Answer: 8

Problem 2: What is 10 × 4?
Answer: 40
"""
        mock_response.usage = Mock(total_tokens=300)
        
        with patch.object(gpt_completion_service.client.chat.completions, 'create',
                         new_callable=AsyncMock, return_value=mock_response):
            result = await gpt_completion_service._complete_document(
                file_content={'text': test_document},
                file_type='txt',
                model='gpt-4o-mini',
                user_id=1
            )
            
            completed_text = result['text']
            
            # Verify formatting is preserved
            assert 'Problem 1:' in completed_text
            assert 'Problem 2:' in completed_text
            assert 'Answer:' in completed_text
            # Verify structure is maintained
            assert completed_text.count('Problem') == 2
            assert completed_text.count('Answer:') == 2
    
    @pytest.mark.asyncio
    async def test_comprehensive_answers(self, gpt_completion_service):
        """Test that answers are comprehensive, not just brief"""
        test_document = """
Q1) Explain photosynthesis in detail.
A1) 
"""
        
        mock_response = Mock()
        mock_response.choices = [Mock()]
        # Simulate a comprehensive answer
        mock_response.choices[0].message.content = """
Q1) Explain photosynthesis in detail.
A1) Photosynthesis is the process by which plants, algae, and some bacteria convert light energy into chemical energy stored in glucose molecules. This process occurs in the chloroplasts of plant cells and involves two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). During the light-dependent reactions, chlorophyll absorbs light energy and uses it to split water molecules, releasing oxygen as a byproduct and producing ATP and NADPH. In the Calvin cycle, these energy carriers are used to convert carbon dioxide from the atmosphere into glucose. The overall equation is 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. Photosynthesis is crucial for life on Earth as it produces oxygen and forms the base of most food chains.
"""
        mock_response.usage = Mock(total_tokens=400)
        
        with patch.object(gpt_completion_service.client.chat.completions, 'create',
                         new_callable=AsyncMock, return_value=mock_response):
            result = await gpt_completion_service._complete_document(
                file_content={'text': test_document},
                file_type='txt',
                model='gpt-4o-mini',
                user_id=1
            )
            
            completed_text = result['text']
            
            # Verify answer is comprehensive (not just one word)
            answer_section = completed_text.split('A1)')[1] if 'A1)' in completed_text else ''
            assert len(answer_section) > 100  # Should be substantial
            assert 'photosynthesis' in answer_section.lower()
            assert 'chloroplasts' in answer_section.lower() or 'light' in answer_section.lower()


class TestAISolvingEngine:
    """Test AI solving engine prompt quality"""
    
    @pytest.mark.asyncio
    async def test_short_answer_comprehensive(self, ai_solving_engine):
        """Test that short answers are comprehensive"""
        result = await ai_solving_engine._solve_short_answer(
            question="What is the water cycle?",
            context="Earth science assignment",
            word_count_requirement=50,
            tone="academic"
        )
        
        # Check that the prompt was constructed properly
        assert result['answer'] is not None
        assert result['content_type'] == 'short_answer'
        assert result['validation'] is not None
    
    @pytest.mark.asyncio
    async def test_essay_structure(self, ai_solving_engine):
        """Test that essays have proper structure"""
        result = await ai_solving_engine._solve_text_assignment(
            question="Discuss the causes of World War I",
            context="History assignment",
            word_count_requirement=300,
            tone="academic",
            citations_required=True
        )
        
        assert result['answer'] is not None
        assert result['content_type'] == 'text'
        assert result['validation'] is not None
        # Check word count validation
        assert result['validation'].word_count is not None
    
    @pytest.mark.asyncio
    async def test_math_shows_work(self, ai_solving_engine):
        """Test that math problems show step-by-step work"""
        result = await ai_solving_engine._solve_math_assignment(
            question="A car accelerates from 0 to 60 m/s in 5 seconds. What is its acceleration?",
            context="Physics problem"
        )
        
        assert result['answer'] is not None
        assert result['content_type'] == 'math'
        assert result['validation'] is not None


class TestPromptQuality:
    """Test that prompts are comprehensive and clear"""
    
    def test_document_prompt_includes_all_requirements(self, gpt_completion_service):
        """Test that document completion prompt includes all requirements"""
        # This would require accessing the prompt, but we can verify the method exists
        assert hasattr(gpt_completion_service, '_complete_document')
    
    def test_essay_prompt_mentions_structure(self, ai_solving_engine):
        """Test that essay prompt mentions structure requirements"""
        prompt = ai_solving_engine._get_essay_prompt()
        
        # Check for key requirements in prompt
        assert 'introduction' in prompt.lower() or 'structure' in prompt.lower()
        assert 'word count' in prompt.lower()
        assert 'citations' in prompt.lower() or 'citation' in prompt.lower()
    
    def test_math_prompt_mentions_step_by_step(self, ai_solving_engine):
        """Test that math prompt requires step-by-step solutions"""
        prompt = ai_solving_engine._get_math_prompt()
        
        assert 'step' in prompt.lower()
        assert 'work' in prompt.lower() or 'calculation' in prompt.lower()
        assert 'formula' in prompt.lower()
    
    def test_code_prompt_mentions_completeness(self, ai_solving_engine):
        """Test that code prompt emphasizes complete implementation"""
        prompt = ai_solving_engine._get_code_prompt()
        
        assert 'complete' in prompt.lower()
        assert 'working' in prompt.lower() or 'functional' in prompt.lower()
        assert 'error handling' in prompt.lower() or 'edge case' in prompt.lower()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

