from typing import Dict, Any, List, Optional
import json
import base64
from io import BytesIO
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger
import asyncio

# Optional imports for visualization libraries
try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    plt = None
    matplotlib = None

try:
    import seaborn as sns
    SEABORN_AVAILABLE = True
except ImportError:
    SEABORN_AVAILABLE = False
    sns = None

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    pd = None

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None

class DiagramService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.supported_types = [
            'bar_chart', 'line_chart', 'pie_chart', 'scatter_plot', 
            'flowchart', 'mind_map', 'venn_diagram', 'process_diagram',
            'org_chart', 'timeline', 'comparison_table', 'infographic'
        ]

    async def generate_diagram(
        self, 
        description: str, 
        diagram_type: str = 'auto',
        data: Optional[Dict[str, Any]] = None,
        style: str = 'modern'
    ) -> Dict[str, Any]:
        """
        Generate a diagram based on description and type.
        
        Args:
            description: Text description of what diagram to create
            diagram_type: Type of diagram to generate
            data: Optional structured data for the diagram
            style: Visual style (modern, classic, minimal, colorful)
            
        Returns:
            Dictionary containing diagram data and metadata
        """
        try:
            # Determine diagram type if auto
            if diagram_type == 'auto':
                diagram_type = await self._detect_diagram_type(description)
            
            # Generate diagram based on type
            if diagram_type in ['bar_chart', 'line_chart', 'pie_chart', 'scatter_plot']:
                return await self._generate_data_visualization(description, diagram_type, data, style)
            elif diagram_type in ['flowchart', 'process_diagram']:
                return await self._generate_flowchart(description, style)
            elif diagram_type == 'mind_map':
                return await self._generate_mind_map(description, style)
            elif diagram_type == 'venn_diagram':
                return await self._generate_venn_diagram(description, style)
            elif diagram_type == 'org_chart':
                return await self._generate_org_chart(description, style)
            elif diagram_type == 'timeline':
                return await self._generate_timeline(description, style)
            elif diagram_type == 'comparison_table':
                return await self._generate_comparison_table(description, style)
            elif diagram_type == 'infographic':
                return await self._generate_infographic(description, style)
            else:
                raise ValueError(f"Unsupported diagram type: {diagram_type}")
                
        except Exception as e:
            logger.error(f"Error generating diagram: {str(e)}")
            raise

    async def _detect_diagram_type(self, description: str) -> str:
        """Detect the most appropriate diagram type from description."""
        prompt = f"""
        Analyze this description and determine the best diagram type:
        "{description}"
        
        Choose from: bar_chart, line_chart, pie_chart, scatter_plot, flowchart, 
        mind_map, venn_diagram, process_diagram, org_chart, timeline, 
        comparison_table, infographic
        
        Respond with only the diagram type.
        """
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at determining the best visualization type for data and concepts."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=50
        )
        
        content = response.choices[0].message.content
        diagram_type = content.strip().lower() if content else 'infographic'
        return diagram_type if diagram_type in self.supported_types else 'infographic'

    async def _generate_data_visualization(
        self, 
        description: str, 
        chart_type: str, 
        data: Optional[Dict[str, Any]], 
        style: str
    ) -> Dict[str, Any]:
        """Generate data visualization charts."""
        if not MATPLOTLIB_AVAILABLE:
            return {
                "error": "Matplotlib is not available. Please install matplotlib, seaborn, pandas, and numpy for diagram generation.",
                "type": chart_type,
                "data": data or {},
                "style": style,
                "description": description
            }
        
        # Generate sample data if not provided
        if not data:
            try:
                data = await self._generate_sample_data(description, chart_type)
            except Exception as e:
                logger.error(f"Error generating sample data: {str(e)}")
                return {
                    "error": f"Failed to generate {chart_type}: {str(e)}",
                    "type": chart_type,
                    "data": {},
                    "style": style,
                    "description": description
                }
        try:
            # Create the visualization
            fig, ax = plt.subplots(figsize=(10, 6))
            if style == 'modern' and SEABORN_AVAILABLE:
                plt.style.use('seaborn-v0_8')
            elif style == 'minimal':
                plt.style.use('default')
            elif style == 'colorful' and SEABORN_AVAILABLE:
                plt.style.use('seaborn-v0_8-darkgrid')
            if chart_type == 'bar_chart':
                self._create_bar_chart(ax, data)
            elif chart_type == 'line_chart':
                self._create_line_chart(ax, data)
            elif chart_type == 'pie_chart':
                self._create_pie_chart(ax, data)
            elif chart_type == 'scatter_plot':
                self._create_scatter_plot(ax, data)
            # Save to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            return {
                "type": chart_type,
                "image": image_base64,
                "data": data,
                "style": style,
                "description": description
            }
        except Exception as e:
            logger.error(f"Error generating visualization: {str(e)}")
            plt.close() if plt else None
            return {
                "error": f"Failed to generate {chart_type}: {str(e)}",
                "type": chart_type,
                "data": data or {},
                "style": style,
                "description": description
            }

    async def _generate_sample_data(self, description: str, chart_type: str) -> Dict[str, Any]:
        """Generate sample data based on description."""
        prompt = f"""
        Generate sample data for a {chart_type} based on this description: "{description}"
        
        Return only a JSON object with appropriate data structure.
        For bar/line charts: {{"labels": [], "values": []}}
        For pie charts: {{"labels": [], "sizes": []}}
        For scatter plots: {{"x": [], "y": []}}
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert at generating sample data for charts."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=150
            )
            content = response.choices[0].message.content
            return self._safe_json_parse(content, self._get_fallback_data(chart_type))
        except Exception as e:
            logger.error(f"Error generating sample data: {str(e)}")
            return self._get_fallback_data(chart_type)

    def _get_fallback_data(self, chart_type: str) -> Dict[str, Any]:
        """Provide fallback data if AI generation fails."""
        if chart_type in ['bar_chart', 'line_chart']:
            return {
                "labels": ["Category A", "Category B", "Category C", "Category D"],
                "values": [25, 40, 30, 35]
            }
        elif chart_type == 'pie_chart':
            return {
                "labels": ["Group 1", "Group 2", "Group 3", "Group 4"],
                "sizes": [30, 25, 20, 25]
            }
        elif chart_type == 'scatter_plot':
            return {
                "x": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                "y": [2, 4, 1, 5, 3, 6, 4, 7, 5, 8]
            }
        return {"labels": [], "values": []}

    def _safe_json_parse(self, content: str | None, fallback: Dict[str, Any]) -> Dict[str, Any]:
        """Safely parse JSON content with fallback."""
        try:
            if content:
                return json.loads(content)
            else:
                return fallback
        except:
            return fallback

    def _create_bar_chart(self, ax, data):
        """Create a bar chart."""
        ax.bar(data['labels'], data['values'], color='#D32F2F', alpha=0.8)
        ax.set_title('Bar Chart', fontsize=16, fontweight='bold')
        ax.set_xlabel('Categories')
        ax.set_ylabel('Values')
        plt.xticks(rotation=45)

    def _create_line_chart(self, ax, data):
        """Create a line chart."""
        ax.plot(data['labels'], data['values'], marker='o', linewidth=2, color='#D32F2F')
        ax.set_title('Line Chart', fontsize=16, fontweight='bold')
        ax.set_xlabel('Categories')
        ax.set_ylabel('Values')
        plt.xticks(rotation=45)

    def _create_pie_chart(self, ax, data):
        """Create a pie chart."""
        colors = ['#D32F2F', '#FF5252', '#FF8A80', '#FFCDD2']
        ax.pie(data['sizes'], labels=data['labels'], autopct='%1.1f%%', colors=colors)
        ax.set_title('Pie Chart', fontsize=16, fontweight='bold')

    def _create_scatter_plot(self, ax, data):
        """Create a scatter plot."""
        ax.scatter(data['x'], data['y'], color='#D32F2F', alpha=0.7, s=100)
        ax.set_title('Scatter Plot', fontsize=16, fontweight='bold')
        ax.set_xlabel('X Values')
        ax.set_ylabel('Y Values')

    async def _generate_flowchart(self, description: str, style: str) -> Dict[str, Any]:
        """Generate a flowchart diagram."""
        # Extract flowchart elements from description
        prompt = f"""
        Create a flowchart structure from this description: "{description}"
        
        Return a JSON object with:
        {{
            "nodes": [{{"id": "1", "label": "Start", "type": "start"}}],
            "edges": [{{"from": "1", "to": "2", "label": "Next step"}}]
        }}
        """
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at creating flowchart structures."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=300
        )
        
        try:
            flowchart_data = json.loads(response.choices[0].message.content)
        except:
            flowchart_data = {
                "nodes": [
                    {"id": "1", "label": "Start", "type": "start"},
                    {"id": "2", "label": "Process", "type": "process"},
                    {"id": "3", "label": "End", "type": "end"}
                ],
                "edges": [
                    {"from": "1", "to": "2", "label": "Begin"},
                    {"from": "2", "to": "3", "label": "Complete"}
                ]
            }
        
        return {
            "type": "flowchart",
            "data": flowchart_data,
            "style": style,
            "description": description
        }

    async def _generate_mind_map(self, description: str, style: str) -> Dict[str, Any]:
        """Generate a mind map structure."""
        prompt = f"""
        Create a mind map structure from this topic: "{description}"
        
        Return a JSON object with:
        {{
            "central_topic": "Main Topic",
            "branches": [
                {{
                    "id": "1",
                    "label": "Branch 1",
                    "subtopics": ["Subtopic 1", "Subtopic 2"]
                }}
            ]
        }}
        """
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at creating mind map structures."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )
        
        try:
            mind_map_data = json.loads(response.choices[0].message.content)
        except:
            mind_map_data = {
                "central_topic": description,
                "branches": [
                    {"id": "1", "label": "Main Point 1", "subtopics": ["Detail 1", "Detail 2"]},
                    {"id": "2", "label": "Main Point 2", "subtopics": ["Detail 3", "Detail 4"]}
                ]
            }
        
        return {
            "type": "mind_map",
            "data": mind_map_data,
            "style": style,
            "description": description
        }

    async def _generate_venn_diagram(self, description: str, style: str) -> Dict[str, Any]:
        """Generate a Venn diagram."""
        prompt = f"""
        Create a Venn diagram structure from this description: "{description}"
        
        Return a JSON object with:
        {{
            "sets": [
                {{"name": "Set A", "elements": ["item1", "item2"]}},
                {{"name": "Set B", "elements": ["item3", "item4"]}}
            ],
            "intersections": ["common_item1", "common_item2"]
        }}
        """
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at creating Venn diagram structures."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=300
        )
        
        try:
            venn_data = json.loads(response.choices[0].message.content)
        except:
            venn_data = {
                "sets": [
                    {"name": "Group A", "elements": ["Element 1", "Element 2"]},
                    {"name": "Group B", "elements": ["Element 3", "Element 4"]}
                ],
                "intersections": ["Common Element"]
            }
        
        return {
            "type": "venn_diagram",
            "data": venn_data,
            "style": style,
            "description": description
        }

    async def _generate_org_chart(self, description: str, style: str) -> Dict[str, Any]:
        """Generate an organizational chart."""
        prompt = f"""
        Create an organizational chart structure from this description: "{description}"
        
        Return a JSON object with:
        {{
            "hierarchy": [
                {{
                    "id": "1",
                    "name": "CEO",
                    "title": "Chief Executive Officer",
                    "children": [
                        {{"id": "2", "name": "Manager", "title": "Department Manager"}}
                    ]
                }}
            ]
        }}
        """
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at creating organizational chart structures."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=400
        )
        
        try:
            org_data = json.loads(response.choices[0].message.content)
        except:
            org_data = {
                "hierarchy": [
                    {
                        "id": "1",
                        "name": "Leader",
                        "title": "Main Position",
                        "children": [
                            {"id": "2", "name": "Member 1", "title": "Role 1"},
                            {"id": "3", "name": "Member 2", "title": "Role 2"}
                        ]
                    }
                ]
            }
        
        return {
            "type": "org_chart",
            "data": org_data,
            "style": style,
            "description": description
        }

    async def _generate_timeline(self, description: str, style: str) -> Dict[str, Any]:
        """Generate a timeline."""
        prompt = f"""
        Create a timeline structure from this description: "{description}"
        
        Return a JSON object with:
        {{
            "events": [
                {{"date": "2020", "title": "Event 1", "description": "Description"}},
                {{"date": "2021", "title": "Event 2", "description": "Description"}}
            ]
        }}
        """
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at creating timeline structures."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=400
        )
        
        try:
            timeline_data = json.loads(response.choices[0].message.content)
        except:
            timeline_data = {
                "events": [
                    {"date": "Start", "title": "Beginning", "description": "Initial phase"},
                    {"date": "Middle", "title": "Development", "description": "Growth phase"},
                    {"date": "End", "title": "Completion", "description": "Final phase"}
                ]
            }
        
        return {
            "type": "timeline",
            "data": timeline_data,
            "style": style,
            "description": description
        }

    async def _generate_comparison_table(self, description: str, style: str) -> Dict[str, Any]:
        """Generate a comparison table."""
        prompt = f"""
        Create a comparison table structure from this description: "{description}"
        
        Return a JSON object with:
        {{
            "headers": ["Feature", "Option A", "Option B"],
            "rows": [
                ["Feature 1", "Value A1", "Value B1"],
                ["Feature 2", "Value A2", "Value B2"]
            ]
        }}
        """
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at creating comparison table structures."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=400
        )
        
        try:
            table_data = json.loads(response.choices[0].message.content)
        except:
            table_data = {
                "headers": ["Aspect", "Option 1", "Option 2"],
                "rows": [
                    ["Feature A", "Yes", "No"],
                    ["Feature B", "No", "Yes"],
                    ["Feature C", "Maybe", "Yes"]
                ]
            }
        
        return {
            "type": "comparison_table",
            "data": table_data,
            "style": style,
            "description": description
        }

    async def _generate_infographic(self, description: str, style: str) -> Dict[str, Any]:
        """Generate an infographic structure."""
        prompt = f"""
        Create an infographic structure from this description: "{description}"
        
        Return a JSON object with:
        {{
            "title": "Infographic Title",
            "sections": [
                {{
                    "title": "Section 1",
                    "content": "Content description",
                    "icon": "icon_name"
                }}
            ],
            "stats": [
                {{"label": "Stat 1", "value": "100%", "description": "Description"}}
            ]
        }}
        """
        
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert at creating infographic structures."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        try:
            infographic_data = json.loads(response.choices[0].message.content)
        except:
            infographic_data = {
                "title": "Infographic",
                "sections": [
                    {"title": "Key Point 1", "content": "Important information", "icon": "info"},
                    {"title": "Key Point 2", "content": "More details", "icon": "check"}
                ],
                "stats": [
                    {"label": "Success Rate", "value": "95%", "description": "High performance"},
                    {"label": "Efficiency", "value": "90%", "description": "Optimized process"}
                ]
            }
        
        return {
            "type": "infographic",
            "data": infographic_data,
            "style": style,
            "description": description
        }

# Create a singleton instance
# Only create instance if matplotlib is available
if MATPLOTLIB_AVAILABLE:
    diagram_service = DiagramService()
else:
    diagram_service = None 