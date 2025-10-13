from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger
import json
import re
from datetime import datetime


class ContentOptimizationService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        # Use GPT-4 Turbo for content optimization - better understanding of writing styles and SEO
        self.model = "gpt-4-turbo-preview"
        
    async def optimize_content(
        self, 
        content: str, 
        optimization_type: str = "general",
        target_audience: Optional[str] = None,
        content_purpose: Optional[str] = None,
        include_metrics: bool = True
    ) -> Dict[str, Any]:
        """
        Optimize content for maximum impact using AI.
        
        Args:
            content: The content to optimize
            optimization_type: Type of optimization ("general", "academic", "business", "creative", "technical")
            target_audience: Target audience for the content
            content_purpose: Purpose of the content (e.g., "persuade", "inform", "entertain")
            include_metrics: Whether to include optimization metrics
            
        Returns:
            Dictionary containing optimized content and analysis
        """
        try:
            # Analyze original content
            content_analysis = await self._analyze_content(content, optimization_type)
            
            # Generate optimization suggestions
            optimization_suggestions = await self._generate_optimization_suggestions(
                content, content_analysis, optimization_type, target_audience, content_purpose
            )
            
            # Create optimized version
            optimized_content = await self._create_optimized_content(
                content, optimization_suggestions, optimization_type
            )
            
            # Calculate optimization metrics
            metrics = {}
            if include_metrics:
                metrics = await self._calculate_optimization_metrics(
                    content, optimized_content, content_analysis
                )
            
            # Generate improvement report
            improvement_report = await self._generate_improvement_report(
                content_analysis, optimization_suggestions, metrics
            )
            
            return {
                "original_content": content,
                "optimized_content": optimized_content,
                "optimization_type": optimization_type,
                "target_audience": target_audience,
                "content_purpose": content_purpose,
                "content_analysis": content_analysis,
                "optimization_suggestions": optimization_suggestions,
                "metrics": metrics,
                "improvement_report": improvement_report,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in content optimization: {str(e)}")
            raise Exception(f"Failed to optimize content: {str(e)}")
    
    async def _analyze_content(self, content: str, optimization_type: str) -> Dict[str, Any]:
        """Analyze the original content for optimization opportunities."""
        try:
            prompt = f"""
            Analyze the following content for optimization opportunities:
            
            Content: {content}
            Optimization Type: {optimization_type}
            
            Please analyze:
            1. Content structure and organization
            2. Clarity and readability
            3. Engagement potential
            4. Target audience alignment
            5. Purpose effectiveness
            6. Areas for improvement
            7. Strengths to maintain
            
            Provide specific, actionable insights for each area.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert content analyst specializing in content optimization and improvement."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=800,
                temperature=0.3
            )
            
            analysis_text = response.choices[0].message.content
            
            # Parse analysis into structured format
            analysis_sections = self._parse_analysis(analysis_text)
            
            # Calculate basic metrics
            basic_metrics = self._calculate_basic_metrics(content)
            
            return {
                "analysis_text": analysis_text,
                "sections": analysis_sections,
                "basic_metrics": basic_metrics,
                "optimization_type": optimization_type
            }
            
        except Exception as e:
            logger.error(f"Error analyzing content: {str(e)}")
            return {"error": f"Content analysis failed: {str(e)}"}
    
    def _parse_analysis(self, analysis_text: str) -> List[Dict[str, str]]:
        """Parse analysis text into structured sections."""
        sections = []
        lines = analysis_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this is a new section (numbered or titled)
            if re.match(r'^\d+\.', line) or re.match(r'^[A-Z][^:]*:', line):
                if current_section:
                    sections.append(current_section)
                
                # Extract section title
                title = re.sub(r'^\d+\.\s*', '', line)
                title = re.sub(r':.*$', '', title)
                
                current_section = {
                    "title": title.strip(),
                    "content": line
                }
            elif current_section:
                current_section["content"] += "\n" + line
        
        if current_section:
            sections.append(current_section)
        
        return sections
    
    def _calculate_basic_metrics(self, content: str) -> Dict[str, Any]:
        """Calculate basic content metrics."""
        try:
            words = len(content.split())
            sentences = len(re.split(r'[.!?]+', content))
            paragraphs = len([p for p in content.split('\n\n') if p.strip()])
            
            # Calculate average sentence length
            avg_sentence_length = words / sentences if sentences > 0 else 0
            
            # Calculate average paragraph length
            avg_paragraph_length = words / paragraphs if paragraphs > 0 else 0
            
            # Calculate reading time (average 200 words per minute)
            reading_time_minutes = words / 200
            
            return {
                "word_count": words,
                "sentence_count": sentences,
                "paragraph_count": paragraphs,
                "avg_sentence_length": round(avg_sentence_length, 2),
                "avg_paragraph_length": round(avg_paragraph_length, 2),
                "reading_time_minutes": round(reading_time_minutes, 1)
            }
            
        except Exception as e:
            logger.error(f"Error calculating basic metrics: {str(e)}")
            return {}
    
    async def _generate_optimization_suggestions(
        self, 
        content: str, 
        analysis: Dict[str, Any], 
        optimization_type: str,
        target_audience: Optional[str],
        content_purpose: Optional[str]
    ) -> List[Dict[str, str]]:
        """Generate specific optimization suggestions."""
        try:
            prompt = f"""
            Based on the content analysis, provide specific optimization suggestions:
            
            Content: {content[:2000]}
            Optimization Type: {optimization_type}
            Target Audience: {target_audience or 'General'}
            Content Purpose: {content_purpose or 'Inform'}
            
            Analysis: {analysis.get('analysis_text', '')}
            
            Please provide specific, actionable suggestions for:
            1. Structure and organization improvements
            2. Clarity and readability enhancements
            3. Engagement and impact improvements
            4. Audience alignment adjustments
            5. Purpose effectiveness optimization
            
            For each suggestion, include:
            - What to change
            - Why to change it
            - How to implement it
            - Expected impact
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert content strategist specializing in content optimization and improvement."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=1000,
                temperature=0.4
            )
            
            suggestions_text = response.choices[0].message.content
            
            # Parse suggestions into structured format
            suggestions = self._parse_suggestions(suggestions_text)
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error generating optimization suggestions: {str(e)}")
            return []
    
    def _parse_suggestions(self, suggestions_text: str) -> List[Dict[str, str]]:
        """Parse suggestions text into structured format."""
        suggestions = []
        lines = suggestions_text.split('\n')
        current_suggestion = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this is a new suggestion (numbered or titled)
            if re.match(r'^\d+\.', line) or re.match(r'^[A-Z][^:]*:', line):
                if current_suggestion:
                    suggestions.append(current_suggestion)
                
                # Extract suggestion title
                title = re.sub(r'^\d+\.\s*', '', line)
                title = re.sub(r':.*$', '', title)
                
                current_suggestion = {
                    "title": title.strip(),
                    "content": line,
                    "category": self._categorize_suggestion(title)
                }
            elif current_suggestion:
                current_suggestion["content"] += "\n" + line
        
        if current_suggestion:
            suggestions.append(current_suggestion)
        
        return suggestions
    
    def _categorize_suggestion(self, title: str) -> str:
        """Categorize suggestion based on title."""
        title_lower = title.lower()
        
        if any(word in title_lower for word in ['structure', 'organization', 'flow']):
            return "structure"
        elif any(word in title_lower for word in ['clarity', 'readability', 'language']):
            return "clarity"
        elif any(word in title_lower for word in ['engagement', 'impact', 'compelling']):
            return "engagement"
        elif any(word in title_lower for word in ['audience', 'target', 'reader']):
            return "audience"
        elif any(word in title_lower for word in ['purpose', 'goal', 'objective']):
            return "purpose"
        else:
            return "general"
    
    async def _create_optimized_content(
        self, 
        original_content: str, 
        suggestions: List[Dict[str, str]], 
        optimization_type: str
    ) -> str:
        """Create an optimized version of the content."""
        try:
            # Create optimization prompt
            optimization_prompt = f"""
            Create an optimized version of the following content:
            
            Original Content:
            {original_content}
            
            Optimization Type: {optimization_type}
            
            Apply these optimization suggestions:
            """
            
            for suggestion in suggestions:
                optimization_prompt += f"\n- {suggestion['title']}: {suggestion['content']}"
            
            optimization_prompt += """
            
            Please create an optimized version that:
            1. Maintains the original message and intent
            2. Applies the suggested improvements
            3. Enhances clarity, engagement, and impact
            4. Is appropriate for the specified optimization type
            5. Preserves the original structure where beneficial
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert content optimizer who creates improved versions while maintaining original intent."},
                    {"role": "user", "content": optimization_prompt}
                ],
                max_completion_tokens=len(original_content) * 2,  # Allow for expansion
                temperature=0.4
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error creating optimized content: {str(e)}")
            return original_content  # Return original if optimization fails
    
    async def _calculate_optimization_metrics(
        self, 
        original_content: str, 
        optimized_content: str, 
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate metrics comparing original and optimized content."""
        try:
            # Calculate basic metrics for both versions
            original_metrics = self._calculate_basic_metrics(original_content)
            optimized_metrics = self._calculate_basic_metrics(optimized_content)
            
            # Calculate improvement percentages
            word_count_change = ((optimized_metrics.get('word_count', 0) - original_metrics.get('word_count', 0)) / original_metrics.get('word_count', 1)) * 100
            sentence_count_change = ((optimized_metrics.get('sentence_count', 0) - original_metrics.get('sentence_count', 0)) / original_metrics.get('sentence_count', 1)) * 100
            
            # Calculate readability improvements
            original_readability = self._calculate_readability_score(original_content)
            optimized_readability = self._calculate_readability_score(optimized_content)
            readability_improvement = optimized_readability - original_readability
            
            # Calculate engagement score (approximate)
            original_engagement = self._calculate_engagement_score(original_content)
            optimized_engagement = self._calculate_engagement_score(optimized_content)
            engagement_improvement = optimized_engagement - original_engagement
            
            return {
                "original_metrics": original_metrics,
                "optimized_metrics": optimized_metrics,
                "improvements": {
                    "word_count_change_percent": round(word_count_change, 2),
                    "sentence_count_change_percent": round(sentence_count_change, 2),
                    "readability_improvement": round(readability_improvement, 2),
                    "engagement_improvement": round(engagement_improvement, 2),
                    "overall_improvement_score": round((readability_improvement + engagement_improvement) / 2, 2)
                },
                "comparison": {
                    "original_readability": original_readability,
                    "optimized_readability": optimized_readability,
                    "original_engagement": original_engagement,
                    "optimized_engagement": optimized_engagement
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating optimization metrics: {str(e)}")
            return {}
    
    def _calculate_readability_score(self, content: str) -> float:
        """Calculate a readability score for the content."""
        try:
            words = len(content.split())
            sentences = len(re.split(r'[.!?]+', content))
            syllables = self._count_syllables(content)
            
            if sentences == 0 or words == 0:
                return 0
            
            # Flesch Reading Ease score
            flesch_score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words))
            
            return max(0, min(100, flesch_score))
            
        except Exception as e:
            logger.error(f"Error calculating readability score: {str(e)}")
            return 0
    
    def _count_syllables(self, text: str) -> int:
        """Approximate syllable count for readability calculation."""
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
    
    def _calculate_engagement_score(self, content: str) -> float:
        """Calculate an engagement score for the content."""
        try:
            # Simple engagement heuristics
            words = len(content.split())
            
            # Count engaging elements
            questions = len(re.findall(r'\?', content))
            exclamations = len(re.findall(r'!', content))
            quotes = len(re.findall(r'["\']', content)) // 2
            lists = len(re.findall(r'[-•*]\s', content))
            
            # Calculate engagement score (0-100)
            engagement_score = min(100, (
                (questions * 5) +  # Questions increase engagement
                (exclamations * 3) +  # Exclamations add energy
                (quotes * 2) +  # Quotes add variety
                (lists * 4) +  # Lists improve readability
                (words / 10)  # Longer content generally more engaging
            ))
            
            return engagement_score
            
        except Exception as e:
            logger.error(f"Error calculating engagement score: {str(e)}")
            return 0
    
    async def _generate_improvement_report(
        self, 
        analysis: Dict[str, Any], 
        suggestions: List[Dict[str, str]], 
        metrics: Dict[str, Any]
    ) -> str:
        """Generate a comprehensive improvement report."""
        try:
            prompt = f"""
            Generate a comprehensive improvement report based on the content optimization:
            
            Analysis: {analysis.get('analysis_text', '')}
            
            Optimization Suggestions Applied: {len(suggestions)} suggestions
            
            Metrics:
            - Word count change: {metrics.get('improvements', {}).get('word_count_change_percent', 0)}%
            - Readability improvement: {metrics.get('improvements', {}).get('readability_improvement', 0)} points
            - Engagement improvement: {metrics.get('improvements', {}).get('engagement_improvement', 0)} points
            - Overall improvement score: {metrics.get('improvements', {}).get('overall_improvement_score', 0)} points
            
            Please provide:
            1. Summary of key improvements made
            2. Impact of changes on content effectiveness
            3. Recommendations for further optimization
            4. Best practices applied
            5. Expected outcomes for target audience
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert content strategist who creates comprehensive improvement reports."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=600,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating improvement report: {str(e)}")
            return "Unable to generate improvement report."
    
    async def optimize_for_seo(
        self, 
        content: str, 
        target_keywords: List[str],
        content_type: str = "article"
    ) -> Dict[str, Any]:
        """
        Optimize content for search engine optimization (SEO).
        
        Args:
            content: The content to optimize
            target_keywords: List of target keywords
            content_type: Type of content ("article", "blog", "landing_page", etc.)
            
        Returns:
            Dictionary containing SEO-optimized content and analysis
        """
        try:
            # Analyze current SEO performance
            seo_analysis = await self._analyze_seo_performance(content, target_keywords)
            
            # Generate SEO optimization suggestions
            seo_suggestions = await self._generate_seo_suggestions(content, target_keywords, content_type)
            
            # Create SEO-optimized content
            seo_optimized_content = await self._create_seo_optimized_content(
                content, seo_suggestions, target_keywords
            )
            
            # Calculate SEO metrics
            seo_metrics = await self._calculate_seo_metrics(
                content, seo_optimized_content, target_keywords
            )
            
            return {
                "original_content": content,
                "seo_optimized_content": seo_optimized_content,
                "target_keywords": target_keywords,
                "content_type": content_type,
                "seo_analysis": seo_analysis,
                "seo_suggestions": seo_suggestions,
                "seo_metrics": seo_metrics,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in SEO optimization: {str(e)}")
            raise Exception(f"Failed to optimize for SEO: {str(e)}")
    
    async def _analyze_seo_performance(self, content: str, target_keywords: List[str]) -> Dict[str, Any]:
        """Analyze current SEO performance of the content."""
        try:
            prompt = f"""
            Analyze the SEO performance of the following content:
            
            Content: {content}
            Target Keywords: {', '.join(target_keywords)}
            
            Please analyze:
            1. Keyword density and placement
            2. Content structure for SEO
            3. Readability and user experience
            4. Meta information opportunities
            5. Internal linking potential
            6. Content length and depth
            7. SEO best practices compliance
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert SEO analyst specializing in content optimization for search engines."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=600,
                temperature=0.3
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "target_keywords": target_keywords,
                "content_length": len(content)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing SEO performance: {str(e)}")
            return {"error": f"SEO analysis failed: {str(e)}"}
    
    async def _generate_seo_suggestions(self, content: str, target_keywords: List[str], content_type: str) -> List[str]:
        """Generate SEO optimization suggestions."""
        try:
            prompt = f"""
            Generate SEO optimization suggestions for the following content:
            
            Content: {content}
            Target Keywords: {', '.join(target_keywords)}
            Content Type: {content_type}
            
            Please provide specific suggestions for:
            1. Keyword optimization
            2. Content structure improvements
            3. Meta information recommendations
            4. Internal linking opportunities
            5. Content enhancement suggestions
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert SEO strategist who provides actionable optimization recommendations."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=500,
                temperature=0.4
            )
            
            suggestions_text = response.choices[0].message.content
            return [s.strip() for s in suggestions_text.split('\n') if s.strip()]
            
        except Exception as e:
            logger.error(f"Error generating SEO suggestions: {str(e)}")
            return []
    
    async def _create_seo_optimized_content(self, content: str, suggestions: List[str], target_keywords: List[str]) -> str:
        """Create SEO-optimized version of the content."""
        try:
            prompt = f"""
            Create an SEO-optimized version of the following content:
            
            Original Content: {content}
            Target Keywords: {', '.join(target_keywords)}
            
            Apply these SEO suggestions:
            {chr(10).join(f'- {suggestion}' for suggestion in suggestions)}
            
            Please create an optimized version that:
            1. Naturally incorporates target keywords
            2. Improves content structure for SEO
            3. Maintains readability and user experience
            4. Follows SEO best practices
            5. Preserves the original message and intent
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert SEO content optimizer who creates search-engine-friendly content."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=len(content) * 2,
                temperature=0.4
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error creating SEO-optimized content: {str(e)}")
            return content
    
    async def _calculate_seo_metrics(self, original_content: str, optimized_content: str, target_keywords: List[str]) -> Dict[str, Any]:
        """Calculate SEO metrics comparing original and optimized content."""
        try:
            # Calculate keyword density
            original_density = self._calculate_keyword_density(original_content, target_keywords)
            optimized_density = self._calculate_keyword_density(optimized_content, target_keywords)
            
            # Calculate content length
            original_length = len(original_content.split())
            optimized_length = len(optimized_content.split())
            
            # Calculate readability scores
            original_readability = self._calculate_readability_score(original_content)
            optimized_readability = self._calculate_readability_score(optimized_content)
            
            return {
                "keyword_density": {
                    "original": original_density,
                    "optimized": optimized_density,
                    "improvement": optimized_density - original_density
                },
                "content_length": {
                    "original": original_length,
                    "optimized": optimized_length,
                    "change_percent": ((optimized_length - original_length) / original_length) * 100 if original_length > 0 else 0
                },
                "readability": {
                    "original": original_readability,
                    "optimized": optimized_readability,
                    "improvement": optimized_readability - original_readability
                },
                "seo_score": self._calculate_overall_seo_score(optimized_content, target_keywords)
            }
            
        except Exception as e:
            logger.error(f"Error calculating SEO metrics: {str(e)}")
            return {}
    
    def _calculate_keyword_density(self, content: str, keywords: List[str]) -> float:
        """Calculate keyword density in content."""
        try:
            content_lower = content.lower()
            total_words = len(content.split())
            
            if total_words == 0:
                return 0
            
            keyword_count = 0
            for keyword in keywords:
                keyword_count += content_lower.count(keyword.lower())
            
            return (keyword_count / total_words) * 100
            
        except Exception as e:
            logger.error(f"Error calculating keyword density: {str(e)}")
            return 0
    
    def _calculate_overall_seo_score(self, content: str, keywords: List[str]) -> float:
        """Calculate overall SEO score for content."""
        try:
            score = 0
            
            # Keyword density (30% of score)
            keyword_density = self._calculate_keyword_density(content, keywords)
            score += min(30, keyword_density * 3)
            
            # Content length (20% of score)
            word_count = len(content.split())
            if word_count >= 300:
                score += 20
            elif word_count >= 200:
                score += 15
            elif word_count >= 100:
                score += 10
            else:
                score += 5
            
            # Readability (25% of score)
            readability = self._calculate_readability_score(content)
            score += (readability / 100) * 25
            
            # Structure (25% of score)
            paragraphs = len([p for p in content.split('\n\n') if p.strip()])
            sentences = len(re.split(r'[.!?]+', content))
            
            if paragraphs >= 3 and sentences >= 10:
                score += 25
            elif paragraphs >= 2 and sentences >= 5:
                score += 20
            else:
                score += 10
            
            return min(100, score)
            
        except Exception as e:
            logger.error(f"Error calculating overall SEO score: {str(e)}")
            return 0
