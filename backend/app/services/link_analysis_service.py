import re
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class LinkAnalysisService:
    """
    Service for comprehensive link content analysis including:
    - Content summarization
    - Key points extraction  
    - Credibility assessment
    - Sentiment analysis
    - Related topics identification
    - Suggested actions generation
    """
    
    def __init__(self):
        self.credibility_indicators = {
            'high': [
                'academic', 'research', 'study', 'university', 'institute',
                'peer-reviewed', 'journal', 'scholarly', 'scientific',
                'government', 'official', 'org', 'edu'
            ],
            'medium': [
                'news', 'article', 'blog', 'analysis', 'opinion',
                'medium', 'substack', 'newsletter'
            ],
            'low': [
                'blogspot', 'wordpress', 'tumblr', 'personal',
                'opinion', 'rant', 'unverified'
            ]
        }
        
        self.content_type_patterns = {
            'academic_paper': [
                'abstract', 'introduction', 'methodology', 'results', 'conclusion',
                'references', 'citations', 'doi:', 'arxiv'
            ],
            'news_article': [
                'breaking', 'reports', 'according to', 'sources say',
                'published', 'journalist', 'correspondent'
            ],
            'blog_post': [
                'in my opinion', 'i think', 'personally', 'experience',
                'thoughts on', 'my take'
            ],
            'tutorial': [
                'step by step', 'how to', 'tutorial', 'guide', 'instructions',
                'follow these', 'first, then', 'next'
            ],
            'research_report': [
                'findings', 'data shows', 'statistics', 'survey', 'research',
                'analysis reveals', 'study found'
            ]
        }
    
    async def analyze_content_comprehensive(
        self, 
        content: str, 
        url: str, 
        ai_service: Any
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of link content.
        """
        try:
            logger.info(f"Starting comprehensive analysis for content length: {len(content)}")
            
            # Basic content metrics
            word_count = len(content.split())
            reading_time = max(1, word_count // 200)  # ~200 words per minute
            
            # Analyze content type
            content_type = self._analyze_content_type(content, url)
            
            # Assess credibility
            credibility_score = self._assess_credibility(content, url)
            
            # Extract key points
            key_points = await self._extract_key_points(content, ai_service)
            
            # Generate summary
            summary = await self._generate_summary(content, ai_service)
            
            # Analyze sentiment
            sentiment = await self._analyze_sentiment(content, ai_service)
            
            # Identify related topics
            related_topics = await self._identify_related_topics(content, ai_service)
            
            # Generate suggested actions
            suggested_actions = await self._generate_suggested_actions(
                content, content_type, credibility_score, ai_service
            )
            
            analysis = {
                'summary': summary,
                'keyPoints': key_points,
                'contentType': content_type,
                'credibility': credibility_score,
                'readingTime': reading_time,
                'wordCount': word_count,
                'relatedTopics': related_topics,
                'sentiment': sentiment,
                'suggestedActions': suggested_actions,
                'analyzedAt': datetime.utcnow().isoformat()
            }
            
            logger.info("Comprehensive analysis completed successfully")
            return analysis
            
        except Exception as e:
            logger.error(f"Error in comprehensive analysis: {str(e)}", exc_info=True)
            raise
    
    def _analyze_content_type(self, content: str, url: str) -> str:
        """Analyze the type of content based on patterns and URL."""
        content_lower = content.lower()
        url_lower = url.lower()
        
        # Check URL patterns first
        if any(domain in url_lower for domain in ['.edu', 'arxiv.org', 'scholar.google']):
            return 'academic_paper'
        elif any(domain in url_lower for domain in ['news', 'cnn', 'bbc', 'reuters', 'ap.org']):
            return 'news_article'
        elif 'github.com' in url_lower:
            return 'code_repository'
        elif 'youtube.com' in url_lower or 'vimeo.com' in url_lower:
            return 'video_content'
        
        # Check content patterns
        for content_type, patterns in self.content_type_patterns.items():
            if sum(1 for pattern in patterns if pattern in content_lower) >= 2:
                return content_type.replace('_', ' ').title()
        
        return 'general_content'
    
    def _assess_credibility(self, content: str, url: str) -> int:
        """Assess credibility score from 1-10 based on content and URL indicators."""
        score = 5  # Base score
        content_lower = content.lower()
        url_lower = url.lower()
        
        # High credibility indicators
        high_indicators = sum(1 for indicator in self.credibility_indicators['high'] 
                            if indicator in content_lower or indicator in url_lower)
        score += min(3, high_indicators * 0.5)
        
        # Medium credibility indicators
        medium_indicators = sum(1 for indicator in self.credibility_indicators['medium'] 
                              if indicator in content_lower or indicator in url_lower)
        score += min(2, medium_indicators * 0.3)
        
        # Low credibility indicators
        low_indicators = sum(1 for indicator in self.credibility_indicators['low'] 
                           if indicator in content_lower or indicator in url_lower)
        score -= min(2, low_indicators * 0.5)
        
        # URL domain analysis
        if any(domain in url_lower for domain in ['.edu', '.gov', '.org']):
            score += 1
        elif any(domain in url_lower for domain in ['.com', '.net']):
            score += 0.5
        
        # Content quality indicators
        if len(content.split()) > 500:  # Substantial content
            score += 0.5
        if 'references' in content_lower or 'citations' in content_lower:
            score += 0.5
        
        return max(1, min(10, int(score)))
    
    async def _extract_key_points(self, content: str, ai_service: Any) -> List[str]:
        """Extract key points from content using AI."""
        try:
            prompt = f"""
            Extract the 5-7 most important key points from the following content.
            Return only the key points, one per line, without numbering or bullets.
            Keep each point concise but informative.
            
            Content:
            {content[:3000]}
            """
            
            response = await ai_service.generate_assignment_content_from_prompt(prompt)
            
            # Parse key points from response
            key_points = []
            for line in response.split('\n'):
                line = line.strip()
                if line and not line.startswith(('#', '*', '-', '1.', '2.', '3.', '4.', '5.')):
                    # Clean up the line
                    line = re.sub(r'^[\d\.\-\*\#\s]+', '', line)
                    if line and len(line) > 10:  # Filter out very short lines
                        key_points.append(line)
            
            return key_points[:7]  # Limit to 7 points
            
        except Exception as e:
            logger.error(f"Error extracting key points: {str(e)}")
            return ["Key points extraction failed"]
    
    async def _generate_summary(self, content: str, ai_service: Any) -> str:
        """Generate a comprehensive summary of the content."""
        try:
            prompt = f"""
            Write a comprehensive summary of the following content in 2-3 paragraphs.
            Include the main topic, key arguments, and important conclusions.
            Make it informative and well-structured.
            
            Content:
            {content[:4000]}
            """
            
            summary = await ai_service.generate_assignment_content_from_prompt(prompt)
            return summary.strip()
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return "Summary generation failed"
    
    async def _analyze_sentiment(self, content: str, ai_service: Any) -> str:
        """Analyze the sentiment of the content."""
        try:
            prompt = f"""
            Analyze the sentiment of the following content and respond with only one word:
            "positive", "negative", or "neutral".
            
            Content:
            {content[:2000]}
            """
            
            sentiment = await ai_service.generate_assignment_content_from_prompt(prompt)
            sentiment = sentiment.strip().lower()
            
            if sentiment in ['positive', 'negative', 'neutral']:
                return sentiment
            else:
                return 'neutral'
                
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return 'neutral'
    
    async def _identify_related_topics(self, content: str, ai_service: Any) -> List[str]:
        """Identify related topics and themes."""
        try:
            prompt = f"""
            Identify 5-8 main topics, themes, or subject areas covered in this content.
            Return only the topic names, one per line, without explanations.
            
            Content:
            {content[:3000]}
            """
            
            response = await ai_service.generate_assignment_content_from_prompt(prompt)
            
            # Parse topics from response
            topics = []
            for line in response.split('\n'):
                line = line.strip()
                if line and not line.startswith(('#', '*', '-', '1.', '2.', '3.')):
                    line = re.sub(r'^[\d\.\-\*\#\s]+', '', line)
                    if line and len(line) > 2 and len(line) < 50:
                        topics.append(line.title())
            
            return list(set(topics))[:8]  # Remove duplicates and limit
            
        except Exception as e:
            logger.error(f"Error identifying related topics: {str(e)}")
            return ["Topic identification failed"]
    
    async def _generate_suggested_actions(
        self, 
        content: str, 
        content_type: str, 
        credibility: int, 
        ai_service: Any
    ) -> List[str]:
        """Generate suggested actions based on content analysis."""
        try:
            prompt = f"""
            Based on this content analysis:
            - Content Type: {content_type}
            - Credibility Score: {credibility}/10
            - Content: {content[:2000]}
            
            Suggest 4-6 actionable next steps or recommendations for someone who wants to:
            1. Learn more about this topic
            2. Verify the information
            3. Apply this knowledge
            4. Find related resources
            
            Return only the suggestions, one per line, without numbering.
            """
            
            response = await ai_service.generate_assignment_content_from_prompt(prompt)
            
            # Parse suggestions from response
            suggestions = []
            for line in response.split('\n'):
                line = line.strip()
                if line and not line.startswith(('#', '*', '-', '1.', '2.', '3.')):
                    line = re.sub(r'^[\d\.\-\*\#\s]+', '', line)
                    if line and len(line) > 10:
                        suggestions.append(line)
            
            return suggestions[:6]  # Limit to 6 suggestions
            
        except Exception as e:
            logger.error(f"Error generating suggested actions: {str(e)}")
            return ["Action suggestions generation failed"]
