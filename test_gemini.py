import google.generativeai as genai
import os
from dotenv import load_dotenv

def test_gemini_api():
    try:
        # Load environment variables
        load_dotenv()
        
        # Configure the API key
        GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
        genai.configure(api_key=GOOGLE_API_KEY)
        
        # Test with a simple prompt
        model = genai.GenerativeModel('gemini-1.5-pro')  # Just 'gemini-pro', not 'models/gemini-pro'
        response = model.generate_content("Tell me a short joke about programming.")
        
        print("API Test Successful! Here's the response:\n")
        print(response.text)
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    test_gemini_api()
