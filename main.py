from flask import Flask, request, jsonify, send_from_directory
from crewai import Crew
from textwrap import dedent
from agents import CustomAgents
from tasks import CustomTasks
from fpdf import FPDF
import os
from dotenv import load_dotenv
import requests
from serpapi import GoogleSearch
import re
from colorama import Fore, Style
from PIL import Image
import logging

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
# Ensure static_folder points to 'dist' relative to main.py (which is /app/dist in container)
# static_url_path='' means requests like /assets/file.js map to dist/assets/file.js
app = Flask(__name__, static_folder='dist', static_url_path='')

def search_unsplash(query):
    """Searches Unsplash for images related to the given query."""
    params = {
        "engine": "google_images",
        "q": query,
        "api_key": os.environ["SERPAPI_API_KEY"]
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    if "images_results" in results:
        image_url = results["images_results"][0]["original"]
    else:
        logger.warning("No images found for the given query.")
        return ""

    # Get the file extension from the URL, default to .jpg if none found
    file_extension = os.path.splitext(image_url)[1]
    if not file_extension:
        file_extension = '.jpg'  # Default extension
    
    # Ensure the extension is one of the supported types
    supported_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    if file_extension.lower() not in supported_extensions:
        file_extension = '.jpg'  # Default to jpg if unsupported extension

    words = query.split()[:5]
    safe_words = [re.sub(r'[^a-zA-Z0-9_]', '', word) for word in words]
    filename = "_".join(safe_words).lower() + file_extension
    filepath = os.path.join(os.getcwd(), "images", filename)

    # Create the 'images' directory if it doesn't exist
    images_dir = os.path.join(os.getcwd(), "images")
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)
        try:
             os.chmod(images_dir, 0o777) # Give full permissions
        except OSError as e:
             logger.warning(f"Could not set permissions on images directory: {e}")

    # Download the image
    try:
        response = requests.get(image_url, timeout=10) # Added timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        with open(filepath, 'wb') as file:
            file.write(response.content)
        try:
            os.chmod(filepath, 0o666)  # Give read/write permissions to the file
        except OSError as e:
            logger.warning(f"Could not set permissions on image file: {e}")
        logger.info(f"Image downloaded successfully: {filepath}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to download image: {e}")
        return ""
    except IOError as e:
        logger.error(f"Failed to write image file: {e}")
        return ""

    return filepath
 
# Add image validation and conversion function
def ensure_valid_jpeg(image_path):
    if not image_path or not os.path.exists(image_path):
        logger.warning(f"Image path does not exist or is empty: {image_path}")
        return None
    try:
        # Try to open the image with PIL
        img = Image.open(image_path)
        
        # If image is not JPEG, convert it
        if img.format != 'JPEG':
            jpeg_path = os.path.splitext(image_path)[0] + '_converted.jpg'
            # Convert to RGB mode if necessary (in case of PNG with transparency)
            if img.mode in ('RGBA', 'LA'):
                # Create a white background image
                background = Image.new('RGB', img.size, (255, 255, 255))
                # Paste the image onto the background using the alpha channel as mask
                background.paste(img, mask=img.split()[-1])
                img = background
            else:
                 img = img.convert('RGB') # Ensure conversion for other non-RGB modes too

            img.save(jpeg_path, 'JPEG', quality=95)
            logger.info(f"Converted image {image_path} to {jpeg_path}")
            # Clean up original non-jpeg file? Optional.
            # os.remove(image_path)
            return jpeg_path
        return image_path
    except Exception as e:
        logger.error(f"Error processing image {image_path}: {str(e)}")
        # Optionally remove the problematic file
        # try:
        #    os.remove(image_path)
        # except OSError:
        #    pass
        return None

class CustomCrew:
    def __init__(self, topic, preference):
        self.topic = topic
        self.preference = preference
 
    def run(self):
        # Define your custom agents and tasks in agents.py and tasks.py
        agents = CustomAgents()
        tasks = CustomTasks()
 
        # Define your custom agents
        data_agent = agents.data_agent()
        structure_agent = agents.Structure_agent()
        pdf_agent = agents.pdf_agent()
 
        # Define your custom tasks
        data_task = tasks.generate_notes_task(data_agent, self.topic, self.preference)
        structuring_task = tasks.structure_content_task(structure_agent, data_task)
        pdf_task = tasks.generate_pdf_task(pdf_agent, structuring_task)
 
        # Define your custom crew
        crew = Crew(
            agents=[data_agent, structure_agent, pdf_agent],
            tasks=[data_task, structuring_task, pdf_task],
            verbose=True,
        )
        try:
            result = crew.kickoff()
            logger.info("CrewAI process completed successfully.")
            return result
        except Exception as e:
            logger.error(f"CrewAI kickoff failed: {e}", exc_info=True)
            raise # Re-raise the exception to be caught by the API endpoint

# Moved PDF generation into a separate function
def create_pdf_file(topic, result_text):
    pdf_file_path = ""
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
 
        # Add the result to the PDF
        result_lines = result_text.split("\n\n")
        image_path = search_unsplash(topic)
        last_line_y = 0
 
        for i, line in enumerate(result_lines):
            pdf.multi_cell(0, 10, txt=line)
            if i == len(result_lines) - 1:  # If this is the last paragraph
                last_line_y = pdf.get_y()
 
            pdf.ln(5) # Add some vertical spacing between paragraphs
 
        # Ensure directories exist
        pdf_dir = "pdf"
        if not os.path.exists(pdf_dir):
            os.makedirs(pdf_dir)
            try:
                os.chmod(pdf_dir, 0o777)
            except OSError as e:
                logger.warning(f"Could not set permissions on pdf directory: {e}")

        images_dir = "images" # Ensure images dir exists for ensure_valid_jpeg
        if not os.path.exists(images_dir):
             os.makedirs(images_dir)
             try:
                 os.chmod(images_dir, 0o777)
             except OSError as e:
                 logger.warning(f"Could not set permissions on images directory: {e}")

        if image_path:
            try:
                # Convert/validate image before adding to PDF
                valid_image_path = ensure_valid_jpeg(image_path)
                if valid_image_path:
                    # Calculate image position carefully
                    img_y = last_line_y + 5 # Add some space after text
                    page_height = pdf.h - pdf.t_margin - pdf.b_margin
                    img = Image.open(valid_image_path)
                    img_w, img_h = img.size
                    aspect_ratio = img_h / img_w
                    display_w = 130 # Desired width
                    display_h = display_w * aspect_ratio

                    # Check if image fits on the current page
                    if img_y + display_h > page_height:
                         pdf.add_page() # Add new page if not enough space
                         img_y = pdf.t_margin # Place image at the top margin of new page

                    pdf.image(valid_image_path, x=10, y=img_y, w=display_w)
                    logger.info(f"Added image {valid_image_path} to PDF.")
                else:
                    logger.warning(f"Skipping invalid image: {image_path}")
            except Exception as e:
                logger.error(f"Error adding image to PDF: {str(e)}", exc_info=True)
                # Continue with PDF generation without the image

        # Save the PDF file
        safe_topic = re.sub(r'[^a-zA-Z0-9_]', '', topic).replace(' ', '_')
        pdf_file_name = f"notes_{safe_topic}.pdf"
        pdf_file_path = os.path.join(pdf_dir, pdf_file_name)
        pdf.output(pdf_file_path, 'F')
        logger.info(f"PDF file created: {pdf_file_path}")

    except Exception as e:
        logger.error(f"Failed to create PDF: {e}", exc_info=True)
        return None # Indicate failure

    # Return relative path for web access
    return f"/{pdf_dir}/{pdf_file_name}"

@app.route('/api/generate_notes', methods=['POST'])
def handle_generate_notes():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    topic = data.get('topic')
    preference = data.get('preference')

    if not topic or not preference:
        return jsonify({"error": "Missing 'topic' or 'preference' in request body"}), 400

    logger.info(f"Received request to generate notes for topic: '{topic}', preference: '{preference}'")

    try:
        custom_crew = CustomCrew(topic, preference)
        result_text = custom_crew.run()

        if not result_text:
             raise ValueError("CrewAI returned empty result.")

        pdf_relative_path = create_pdf_file(topic, result_text)

        if pdf_relative_path:
            logger.info(f"Successfully generated PDF: {pdf_relative_path}")
            return jsonify({"pdf_path": pdf_relative_path})
        else:
            return jsonify({"error": "Failed to generate PDF file"}), 500

    except Exception as e:
        logger.error(f"Error during note generation: {e}", exc_info=True)
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500

# Route to serve generated PDF files
@app.route('/pdf/<filename>')
def serve_pdf(filename):
    logger.info(f"Serving PDF file: {filename} as attachment")
    # Add as_attachment=True to force download
    return send_from_directory('pdf', filename, as_attachment=True)

# Route to serve frontend static files (index.html)
# Serve index.html specifically for the root path
@app.route('/')
def serve_index():
    logger.info("Serving index.html")
    # Use the configured static_folder from Flask app
    return app.send_static_file('index.html')

if __name__ == "__main__":
    print(Fore.CYAN + "Starting Flask server..." + Style.RESET_ALL)
    # Removed the ASCII art and CLI input sections

    # Make sure necessary directories exist before starting
    os.makedirs("pdf", exist_ok=True)
    os.makedirs("images", exist_ok=True)

    # Run the Flask app
    # Use host='0.0.0.0' to make it accessible externally (e.g., from Docker)
    # Use debug=True for development (auto-reloads), but turn off for production
    app.run(host='0.0.0.0', port=5000, debug=True)
