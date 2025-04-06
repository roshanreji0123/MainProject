from langchain.tools import tool
import json

class JsonFormatterTool:
    @tool("Format JSON to Text")
    def format_json_to_text(self, json_input):
        """Converts JSON structured notes into formatted text. If input is not valid JSON, returns the original input."""
        try:
            # Attempt to parse if it's a string
            if isinstance(json_input, str):
                try:
                    data = json.loads(json_input)
                except json.JSONDecodeError:
                    # If parsing fails, return the original string input
                    print("JsonFormatterTool: Input is not valid JSON, returning original string.")
                    return json_input
            # If it wasn't a string or was already parsed (e.g., passed as dict)
            elif isinstance(json_input, dict):
                 data = json_input
            else:
                 # If it's neither string nor dict, return its string representation
                 print(f"JsonFormatterTool: Input is unexpected type ({type(json_input)}), returning as string.")
                 return str(json_input)

            # --- Proceed with formatting only if parsing succeeded and data is a dict ---
            formatted_text = []

            # Add title safely
            if isinstance(data, dict) and "title" in data:
                formatted_text.append(f"# {data['title']}\n")

            # Process sections safely
            if isinstance(data, dict):
                for section in data.get("sections", []):
                    if not isinstance(section, dict): continue # Skip malformed sections
                    # Add heading
                    if "heading" in section:
                        formatted_text.append(f"## {section['heading']}")

                    # Add content
                    if "content" in section:
                        formatted_text.append(f"{section['content']}\n")

                    # Process sub-sections
                    if "sub_sections" in section:
                        for sub in section.get("sub_sections", []):
                             if not isinstance(sub, dict): continue
                             if "sub_heading" in sub:
                                 formatted_text.append(f"### {sub['sub_heading']}")
                             if "content" in sub:
                                 formatted_text.append(f"{sub['content']}\n")

                    # Process list items
                    if "list_items" in section:
                        for item in section.get("list_items", []):
                            if not isinstance(item, dict): continue
                            term = item.get('term', '')
                            definition = item.get('definition', '')
                            if term or definition: # Only add if there's content
                                formatted_text.append(f"- **{term}**: {definition}\n")
            else:
                 # Should not happen if parsing logic is correct, but as safety
                 print("JsonFormatterTool: Data is not a dictionary after parsing attempt.")
                 return str(data)

            return "\n".join(formatted_text)

        except Exception as e:
            # General fallback
            print(f"JsonFormatterTool: Error formatting input: {str(e)}")
            # Return the original input safely
            return str(json_input)