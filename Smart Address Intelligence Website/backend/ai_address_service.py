import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

# Load env from root .env.local if not loaded
# Current file is in /backend, .env.local is in /
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

class AddressAIService:
    def __init__(self):
        # Support both standard key and VITE prefixed key from .env.local
        self.groq_api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY")
        self.client = None
        if self.groq_api_key:
            try:
                self.client = Groq(api_key=self.groq_api_key)
                print("AddressAIService: Groq AI Client Initialized")
            except Exception as e:
                print(f"AddressAIService: Failed to initialize Groq client: {e}")
        else:
            print("AddressAIService: GROQ_API_KEY or VITE_GROQ_API_KEY not found in environment.")

    def normalize_address(self, raw_input):
        """
        Uses Groq Llama 3 to normalize and correct the Indian address.
        Returns a dict with 'corrected_address' and 'components'.
        """
        if not self.client:
            print("AddressAIService: Client not initialized, skipping normalization.")
            return None

        prompt = f"""
        You are an AI expert in Indian Address normalization and geographical alignment.
        Your goal is to convert noisy, unstructured, or typo-ridden Indian addresses into a standardized, clean format.
        
        Input Address: "{raw_input}"
        
        Tasks:
        1. GEOGRAPHICAL ALIGNMENT: Match the input address with the closest actual, real existing landmark, building, street, area, station, or city in India. Correct typos phonetically and geographically based on real Indian place names (e.g., 'wes' -> 'West', 'Chembar' -> 'Chembur', 'airol' -> 'Airoli', 'Curr Road' -> 'Currey Road', 'railwa' -> 'Railway').
        2. Expand abbreviations correctly based on local Indian context (e.g. 'Opp.' -> 'Opposite').
        3. AGGRESSIVELY INFER full official names for institutions and stations (e.g. 'Praveen Gandhi' -> 'Usha Pravin Gandhi College of Arts, Science and Commerce', 'VJTI' -> 'Veermata Jijabai Technological Institute', 'Mithibai' -> 'Mithibai College of Arts').
        4. Extract context:
           - house_details (Name of building, flat no)
           - locality (Nagar, Colony, Area, Street)
           - city (City/District)
           - landmark (Nearest famous place, station)
           - pincode (6 digit code)
        
        Output MUST be strict JSON in the following format:
        {{
            "corrected_address": "Full Corrected String (must include Building Name, Flat No, Street, Area, City, Pincode)",
            "components": {{
                "house_details": "...",
                "locality": "...",
                "city": "...",
                "landmark": "...",
                "pincode": "..."
            }}
        }}
        
        Do not explain. Return ONLY the JSON.
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that outputs only valid JSON correction for addresses."
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.1, # Low temperature for consistent output
                response_format={"type": "json_object"} # Force JSON mode if supported or just rely on prompt
            )
            
            content = chat_completion.choices[0].message.content
            # Ensure we parse JSON correctly (sometimes markdown blocks are wrapped)
            return self._parse_json_response(content)

        except Exception as e:
            print(f"AddressAIService: Error calling Groq: {e}")
            return None

    def _parse_json_response(self, content):
        try:
            # Strip potential markdown code blocks
            clean_content = content
            if "```json" in content:
                match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
                if match:
                    clean_content = match.group(1)
            elif "```" in content:
                 match = re.search(r'```\n(.*?)\n```', content, re.DOTALL)
                 if match:
                    clean_content = match.group(1)
            
            return json.loads(clean_content)
        except json.JSONDecodeError as e:
             print(f"AddressAIService: JSON parsing failed: {e}. Content: {content}")
             return None

ai_address_service = AddressAIService()
