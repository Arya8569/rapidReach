import sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except:
    pass
print("DEBUG: Starting app.py execution...", flush=True)
from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator
import nltk
from address_parser import parse_address
from geocoding_service import geocode_address, reverse_geocode
from vision_service import vision_service
import os
import uuid

# ... (omitted)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    try:
        # Check if 'image' is in request files
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
            
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Save temporarily
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}_{image_file.filename}"
        filepath = os.path.join(temp_dir, filename)
        image_file.save(filepath)

        print(f"=== PROCESSING IMAGE: {filename} ===")

        # Analyze
        analysis_result = vision_service.analyze_image(filepath)
        
        # Cleanup
        try:
            os.remove(filepath)
        except:
            pass
            
        final_result = {
            "source": analysis_result.get("source"), # 'gps_exif' or 'visual_ai'
            "description": analysis_result.get("description"),
            "location": None,
            "error": analysis_result.get("error")
        }

        # Resolution Strategy
        if final_result["source"] == "gps_exif":
            print("--- SOURCE: EXIF ---")
            # Precise GPS found -> Get Address
            lat = analysis_result["lat"]
            lon = analysis_result["lon"]
            address_info = reverse_geocode(lat, lon) # Returns {lat, lon, display_name...}
            final_result["location"] = address_info
            
        elif final_result["source"] == "visual_ai":
            print("--- SOURCE: VISUAL AI ---")
            description = final_result["description"]
            print(f"AI RAW DESCRIPTION: {description}")
            
            # Simple wrapper to match expected input for geocode_address
            # 1. Parse
            mock_parsed = parse_address(description)
            print(f"PARSED DATA: {mock_parsed}")
            
            # 2. Geocode
            geocoded, logs = geocode_address(mock_parsed)
            print(f"GEOCODE RESULT: {geocoded}")
            
            # 3. Fallback: Raw Search if Geocoding Failed and Description exists
            if not geocoded and description:
                print("Geocoding failed. Trying raw fallback search...")
                from geocoding_service import _call_nominatim
                # Try searching the raw description (sanitized)
                # Take first line or reasonable length
                raw_query = description.split('\n')[0].strip()
                if len(raw_query) > 100: raw_query = raw_query[:100]
                
                print(f"Attempting Raw Query: {raw_query}")
                raw_result = _call_nominatim(raw_query)
                if raw_result:
                    print(f"Raw fallback success! {raw_result}")
                    geocoded = raw_result
                else:
                     print("Raw fallback failed.")
            
            final_result["location"] = geocoded
            
        return jsonify(final_result)

    except Exception as e:
        print(f"Image analysis error: {e}")
        return jsonify({'error': str(e)}), 500

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('chunkers/maxent_ne_chunker')
    nltk.data.find('taggers/averaged_perceptron_tagger')
    nltk.data.find('corpora/words')
except LookupError:
    print("Downloading NLTK data...")
    nltk.download('punkt')
    nltk.download('maxent_ne_chunker')
    nltk.download('averaged_perceptron_tagger')
    nltk.download('words')
    nltk.download('punkt_tab')
    nltk.download('averaged_perceptron_tagger_eng')
    nltk.download('maxent_ne_chunker_tab')

@app.route('/analyze', methods=['POST'])
def analyze_address():
    try:
        data = request.json
        original_text = data.get('address', '')
        
        if not original_text:
            return jsonify({'error': 'No address provided'}), 400

        print(f"=== PROCESSING: {original_text} ===")

        # 1. Translation Layer
        # Heuristic: If text is mostly ASCII (English), skip translation to avoid "airol" -> "on an oar" errors
        def is_mostly_english(text):
            try:
                # Calculate percentage of ASCII characters
                ascii_chars = len([c for c in text if ord(c) < 128])
                return (ascii_chars / len(text)) > 0.8
            except:
                return False

        if is_mostly_english(original_text):
            print(f"Input detected as English/ASCII. Skipping translation.")
            translated_text = original_text
        else:
            try:
                translated_text = GoogleTranslator(source='auto', target='en').translate(original_text)
                print(f"Translated: {translated_text}")
                
                # Sanity Check: If translation is drastically different length or looks like a hallucination
                # (e.g. "airol" 5 chars -> "on an oar" 9 chars with spaces), maybe fallback?
                # For now, English check above solves the specific "airol" case.
            except Exception as e:
                print(f"Translation failed: {e}")
                translated_text = original_text

        # 2. AI Normalization Layer (New Step 1 from Pipeline)
        from ai_address_service import ai_address_service
        ai_result = ai_address_service.normalize_address(translated_text)
        print(f"AI Result: {ai_result}")

        # 3. Parsing Layer
        # Parse the *corrected* address if available, or just parse original to get base entities
        # We pass both to the geocoder via the combined dict
        parsing_result = parse_address(translated_text)
        
        # Merge AI components
        if ai_result:
             parsing_result['ai_components'] = ai_result.get('components', {})
             parsing_result['ai_corrected_address'] = ai_result.get('corrected_address')
             # Also update 'original' for fallbacks if correction is better? 
             # No, keep original as original.
        print(f"Combined Parsing Result: {parsing_result}")

        # 4. Geocoding Layer (7-Strategy Waterfall)
        geocoding_result, attempts_log = geocode_address(parsing_result)
        print(f"Geocoding Result: {geocoding_result}")

        response = {
            'original_text': original_text,
            'translated_text': translated_text,
            'parsing_result': parsing_result,
            'geocoding_result': geocoding_result,
            'attempts_log': attempts_log
        }

        return jsonify(response)

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/translate', methods=['POST'])
def translate_text():
    try:
        data = request.json
        text = data.get('text', '')
        target_lang = data.get('target_lang', 'en')
        
        if not text:
            return jsonify({'translated_text': ''})
            
        # Map simple codes to deep_translator codes if needed
        # deep_translator uses standard codes: 'hi', 'mr', 'en'
        
        translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
        return jsonify({'translated_text': translated})
    except Exception as e:
        print(f"Translation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        language = data.get('language', 'English')
        history = data.get('history', [])
        
        # Initialize Groq (reuse from ai_address_service logic or new instance)
        # Using environment key directly for simplicity in this endpoint
        groq_key = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY")
        if not groq_key:
            return jsonify({'response': "AI System Error: API Key missing."}), 500
            
        from groq import Groq
        client = Groq(api_key=groq_key)
        
        # Construct System Prompt
        system_prompt = f"""
        You are 'Smart Address AI', a helpful Indian logistics assistant.
        
        CRITICAL RULES:
        1. You MUST reply ONLY in the language: {language}.
        2. If {language} is Hindi/Marathi/etc, use the script (Devanagari) or Hinglish as per user tone, but prefer formal script.
        
        YOUR KNOWLEDGE:
        - This app is "Smart Address Intelligence".
        - Features: Address Normalization (fixing addresses), Visual Navigation (Blue Map), Saved Addresses, Voice Navigation.
        - You help users understand how to use the app or find locations.
        
        NAVIGATION ACTION:
        - If the user explicitly asks to "Go to X", "Navigate to X from Y", "Directions for X", or "Show map for X":
        - You MUST NOT just chat. You must output a SPECIAL JSON BLOCK to trigger the map.
        - Format: {{"action": "navigate", "source": "User Location", "destination": "extracted_destination", "reply_text": "Navigating..."}}
        - If source is not provided, assume "Current Location".
        
        EXAMPLE 1 (User: "How does this app work?"):
        Output: This app helps delivery drivers find exact locations. You can speak an address, and we fix it using AI. Then we give you a route.
        
        EXAMPLE 2 (User: "Go to Andheri Station"):
        Output: {{"action": "navigate", "source": "Current Location", "destination": "Andheri Station", "reply_text": "Opening Google Maps for Andheri Station..."}}
        
        EXAMPLE 3 (User: "Navigate from chemical factory to airport"):
        Output: {{"action": "navigate", "source": "chemical factory", "destination": "airport", "reply_text": "Redirecting to route..."}}
        
        If NO navigation is needed, just reply normally in plain text (no JSON wrapper needed, just string).
        
        User input: {user_message}
        """
        
        # Simple non-history context for now to save tokens, or append last 2 messages
        messages = [{"role": "system", "content": system_prompt}]
        # Add history if needed (optional)
        
        messages.append({"role": "user", "content": user_message})
        
        completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=200
        )
        
        ai_response = completion.choices[0].message.content
        
        # Check if response is JSON (Navigation Action)
        import json
        try:
            # Llama might wrap in ```json ... ```
            clean_response = ai_response
            if "```" in ai_response:
                import re
                match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if match:
                    clean_response = match.group(0)
            
            # Try parse
            action_data = json.loads(clean_response)
            if "action" in action_data and action_data["action"] == "navigate":
                return jsonify(action_data)
        except:
            pass # Not JSON, just normal text
            
        return jsonify({'response': ai_response})

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
