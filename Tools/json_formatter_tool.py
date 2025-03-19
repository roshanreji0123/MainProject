from langchain.tools import tool
import json

class JsonFormatterTool:
    @tool("Format JSON to Text")
    def format_json_to_text(self, json_str):
        """Converts JSON structured notes into formatted text."""
        try:
            if isinstance(json_str, str):
                data = json.loads(json_str)
            else:
                data = json_str
                
            formatted_text = []
            
            # Add title
            if "title" in data:
                formatted_text.append(f"# {data['title']}\n")
            
            # Process sections
            for section in data.get("sections", []):
                # Add heading
                if "heading" in section:
                    formatted_text.append(f"## {section['heading']}")
                
                # Add content
                if "content" in section:
                    formatted_text.append(f"{section['content']}\n")
                
                # Process sub-sections
                if "sub_sections" in section:
                    for sub in section["sub_sections"]:
                        formatted_text.append(f"### {sub['sub_heading']}")
                        formatted_text.append(f"{sub['content']}\n")
                
                # Process list items
                if "list_items" in section:
                    for item in section["list_items"]:
                        formatted_text.append(f"- **{item['term']}**: {item['definition']}\n")
            
            return "\n".join(formatted_text)
            
        except Exception as e:
            return f"Error formatting JSON: {str(e)}"