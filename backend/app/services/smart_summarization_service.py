from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger
import json
import re


class SmartSummarizationService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        # Use GPT-4 Turbo for better summarization capabilities and cost efficiency
        self.model = "gpt-4-turbo-preview"
        
    async def summarize_content(
        self, 
        content: str, 
        summary_type: str = "comprehensive",
        max_length: Optional[int] = None,
        include_insights: bool = True
    ) -> Dict[str, Any]:
        """
        Generate intelligent content summarization with key insights.
        
        Args:
            content: The content to summarize
            summary_type: Type of summary ("comprehensive", "executive", "bullet_points", "key_insights")
            max_length: Maximum length of summary (optional)
            include_insights: Whether to include key insights
            
        Returns:
            Dictionary containing summary and metadata
        """
        try:
            # Determine summary length based on content length
            if max_length is None:
                content_length = len(content)
                if content_length < 1000:
                    max_length = 200
                elif content_length < 5000:
                    max_length = 400
                else:
                    max_length = 600
            
            # Create system prompt based on summary type
            system_prompt = self._create_system_prompt(summary_type, include_insights)
            
            # Create user prompt
            user_prompt = f"""
            Please summarize the following content:
            
            {content}
            
            Requirements:
            - Summary type: {summary_type}
            - Maximum length: {max_length} words
            - Include key insights: {include_insights}
            """
            
            # Generate summary
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_completion_tokens=max_length * 2,  # Allow for some flexibility
                temperature=0.3,
                top_p=0.9
            )
            
            summary_text = response.choices[0].message.content
            
            # Extract insights if requested
            insights = []
            if include_insights:
                insights = await self._extract_key_insights(content, summary_text)
            
            # Calculate metrics
            metrics = self._calculate_summary_metrics(content, summary_text)
            
            return {
                "summary": summary_text,
                "insights": insights,
                "metrics": metrics,
                "summary_type": summary_type,
                "original_length": len(content),
                "summary_length": len(summary_text),
                "compression_ratio": len(summary_text) / len(content) if len(content) > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error in smart summarization: {str(e)}")
            raise Exception(f"Failed to generate summary: {str(e)}")
    
    def _create_system_prompt(self, summary_type: str, include_insights: bool) -> str:
        """Create system prompt based on summary type."""
        base_prompt = "You are an expert content analyst specializing in intelligent summarization."
        
        if summary_type == "comprehensive":
            return f"{base_prompt} Create a comprehensive summary that captures all key points, main arguments, and important details while maintaining clarity and coherence."
        elif summary_type == "executive":
            return f"{base_prompt} Create an executive summary that highlights the most important findings, conclusions, and actionable insights for decision-makers."
        elif summary_type == "bullet_points":
            return f"{base_prompt} Create a structured summary using bullet points to highlight key information, main points, and important details."
        elif summary_type == "key_insights":
            return f"{base_prompt} Focus on extracting the most valuable insights, novel findings, and key takeaways from the content."
        else:
            return f"{base_prompt} Create a clear, concise summary that captures the essential information."
    
    async def _extract_key_insights(self, content: str, summary: str) -> List[str]:
        """Extract key insights from the content and summary."""
        try:
            prompt = f"""
            Based on the following content and summary, extract 3-5 key insights:
            
            Content: {content[:2000]}  # Limit content length
            
            Summary: {summary}
            
            Please provide insights that are:
            1. Actionable and practical
            2. Novel or surprising
            3. Important for understanding the topic
            4. Relevant for decision-making
            
            Format as a list of insights.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at extracting key insights from content."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=300,
                temperature=0.4
            )
            
            insights_text = response.choices[0].message.content
            
            # Parse insights into list
            insights = []
            lines = insights_text.split('\n')
            for line in lines:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or line.startswith('*') or line[0].isdigit()):
                    # Remove bullet points and numbers
                    insight = re.sub(r'^[-•*\d\.\s]+', '', line)
                    if insight:
                        insights.append(insight)
            
            return insights[:5]  # Limit to 5 insights
            
        except Exception as e:
            logger.error(f"Error extracting insights: {str(e)}")
            return []
    
    def _calculate_summary_metrics(self, original_content: str, summary: str) -> Dict[str, Any]:
        """Calculate various metrics for the summary."""
        try:
            # Basic metrics
            original_words = len(original_content.split())
            summary_words = len(summary.split())
            
            # Calculate compression ratio
            compression_ratio = summary_words / original_words if original_words > 0 else 0
            
            # Calculate information density (approximate)
            # This is a simple heuristic - in a real implementation, you might use more sophisticated NLP
            info_density = len(summary) / summary_words if summary_words > 0 else 0
            
            # Calculate readability (Flesch Reading Ease approximation)
            sentences = len(re.split(r'[.!?]+', summary))
            syllables = self._count_syllables(summary)
            flesch_score = 206.835 - (1.015 * (summary_words / sentences)) - (84.6 * (syllables / summary_words)) if sentences > 0 and summary_words > 0 else 0
            
            return {
                "original_words": original_words,
                "summary_words": summary_words,
                "compression_ratio": compression_ratio,
                "information_density": info_density,
                "readability_score": max(0, min(100, flesch_score)),
                "readability_level": self._get_readability_level(flesch_score)
            }
            
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            return {}
    
    def _count_syllables(self, text: str) -> int:
        """Approximate syllable count for readability calculation."""
        # Simple syllable counting heuristic
        text = text.lower()
        count = 0
        vowels = "aeiouy"
        on_vowel = False
        
        for char in text:
            is_vowel = char in vowels
            if is_vowel and not on_vowel:
                count += 1
            on_vowel = is_vowel
        
        return max(1, count)
    
    def _get_readability_level(self, flesch_score: float) -> str:
        """Get readability level based on Flesch score."""
        if flesch_score >= 90:
            return "Very Easy"
        elif flesch_score >= 80:
            return "Easy"
        elif flesch_score >= 70:
            return "Fairly Easy"
        elif flesch_score >= 60:
            return "Standard"
        elif flesch_score >= 50:
            return "Fairly Difficult"
        elif flesch_score >= 30:
            return "Difficult"
        else:
            return "Very Difficult"
    
    async def summarize_multiple_documents(
        self, 
        documents: List[Dict[str, Any]], 
        summary_type: str = "comprehensive"
    ) -> Dict[str, Any]:
        """
        Summarize multiple documents and provide comparative analysis.
        
        Args:
            documents: List of documents with 'content' and 'title' keys
            summary_type: Type of summary to generate
            
        Returns:
            Dictionary containing individual summaries and comparative analysis
        """
        try:
            individual_summaries = []
            
            # Generate individual summaries
            for doc in documents:
                summary = await self.summarize_content(
                    doc['content'], 
                    summary_type=summary_type,
                    include_insights=True
                )
                individual_summaries.append({
                    "title": doc.get('title', 'Untitled'),
                    "summary": summary
                })
            
            # Generate comparative analysis
            comparative_analysis = await self._generate_comparative_analysis(individual_summaries)
            
            return {
                "individual_summaries": individual_summaries,
                "comparative_analysis": comparative_analysis,
                "total_documents": len(documents),
                "summary_type": summary_type
            }
            
        except Exception as e:
            logger.error(f"Error in multi-document summarization: {str(e)}")
            raise Exception(f"Failed to summarize multiple documents: {str(e)}")
    
    async def _generate_comparative_analysis(self, summaries: List[Dict[str, Any]]) -> str:
        """Generate comparative analysis of multiple summaries."""
        try:
            # Create a combined prompt for comparison
            comparison_prompt = "Please provide a comparative analysis of the following summaries:\n\n"
            
            for i, summary_data in enumerate(summaries, 1):
                comparison_prompt += f"Document {i}: {summary_data['title']}\n"
                comparison_prompt += f"Summary: {summary_data['summary']['summary']}\n"
                comparison_prompt += f"Key Insights: {', '.join(summary_data['summary']['insights'])}\n\n"
            
            comparison_prompt += "Please analyze:\n1. Common themes across documents\n2. Key differences\n3. Overall conclusions\n4. Recommendations"
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert analyst specializing in comparative document analysis."},
                    {"role": "user", "content": comparison_prompt}
                ],
                max_completion_tokens=500,
                temperature=0.4
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating comparative analysis: {str(e)}")
            return "Unable to generate comparative analysis."
