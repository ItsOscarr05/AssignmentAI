from typing import List, Dict, Any, Optional
import os
import re
from pathlib import Path
import openai
from app.core.config import settings
from app.core.logger import logger

class FileCompletionService:
    def __init__(self):
        self.model = settings.OPENAI_MODEL
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.max_context_lines = 50
        self.max_tokens = 1000

    async def get_completion(
        self,
        file_path: str,
        cursor_position: int,
        file_content: str,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get code completion suggestions based on file content and cursor position.
        
        Args:
            file_path: Path to the file
            cursor_position: Current cursor position in the file
            file_content: Content of the file
            language: Programming language of the file (optional)
            
        Returns:
            Dictionary containing completion suggestions and metadata
        """
        try:
            # Determine language if not provided
            if not language:
                language = self._detect_language(file_path)

            # Get context around cursor
            context = self._get_context(file_content, cursor_position)
            
            # Get relevant imports and dependencies
            imports = self._get_imports(file_content, language)
            
            # Get function/class context
            scope_context = self._get_scope_context(file_content, cursor_position, language)
            
            # Construct prompt for completion
            prompt = self._construct_completion_prompt(
                context,
                imports,
                scope_context,
                language
            )
            
            # Get completion from OpenAI
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are an expert {language} programmer providing code completions."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,
                max_tokens=self.max_tokens,
                top_p=0.95,
                frequency_penalty=0.0,
                presence_penalty=0.0,
                stop=["\n\n", "```"]
            )
            
            completion = response.choices[0].message.content.strip()
            
            # Process and validate completion
            processed_completion = self._process_completion(
                completion,
                context,
                language
            )
            
            return {
                "completion": processed_completion,
                "language": language,
                "confidence": self._calculate_confidence(response),
                "metadata": {
                    "context_lines": len(context.split("\n")),
                    "imports_used": len(imports),
                    "scope_depth": self._get_scope_depth(scope_context)
                }
            }
            
        except Exception as e:
            logger.error(f"Error in file completion: {str(e)}")
            return {
                "error": str(e),
                "completion": "",
                "language": language or "unknown"
            }

    def _detect_language(self, file_path: str) -> str:
        """Detect programming language from file extension."""
        ext = Path(file_path).suffix.lower()
        language_map = {
            ".py": "Python",
            ".js": "JavaScript",
            ".ts": "TypeScript",
            ".java": "Java",
            ".cpp": "C++",
            ".c": "C",
            ".go": "Go",
            ".rs": "Rust",
            ".php": "PHP",
            ".rb": "Ruby",
            ".swift": "Swift",
            ".kt": "Kotlin",
            ".scala": "Scala",
            ".hs": "Haskell",
            ".ml": "OCaml",
            ".fs": "F#",
            ".cs": "C#",
            ".tsx": "TypeScript",
            ".jsx": "JavaScript",
            ".vue": "Vue",
            ".svelte": "Svelte",
            ".html": "HTML",
            ".css": "CSS",
            ".scss": "SCSS",
            ".less": "Less",
            ".sql": "SQL",
            ".sh": "Shell",
            ".bash": "Bash",
            ".zsh": "Zsh",
            ".ps1": "PowerShell",
            ".bat": "Batch",
            ".cmd": "Batch",
            ".yml": "YAML",
            ".yaml": "YAML",
            ".json": "JSON",
            ".xml": "XML",
            ".md": "Markdown",
            ".txt": "Text",
        }
        return language_map.get(ext, "Unknown")

    def _get_context(
        self,
        file_content: str,
        cursor_position: int
    ) -> str:
        """Get context around cursor position."""
        lines = file_content.split("\n")
        current_line = file_content[:cursor_position].count("\n")
        
        start = max(0, current_line - self.max_context_lines // 2)
        end = min(len(lines), current_line + self.max_context_lines // 2)
        
        return "\n".join(lines[start:end])

    def _get_imports(self, file_content: str, language: str) -> List[str]:
        """Extract imports and dependencies from file content."""
        imports = []
        
        if language == "Python":
            import_pattern = r"^(?:from\s+[\w.]+\s+import\s+[\w\s,]+|import\s+[\w\s,]+)$"
        elif language in ["JavaScript", "TypeScript"]:
            import_pattern = r"^(?:import\s+.*?from\s+['\"].*?['\"]|require\s*\(['\"].*?['\"]\))$"
        elif language == "Java":
            import_pattern = r"^import\s+[\w.]+;$"
        else:
            return imports
            
        for line in file_content.split("\n"):
            if re.match(import_pattern, line.strip()):
                imports.append(line.strip())
                
        return imports

    def _get_scope_context(
        self,
        file_content: str,
        cursor_position: int,
        language: str
    ) -> str:
        """Get context of current function/class scope."""
        lines = file_content.split("\n")
        current_line = file_content[:cursor_position].count("\n")
        
        # Find the start of the current scope
        scope_start = current_line
        for i in range(current_line, -1, -1):
            line = lines[i].strip()
            if self._is_scope_start(line, language):
                scope_start = i
                break
                
        # Find the end of the current scope
        scope_end = current_line
        for i in range(current_line, len(lines)):
            line = lines[i].strip()
            if self._is_scope_end(line, language):
                scope_end = i
                break
                
        return "\n".join(lines[scope_start:scope_end + 1])

    def _is_scope_start(self, line: str, language: str) -> bool:
        """Check if line indicates start of a scope."""
        if language == "Python":
            return bool(re.match(r"^(?:def|class|async def)\s+\w+", line))
        elif language in ["JavaScript", "TypeScript"]:
            return bool(re.match(r"^(?:function|class|const|let|var|async function)\s+\w+", line))
        elif language == "Java":
            return bool(re.match(r"^(?:public|private|protected)?\s*(?:class|interface|enum)\s+\w+", line))
        return False

    def _is_scope_end(self, line: str, language: str) -> bool:
        """Check if line indicates end of a scope."""
        if language == "Python":
            return line.strip() == ""
        elif language in ["JavaScript", "TypeScript", "Java"]:
            return line.strip() == "}"
        return False

    def _construct_completion_prompt(
        self,
        context: str,
        imports: List[str],
        scope_context: str,
        language: str
    ) -> str:
        """Construct prompt for code completion."""
        prompt = f"""Complete the following {language} code. Consider the context, imports, and current scope.

Imports and Dependencies:
{chr(10).join(imports)}

Current Scope:
{scope_context}

Context:
{context}

Provide a completion that:
1. Matches the existing code style
2. Uses appropriate language features
3. Maintains consistency with the current scope
4. Follows best practices for {language}

Completion:"""
        return prompt

    def _process_completion(
        self,
        completion: str,
        context: str,
        language: str
    ) -> str:
        """Process and validate the completion."""
        # Remove any markdown code block markers
        completion = re.sub(r"^```\w*\n|```$", "", completion)
        
        # Ensure proper indentation
        last_line = context.split("\n")[-1]
        indent = len(last_line) - len(last_line.lstrip())
        completion = "\n".join(
            " " * indent + line.lstrip()
            for line in completion.split("\n")
        )
        
        return completion

    def _calculate_confidence(self, response: Any) -> float:
        """Calculate confidence score for the completion."""
        # Simple confidence calculation based on response properties
        confidence = 0.5  # Base confidence
        
        if hasattr(response, 'finish_reason'):
            if response.finish_reason == 'stop':
                confidence += 0.3
            elif response.finish_reason == 'length':
                confidence -= 0.1
                
        if hasattr(response, 'logprobs'):
            if response.logprobs and response.logprobs.token_logprobs:
                avg_logprob = sum(response.logprobs.token_logprobs) / len(response.logprobs.token_logprobs)
                confidence += min(0.2, max(-0.2, avg_logprob))
                
        return min(1.0, max(0.0, confidence))

    def _get_scope_depth(self, scope_context: str) -> int:
        """Calculate the nesting depth of the current scope."""
        depth = 0
        max_depth = 0
        
        for line in scope_context.split("\n"):
            line = line.strip()
            if line.endswith("{"):
                depth += 1
                max_depth = max(max_depth, depth)
            elif line.startswith("}"):
                depth -= 1
                
        return max_depth 