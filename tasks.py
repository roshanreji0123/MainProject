from crewai import Task
from textwrap import dedent



class CustomTasks:
    def __tip_section(self):
        return "If you do your BEST WORK, I'll give you a $10,000 commission!"

    def generate_notes_task(self, agent, topic, preference):
        return Task(
            description=dedent(f"""
                Generate comprehensive, well-structured notes on the given topic: '{topic}'.
                Focus on clarity, accuracy, and detail, tailored to the preference: '{preference}'.
                Consult multiple reliable web sources to gather information.
                Structure the notes logically with clear headings (using '#' for main title, '##' for subheadings) and bullet points ('-' or '*') where appropriate.
                Ensure the final output is coherent, informative, and ready for structuring and PDF generation.
                Do not include any introductory or concluding remarks like "Here are the notes..." or "I hope this helps.". Just provide the structured text content.
            """),
            expected_output=dedent("""
                Well-structured, detailed text content about the topic, formatted with markdown-style headings (#, ##) and bullet points (- or *).
                Example:
                # Main Title about Topic

                ## Introduction
                Some introductory text.

                ## Key Concept 1
                Explanation of the first key concept.
                - Bullet point 1
                - Bullet point 2

                ## Key Concept 2
                Explanation of the second key concept. Further details...
            """),
            agent=agent,
            async_execution=False,
        )
    
    def gather_information_task(self, agent, topic):
     return Task(
        description=dedent(f"""
            Use advanced browsing techniques to explore the internet and retrieve valuable textual information closely related to the topic '{topic}'.
            {self.__tip_section()}
            Ensure the information is relevant, accurate, and up-to-date.
        """),
        agent=agent,
    )

    def search_images_task(self, agent, topic, text):
     return Task(
        description=dedent(f"""
            Based on the topic '{topic}' and the generated text:
            {text}
            Search the web for relevant images that complement and enhance the textual content.
            {self.__tip_section()}
            Make sure the images are visually engaging and help convey the information more effectively.
        """),
        agent=agent,
    )

    def structure_content_task(self, agent, text):
     return Task(
        description=dedent(f"""
            Review the input content provided below. It might be structured text or raw JSON.
            Input Content:
            ------------
            {text}
            ------------
            If the input content is JSON, use the JsonFormatterTool to convert it into well-formatted text.
            If it's already text, ensure it is well-structured for a PDF document.
            Structure the final text content according to the user's preferred format, enabling the generation of a well-organized PDF document.
            {self.__tip_section()}
            Ensure the structured content is readable, visually appealing, and follows the specified formatting guidelines.
        """),
        agent=agent,
    )

    def generate_pdf_task(self, agent, structured_content):
     return Task(
        description=dedent(f"""
            **Task:** Format the provided content for PDF generation using specific markers.

            **Input Content:**
            ------------
            {structured_content}
            ------------

            **Formatting Rules (Apply these markers to the text):**
            1.  **Main Title:** Start the main title line **exactly** with `# ` (Use only once).
            2.  **Section Headings:** Start major section heading lines **exactly** with `## `.
            3.  **Bullet Points:** Start bullet point lines **exactly** with `- ` or `* `.
            4.  **Paragraphs:** Separate paragraphs with a blank line.
            5.  **DO NOT USE:** `###` headings or inline bold (`**`).

            **Output:** Return the fully formatted text using only the allowed markers (#, ##, -/*).
            {self.__tip_section()}
        """),
        agent=agent,
        # Simplified expected output - focus on markers
        expected_output="Well-structured text using only #, ##, -/* markers for formatting."
    )