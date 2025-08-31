from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger
import json
import re
import asyncio
from datetime import datetime


class ResearchAssistantService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        # Use GPT-4 Turbo for research tasks - better reasoning and fact-checking capabilities
        self.model = "gpt-4-turbo-preview"
        
    async def research_topic(
        self, 
        topic: str, 
        research_depth: str = "comprehensive",
        include_sources: bool = True,
        fact_check: bool = True
    ) -> Dict[str, Any]:
        """
        Conduct comprehensive research on a given topic.
        
        Args:
            topic: The topic to research
            research_depth: Level of research ("basic", "comprehensive", "in-depth")
            include_sources: Whether to include source suggestions
            fact_check: Whether to perform fact-checking
            
        Returns:
            Dictionary containing research results and metadata
        """
        try:
            # Create research plan
            research_plan = await self._create_research_plan(topic, research_depth)
            
            # Conduct research
            research_results = await self._conduct_research(topic, research_plan)
            
            # Fact-check if requested
            fact_check_results = {}
            if fact_check:
                fact_check_results = await self._fact_check_research(research_results)
            
            # Generate source suggestions if requested
            sources = []
            if include_sources:
                sources = await self._suggest_sources(topic, research_results)
            
            # Create executive summary
            executive_summary = await self._create_executive_summary(topic, research_results)
            
            return {
                "topic": topic,
                "research_depth": research_depth,
                "executive_summary": executive_summary,
                "research_results": research_results,
                "fact_check_results": fact_check_results,
                "sources": sources,
                "research_plan": research_plan,
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": {
                    "total_sections": len(research_results),
                    "fact_check_score": fact_check_results.get("overall_confidence", 0),
                    "source_count": len(sources)
                }
            }
            
        except Exception as e:
            logger.error(f"Error in research assistant: {str(e)}")
            raise Exception(f"Failed to conduct research: {str(e)}")
    
    async def _create_research_plan(self, topic: str, research_depth: str) -> Dict[str, Any]:
        """Create a structured research plan for the topic."""
        try:
            prompt = f"""
            Create a comprehensive research plan for the topic: "{topic}"
            
            Research depth: {research_depth}
            
            Please provide:
            1. Key research questions to explore
            2. Main subtopics to investigate
            3. Important aspects to consider
            4. Potential challenges or controversies
            5. Recommended research approach
            
            Format as a structured plan with clear sections.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert research strategist specializing in academic and professional research planning."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=600,
                temperature=0.3
            )
            
            plan_text = response.choices[0].message.content
            
            # Parse the plan into structured format
            plan_sections = self._parse_research_plan(plan_text)
            
            return {
                "plan_text": plan_text,
                "sections": plan_sections,
                "research_depth": research_depth
            }
            
        except Exception as e:
            logger.error(f"Error creating research plan: {str(e)}")
            return {"plan_text": "Unable to create research plan", "sections": [], "research_depth": research_depth}
    
    def _parse_research_plan(self, plan_text: str) -> List[Dict[str, str]]:
        """Parse research plan text into structured sections."""
        sections = []
        lines = plan_text.split('\n')
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
    
    async def _conduct_research(self, topic: str, research_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Conduct research based on the research plan."""
        try:
            research_results = {}
            
            # Research each section from the plan
            for section in research_plan.get("sections", []):
                section_title = section.get("title", "General")
                
                prompt = f"""
                Conduct research on the following aspect of "{topic}":
                
                Section: {section_title}
                Context: {section.get("content", "")}
                
                Please provide:
                1. Key findings and insights
                2. Important facts and data
                3. Current understanding and consensus
                4. Any controversies or debates
                5. Practical implications
                
                Provide comprehensive, well-researched information.
                """
                
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an expert researcher with deep knowledge across multiple disciplines."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=800,
                    temperature=0.4
                )
                
                research_results[section_title] = {
                    "content": response.choices[0].message.content,
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            return research_results
            
        except Exception as e:
            logger.error(f"Error conducting research: {str(e)}")
            return {"Error": f"Failed to conduct research: {str(e)}"}
    
    async def _fact_check_research(self, research_results: Dict[str, Any]) -> Dict[str, Any]:
        """Perform fact-checking on research results."""
        try:
            fact_check_results = {
                "overall_confidence": 0,
                "section_checks": {},
                "flagged_statements": [],
                "confidence_levels": []
            }
            
            total_confidence = 0
            section_count = 0
            
            for section_title, section_data in research_results.items():
                if isinstance(section_data, dict) and "content" in section_data:
                    content = section_data["content"]
                    
                    prompt = f"""
                    Fact-check the following research content for the section "{section_title}":
                    
                    {content}
                    
                    Please analyze:
                    1. Factual accuracy of statements
                    2. Reliability of claims
                    3. Potential biases or assumptions
                    4. Areas that need verification
                    5. Overall confidence level (0-100)
                    
                    Provide specific feedback on any questionable statements.
                    """
                    
                    response = await self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": "You are an expert fact-checker with experience in academic and professional research verification."},
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=500,
                        temperature=0.2
                    )
                    
                    fact_check_text = response.choices[0].message.content
                    
                    # Extract confidence level
                    confidence_match = re.search(r'confidence level.*?(\d+)', fact_check_text, re.IGNORECASE)
                    confidence = int(confidence_match.group(1)) if confidence_match else 70
                    
                    fact_check_results["section_checks"][section_title] = {
                        "confidence": confidence,
                        "analysis": fact_check_text,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                    total_confidence += confidence
                    section_count += 1
                    
                    # Flag low confidence statements
                    if confidence < 70:
                        fact_check_results["flagged_statements"].append({
                            "section": section_title,
                            "confidence": confidence,
                            "reason": "Low confidence level"
                        })
            
            # Calculate overall confidence
            if section_count > 0:
                fact_check_results["overall_confidence"] = total_confidence / section_count
            
            return fact_check_results
            
        except Exception as e:
            logger.error(f"Error in fact-checking: {str(e)}")
            return {"overall_confidence": 0, "error": f"Fact-checking failed: {str(e)}"}
    
    async def _suggest_sources(self, topic: str, research_results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Suggest reliable sources for further reading."""
        try:
            # Combine research content for source analysis
            combined_content = ""
            for section_data in research_results.values():
                if isinstance(section_data, dict) and "content" in section_data:
                    combined_content += section_data["content"] + "\n\n"
            
            prompt = f"""
            Based on the research conducted on "{topic}", suggest reliable sources for further reading.
            
            Research content:
            {combined_content[:2000]}
            
            Please suggest:
            1. Academic papers and journals
            2. Books and publications
            3. Reputable websites and organizations
            4. Experts in the field
            5. Recent studies or reports
            
            For each source, provide:
            - Title/Name
            - Type (academic, book, website, etc.)
            - Brief description of relevance
            - Why it's recommended
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert librarian and research consultant specializing in source evaluation and recommendation."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=600,
                temperature=0.3
            )
            
            sources_text = response.choices[0].message.content
            
            # Parse sources into structured format
            sources = self._parse_sources(sources_text)
            
            return sources
            
        except Exception as e:
            logger.error(f"Error suggesting sources: {str(e)}")
            return []
    
    def _parse_sources(self, sources_text: str) -> List[Dict[str, str]]:
        """Parse source suggestions into structured format."""
        sources = []
        lines = sources_text.split('\n')
        current_source = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this is a new source (numbered or titled)
            if re.match(r'^\d+\.', line) or re.match(r'^[A-Z][^:]*:', line):
                if current_source:
                    sources.append(current_source)
                
                # Extract source title
                title = re.sub(r'^\d+\.\s*', '', line)
                title = re.sub(r':.*$', '', title)
                
                current_source = {
                    "title": title.strip(),
                    "description": line
                }
            elif current_source:
                current_source["description"] += "\n" + line
        
        if current_source:
            sources.append(current_source)
        
        return sources[:10]  # Limit to 10 sources
    
    async def _create_executive_summary(self, topic: str, research_results: Dict[str, Any]) -> str:
        """Create an executive summary of the research findings."""
        try:
            # Combine all research content
            combined_content = ""
            for section_data in research_results.values():
                if isinstance(section_data, dict) and "content" in section_data:
                    combined_content += section_data["content"] + "\n\n"
            
            prompt = f"""
            Create an executive summary of the research conducted on "{topic}".
            
            Research findings:
            {combined_content[:3000]}
            
            Please provide:
            1. Key findings and insights
            2. Main conclusions
            3. Important implications
            4. Recommendations for further action
            5. Overall assessment
            
            Format as a clear, concise executive summary suitable for decision-makers.
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert executive communication specialist who creates clear, actionable summaries."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error creating executive summary: {str(e)}")
            return "Unable to create executive summary."
    
    async def compare_research_sources(
        self, 
        sources: List[str], 
        topic: str
    ) -> Dict[str, Any]:
        """
        Compare multiple research sources for a given topic.
        
        Args:
            sources: List of source URLs or references
            topic: The research topic
            
        Returns:
            Dictionary containing comparison analysis
        """
        try:
            comparison_results = {
                "topic": topic,
                "sources": [],
                "comparative_analysis": "",
                "consensus_points": [],
                "conflicting_views": [],
                "recommendations": ""
            }
            
            # Analyze each source
            for i, source in enumerate(sources):
                prompt = f"""
                Analyze the following source for research on "{topic}":
                
                Source: {source}
                
                Please provide:
                1. Key findings and claims
                2. Methodology used
                3. Credibility assessment
                4. Key arguments presented
                5. Limitations or biases
                """
                
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an expert research analyst specializing in source evaluation and comparison."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=400,
                    temperature=0.3
                )
                
                comparison_results["sources"].append({
                    "source": source,
                    "analysis": response.choices[0].message.content,
                    "index": i
                })
            
            # Generate comparative analysis
            comparative_analysis = await self._generate_source_comparison(comparison_results["sources"], topic)
            comparison_results["comparative_analysis"] = comparative_analysis
            
            return comparison_results
            
        except Exception as e:
            logger.error(f"Error comparing research sources: {str(e)}")
            raise Exception(f"Failed to compare sources: {str(e)}")
    
    async def _generate_source_comparison(self, sources: List[Dict[str, Any]], topic: str) -> str:
        """Generate comparative analysis of multiple sources."""
        try:
            # Create comparison prompt
            comparison_prompt = f"Compare the following sources for research on '{topic}':\n\n"
            
            for source_data in sources:
                comparison_prompt += f"Source {source_data['index'] + 1}:\n{source_data['analysis']}\n\n"
            
            comparison_prompt += """
            Please provide:
            1. Common themes and consensus points
            2. Conflicting views or disagreements
            3. Methodological differences
            4. Credibility assessment
            5. Recommendations for synthesis
            """
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert research analyst specializing in comparative source analysis."},
                    {"role": "user", "content": comparison_prompt}
                ],
                max_tokens=600,
                temperature=0.4
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating source comparison: {str(e)}")
            return "Unable to generate comparative analysis."
