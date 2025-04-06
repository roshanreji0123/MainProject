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
import json # Import json for potential agent output parsing
import asyncio # Import asyncio

load_dotenv()
 
# Setup logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed from INFO to DEBUG
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask app
# Ensure static_folder points to 'dist' relative to main.py (which is /app/dist in container)
# static_url_path='' means requests like /assets/file.js map to dist/assets/file.js
app = Flask(__name__, static_folder='dist', static_url_path='')

def search_unsplash(query, num_images=1):
    """Searches for images using both SerpAPI and Unsplash."""
    validated_image_paths = []
    try:
        # Try SerpAPI first
        serpapi_key = os.environ.get("SERPAPI_API_KEY")
        if serpapi_key:
            logger.info("Attempting image search with SerpAPI...")
            search_term = f"{query} illustration diagram"
            params = {
                "engine": "google_images",
                "q": search_term,
                "api_key": serpapi_key,
                "num": 5
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            if "error" in results:
                logger.error(f"SerpAPI error: {results['error']}")
            elif "images_results" in results and results["images_results"]:
                logger.info(f"Found {len(results['images_results'])} images from SerpAPI")
                validated_image_paths.extend(process_image_results(results["images_results"], query))
        
        # Try Unsplash as fallback
        if not validated_image_paths:
            logger.info("No images from SerpAPI, trying Unsplash...")
            unsplash_key = os.environ.get("UNSPLASH_ACCESS_KEY")
            if unsplash_key:
                search_term = query.split(':')[0].strip()  # Use simpler search term for Unsplash
                url = f"https://api.unsplash.com/search/photos"
                headers = {"Authorization": f"Client-ID {unsplash_key}"}
                params = {
                    "query": search_term,
                    "per_page": 5
                }
                
                response = requests.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    results = response.json()
                    if results.get("results"):
                        logger.info(f"Found {len(results['results'])} images from Unsplash")
                        for photo in results["results"]:
                            image_url = photo.get("urls", {}).get("regular")
                            if image_url:
                                validated_image_paths.extend(process_image_results([{"original": image_url}], query))
                                break

        if not validated_image_paths:
            logger.warning("No images found from either API")
            
    except Exception as e:
        logger.error(f"Error during image search process: {e}", exc_info=True)

    return validated_image_paths

def process_image_results(image_results, query):
    """Process and validate image results from either API."""
    validated_paths = []
    images_dir = os.path.join(os.getcwd(), "images")
    os.makedirs(images_dir, exist_ok=True)

    for image_info in image_results:
        image_url = image_info.get("original")
        if not image_url:
            continue

        downloaded_filepath = None
        try:
            file_extension = os.path.splitext(image_url)[1]
            if not file_extension or file_extension.lower() not in ['.jpg', '.jpeg', '.png', '.gif']:
                file_extension = '.jpg'
            safe_query = re.sub(r'[^a-zA-Z0-9_]', '', query)[:30]
            temp_filename = f"temp_{safe_query}_{os.urandom(4).hex()}{file_extension}"
            filepath = os.path.join(images_dir, temp_filename)

            logger.info(f"Attempting to download image from URL: {image_url}")
            response = requests.get(image_url, timeout=20)
            response.raise_for_status()
            with open(filepath, 'wb') as file:
                file.write(response.content)
            logger.info(f"Successfully downloaded candidate image: {filepath}")
            downloaded_filepath = filepath

            # Validate the downloaded image
            validated_path = ensure_valid_jpeg(downloaded_filepath)
            if validated_path:
                logger.info(f"Image validated successfully: {validated_path}")
                safe_query = re.sub(r'[^a-zA-Z0-9_]', '', query)[:30]
                final_filename = f"{safe_query}{os.path.splitext(validated_path)[1]}"
                final_filepath = os.path.join(images_dir, final_filename)
                if os.path.exists(final_filepath) and final_filepath != validated_path:
                    final_filename = f"{safe_query}_{os.urandom(4).hex()}{os.path.splitext(validated_path)[1]}"
                    final_filepath = os.path.join(images_dir, final_filename)

                try:
                    os.rename(validated_path, final_filepath)
                    logger.info(f"Validated and finalized image: {final_filepath}")
                    validated_paths.append(final_filepath)
                    if validated_path != downloaded_filepath and os.path.exists(downloaded_filepath):
                        try:
                            os.remove(downloaded_filepath)
                        except OSError:
                            pass
                    break
                except OSError as e:
                    logger.warning(f"Could not rename validated image: {e}")
                    if os.path.exists(validated_path):
                        try:
                            os.remove(validated_path)
                        except OSError:
                            pass

        except Exception as e:
            logger.warning(f"Error processing image: {e}")
            if downloaded_filepath and os.path.exists(downloaded_filepath):
                try:
                    os.remove(downloaded_filepath)
                except OSError:
                    pass

    return validated_paths

# Add image validation and conversion function
def ensure_valid_jpeg(image_path):
    if not image_path or not os.path.exists(image_path):
        logger.warning(f"Image path does not exist or is empty: {image_path}")
        return None
    try:
        # Try to open the image with PIL
        img = Image.open(image_path)
        
        # Check if format is already supported by FPDF (JPG, PNG, GIF)
        if img.format in ('JPEG', 'PNG', 'GIF'):
            logger.info(f"Image {image_path} is already in a supported format ({img.format}).")
            return image_path # Return original path, no conversion needed

        # If not supported or format is unknown/different, proceed to convert to JPEG
        logger.info(f"Image format ({img.format}) not directly supported or needs conversion. Converting to JPEG.")
        jpeg_path = os.path.splitext(image_path)[0] + '_converted.jpg'

        # Convert to RGB mode if necessary (e.g., for PNG with transparency, GIF)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create a white background image
            background = Image.new('RGB', img.size, (255, 255, 255))
            try:
                # Paste the image onto the background using the alpha channel if available
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            except IndexError:
                # Handle cases where split doesn't work as expected (e.g., non-alpha palette)
                background.paste(img)
            img = background
        else:
            # Ensure it is RGB before saving as JPEG
            img = img.convert('RGB')

        img.save(jpeg_path, 'JPEG', quality=95)
        logger.info(f"Converted image {image_path} to {jpeg_path}")
        return jpeg_path

    except Exception as e:
        logger.error(f"Error processing image {image_path}: {str(e)}", exc_info=True)
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

# Helper function to add the image
def _add_image_to_pdf(pdf, image_path):
    """Adds a single centered image to the PDF, handling page breaks."""
    try:
        img = Image.open(image_path)
        img_w, img_h = img.size
        aspect_ratio = img_h / img_w
        display_w = 120 # Keep the width consistent
        display_h = display_w * aspect_ratio
        page_height = pdf.h - pdf.t_margin - pdf.b_margin

        pdf.ln(7) # Add vertical space before the image
        current_y = pdf.get_y()

        # Check if image fits on the current page
        if current_y + display_h > page_height:
            pdf.add_page()
            current_y = pdf.t_margin # Reset Y to top margin on new page

        # Calculate centered X position
        image_x = (pdf.w - display_w) / 2

        pdf.image(image_path, x=image_x, y=current_y, w=display_w)
        pdf.set_y(current_y + display_h) # Move cursor below the image
        logger.info(f"Added image {image_path} to PDF.")
        return True # Indicate success
    except Exception as e:
        logger.error(f"Error adding image {image_path} to PDF: {str(e)}", exc_info=True)
        return False # Indicate failure

def create_pdf_file(topic, result_text):
    pdf_file_path = ""
    try:
        main_content = result_text.strip()
        document_title = topic
        first_line = main_content.split('\n', 1)[0].strip()
        if first_line.startswith('# '):
            document_title = first_line[2:].strip()

        pdf = FPDF()
        default_font_size = 11
        font_name = "Helvetica"
        use_fallback_encoding = True
        try:
            pdf.add_font("DejaVu", "", "DejaVuSans.ttf")
            pdf.add_font("DejaVu", "B", "DejaVuSans-Bold.ttf")
            pdf.add_font("DejaVu", "I", "DejaVuSans-Oblique.ttf")
            font_name = "DejaVu"
            pdf.set_font(font_name, size=default_font_size)
            use_fallback_encoding = False
            logger.info("Using DejaVu font (with Italic) for PDF.")
        except RuntimeError:
            logger.warning("DejaVu font not found or Italic style missing. Falling back to Helvetica.")
            pdf.set_font(font_name, size=default_font_size)

        pdf.add_page()
        line_height = pdf.font_size_pt * 1.25

        # Fetch and Validate Image Info EARLY (Validation now happens IN search_unsplash)
        logger.info(f"Searching for single validated image using base term: {document_title}")
        validated_image_paths = search_unsplash(document_title, num_images=1)
        valid_image_path = None
        if validated_image_paths:
            valid_image_path = validated_image_paths[0]
            logger.info(f"Using validated image path: {valid_image_path}")

        # Write Main Content (Add image after FIRST H2)
        lines = main_content.split('\n')
        is_first_line = True
        image_added = False
        first_h2_found = False

        for line in lines:
            stripped_line = line.strip()
            if use_fallback_encoding:
                processed_line = stripped_line.encode('latin-1', 'replace').decode('latin-1')
            else:
                processed_line = stripped_line

            is_h2_block = False

            if not processed_line:
                if not is_first_line:
                    pdf.ln(line_height * 0.5)
            elif processed_line.startswith('# '):
                pdf.set_font(family=font_name, style='', size=default_font_size + 5)
                pdf.ln(line_height * 0.7)
                pdf.multi_cell(w=pdf.epw, h=line_height, text=processed_line[2:], ln=1, new_x="LMARGIN", new_y="NEXT")
                pdf.set_font(family=font_name, style='', size=default_font_size)
            elif processed_line.startswith('## '):
                pdf.set_font(family=font_name, style='', size=default_font_size + 3)
                pdf.ln(line_height * 0.5)
                pdf.multi_cell(w=pdf.epw, h=line_height, text=processed_line[3:], ln=1, new_x="LMARGIN", new_y="NEXT")
                pdf.set_font(family=font_name, style='', size=default_font_size)
                if not first_h2_found:
                    is_h2_block = True
            elif processed_line.startswith('- ') or processed_line.startswith('* '):
                bullet = "\u2022" if not use_fallback_encoding else "*"
                bullet_point_text = processed_line[2:]
                full_bullet_line = f"{bullet} {bullet_point_text}"
                original_l_margin = pdf.l_margin
                indent = 5
                pdf.set_left_margin(original_l_margin + indent)
                pdf.set_x(original_l_margin + indent)
                pdf.multi_cell(w=pdf.epw - indent, h=line_height, text=full_bullet_line, ln=1, new_x="LMARGIN", new_y="NEXT")
                pdf.set_left_margin(original_l_margin)
                pdf.set_x(original_l_margin)
            else:
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(w=pdf.epw, h=line_height, text=processed_line, ln=1, new_x="LMARGIN", new_y="NEXT")
                pdf.set_x(pdf.l_margin)

            if is_h2_block and not image_added and valid_image_path:
                logger.info("Adding image after the first H2 heading.")
                image_added = _add_image_to_pdf(pdf, valid_image_path)
                first_h2_found = True

            is_first_line = False

        if valid_image_path and not image_added:
            logger.info("No H2 found or image failed to add earlier. Adding image at the end.")
            _add_image_to_pdf(pdf, valid_image_path)

        pdf_dir = "pdf"
        os.makedirs(pdf_dir, exist_ok=True)
        safe_topic = re.sub(r'[^a-zA-Z0-9_]', '', topic).replace(' ', '_')
        pdf_file_name = f"notes_{safe_topic}.pdf"
        pdf_file_path = os.path.join(pdf_dir, pdf_file_name)
        pdf.output(pdf_file_path, 'F')
        logger.info(f"PDF file created: {pdf_file_path}")

    except Exception as e:
        logger.error(f"Failed to create PDF: {e}", exc_info=True)
        return None

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
