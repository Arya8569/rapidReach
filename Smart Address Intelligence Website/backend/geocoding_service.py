import requests
import os
from dotenv import load_dotenv

# Load env variables from root .env.local if not loaded
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

def geocode_address(parsed_data):
    """
    Implements the 9-Strategy Waterfall Geocoding Pipeline
    """
    attempts_log = []
    
    # Extract components from parsed data (which now includes AI-normalized components)
    original_text = parsed_data.get('original', '')
    
    # Merged components from AI and Regex
    ai_comps = parsed_data.get('ai_components', {})
    
    # Priority Extraction
    landmark = ai_comps.get('landmark') or (parsed_data.get('landmarks')[0] if parsed_data.get('landmarks') else None)
    locality = ai_comps.get('locality')
    city = ai_comps.get('city') or (parsed_data.get('cities')[0] if parsed_data.get('cities') else None)
    corrected_address = ai_comps.get('corrected_address') or original_text
    
    # --- Strategy 1: Exact Landmark Match (Confidence: 1.0) ---
    if landmark and city:
        query = f"{landmark}, {city}"
        result = _call_nominatim(query)
        attempts_log.append({"stage": "Strategy 1: Exact Landmark", "query": query, "success": bool(result), "result": result})
        if result: return result, attempts_log

    # --- Strategy 2: Locality Match (Confidence: 0.9) ---
    if locality and city:
        query = f"{locality}, {city}"
        result = _call_nominatim(query)
        attempts_log.append({"stage": "Strategy 2: Locality", "query": query, "success": bool(result), "result": result})
        if result: return result, attempts_log
    
    # --- Strategy 3: Full Text Fallback (Confidence: 0.8) ---
    queries_to_try = []
    if corrected_address and corrected_address != original_text:
        queries_to_try.append(corrected_address)
    if original_text:
        queries_to_try.append(original_text)
        
    for query in queries_to_try:
        result = _call_nominatim(query)
        attempts_log.append({"stage": "Strategy 3: Full Text", "query": query, "success": bool(result), "result": result})
        if result: return result, attempts_log

    # --- Strategy 4: City Fallback (Confidence: 0.5) ---
    if city:
        query = city
        result = _call_nominatim(query)
        attempts_log.append({"stage": "Strategy 4: City Fallback", "query": query, "success": bool(result), "result": result})
        if result: return result, attempts_log

    # --- Strategy 5: Recursive Comma Drill-Down (Confidence: 0.7 - 0.1*i) ---
    parts = original_text.split(',')
    if len(parts) > 1:
        for i in range(1, len(parts)):
            sub_query = ",".join(parts[i:]).strip()
            if not sub_query: continue
            
            result = _call_nominatim(sub_query)
            attempts_log.append({"stage": f"Strategy 5: Comma Drill-Down L{i}", "query": sub_query, "success": bool(result), "result": result})
            if result: return result, attempts_log

    # --- Strategy 6: Recursive Word Drill-Down (Front) ---
    words = original_text.split()
    if len(words) > 1:
        for i in range(1, min(len(words), 5)):
             sub_query = " ".join(words[i:]).strip()
             result = _call_nominatim(sub_query)
             attempts_log.append({"stage": f"Strategy 6: Word Drill-Down Front L{i}", "query": sub_query, "success": bool(result), "result": result})
             if result: return result, attempts_log

    # --- Strategy 7: Reverse Word Drill-Down (Back) ---
    if len(words) > 1:
        for i in range(1, min(len(words), 3)):
             sub_query = " ".join(words[:-i]).strip()
             result = _call_nominatim(sub_query)
             attempts_log.append({"stage": f"Strategy 7: Word Drill-Down Back L{i}", "query": sub_query, "success": bool(result), "result": result})
             if result: return result, attempts_log

    # --- Strategy 8: Database Fuzzy Closest Match (Confidence: 0.6) ---
    db_result = find_closest_db_service(original_text)
    attempts_log.append({"stage": "Strategy 8: DB Closest Match", "query": original_text, "success": bool(db_result), "result": db_result})
    if db_result:
        return db_result, attempts_log

    # --- Strategy 9: AI Closest Indian Match Fallback (Confidence: 0.7) ---
    ai_corrected = ai_closest_match_india(original_text)
    if ai_corrected:
        result = _call_nominatim(ai_corrected)
        attempts_log.append({"stage": "Strategy 9: AI Closest Indian Match", "query": ai_corrected, "success": bool(result), "result": result})
        if result:
            result["display_name"] = f"{result['display_name']} (Closest Match: {ai_corrected})"
            return result, attempts_log

    return None, attempts_log

def _call_nominatim(query):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
        "countrycodes": "in", # Strict India restriction
        "viewbox": "68.1,6.5,97.4,35.5", 
        "bounded": 1
    }
    headers = {
        "User-Agent": "SmartAddressIntelligence/1.0"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data:
                return {
                    "lat": data[0].get('lat'),
                    "lon": data[0].get('lon'),
                    "display_name": data[0].get('display_name'),
                    "confidence_score": 1.0 if "station" in query.lower() or "landmark" in query.lower() else 0.8
                }
    except Exception as e:
        print(f"Geocoding Error: {e}")
    
    return None

def reverse_geocode(lat, lon):
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json",
    }
    headers = {
        "User-Agent": "SmartAddressIntelligence/1.0"
    }
    try:
        response = requests.get(url, params=params, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data:
                return {
                    "lat": str(lat),
                    "lon": str(lon),
                    "display_name": data.get('display_name'),
                    "confidence_score": 1.0 
                }
    except Exception as e:
        print(f"Reverse Geocoding Error: {e}")
    return None

def fetch_db_services():
    supabase_url = os.environ.get("VITE_SUPABASE_URL")
    supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY")
    if not supabase_url or not supabase_key:
        return []
    
    url = f"{supabase_url}/rest/v1/services"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching services from DB: {e}")
    return []

def get_similarity(str1, str2):
    # Lowercase and split into words
    words1 = set(str1.lower().replace(',', ' ').replace('.', ' ').split())
    words2 = set(str2.lower().replace(',', ' ').replace('.', ' ').split())
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)

def find_closest_db_service(address_text):
    try:
        services = fetch_db_services()
        if not services:
            return None
        
        best_match = None
        best_score = 0.0
        
        for service in services:
            name_score = get_similarity(address_text, service.get('name', ''))
            addr_score = get_similarity(address_text, service.get('address', ''))
            score = max(name_score, addr_score)
            
            if score > best_score:
                best_score = score
                best_match = service
                
        # Return if similarity is reasonably high
        if best_match and best_score >= 0.25:
            return {
                "lat": str(best_match.get('latitude')),
                "lon": str(best_match.get('longitude')),
                "display_name": f"{best_match.get('name')} - {best_match.get('address')} (Database Match)",
                "confidence_score": round(best_score, 2)
            }
    except Exception as e:
        print(f"Error finding closest DB service: {e}")
    return None

def ai_closest_match_india(address_text):
    groq_api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY")
    if not groq_api_key:
        return None
    
    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
        
        prompt = f"""
        You are an AI expert in Indian geography, landmarks, and logistics.
        The user entered an address or location in India that is incomplete, noisy, or completely unrecognizable: "{address_text}".
        
        Your task is to identify the closest actual, real existing landmark, building, street, area, village, town, or city in India.
        
        CRITICAL RULES:
        1. You MUST ALWAYS return a valid, real existing location in India.
        2. Do NOT say 'No match found', 'Not Available', or 'Unknown'.
        3. If the input is completely unrecognizable or garbage text (e.g., "qxwzry pmnqvt"), you MUST guess the closest resembling real location, city, or landmark in India (e.g., 'Dwarka', 'Mumbai', 'Delhi', 'Kolkata', 'Bangalore', or a matching phonetic/spelling guess).
        4. Return ONLY the corrected, real matching address in India as a plain text string, and nothing else. Do not explain or add markdown.
        """
        
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You output only the closest matching real address in India as a plain string."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=100
        )
        
        corrected = completion.choices[0].message.content.strip()
        corrected = corrected.strip('"').strip("'")
        print(f"AI Closest Match Fallback: '{address_text}' -> '{corrected}'")
        return corrected
    except Exception as e:
        print(f"Error in AI Closest Match: {e}")
        return None
