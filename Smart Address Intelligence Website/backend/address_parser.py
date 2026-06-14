import nltk
from nltk import ne_chunk, pos_tag, word_tokenize
from nltk.tree import Tree

def parse_address(text):
    """
    Parses the address into structured components using NLTK.
    """
    print(f"--- Parsing: {text}")
    
    cities = []
    landmarks = []
    directional_cues = []

    # 1. Directional Cues Extraction
    normalized_text = text.lower()
    cues = ["near", "behind", "opposite", "opp", "next to", "close to", "adjucent"]
    
    for cue in cues:
        if f" {cue} " in f" {normalized_text} ":
            # Find the index of the cue
            start_index = normalized_text.find(cue)
            if start_index != -1:
                # Extract text after the cue as a potential landmark
                # Heuristic: Take the next 3-4 words or until a comma
                remainder = text[start_index + len(cue):].strip()
                landmark_candidate = remainder.split(',')[0].strip()
                if landmark_candidate:
                    landmarks.append(landmark_candidate)
                    directional_cues.append(f"{cue} {landmark_candidate}")

    # 2. Entity Extraction (GPE - Geo-Political Entity)
    try:
        tokenized = word_tokenize(text)
        tagged = pos_tag(tokenized)
        chunked = ne_chunk(tagged)

        for subtree in chunked:
            if type(subtree) == Tree:
                if subtree.label() == 'GPE':
                    entity = " ".join([token for token, pos in subtree.leaves()])
                    cities.append(entity)
    except Exception as e:
        print(f"NLTK Error: {e}")

    # Deduplicate
    cities = list(set(cities))
    landmarks = list(set(landmarks))

    # 3. Keyword-based Fallback (Crucial for "College", "Hospital", etc. without cues)
    important_keywords = [
        "College", "University", "School", "Hospital", "Clinic", 
        "Cinema", "Mall", "Plaza", "Tower", "Heights", "Residency",
        "Temple", "Mosque", "Church", "Gurudwara", "Station", "Terminus",
        "Stand", "Depot", "Airport", "Park", "Garden", "Lake",
        "Market", "Bazaar", "Road", "Street", "Marg", "Chowk", "Circle", "Point",
        "Building", "Bhavan", "Complex", "Office", "Store", "Shop", "Cafe", "Restaurant", "Hotel"
    ]
    
    # Split by comma to treat segments
    segments = text.split(',')
    
    # 3a. Try Keyword Matching
    for segment in segments:
        segment = segment.strip()
        if not segment: continue
        # If segment contains an important keyword, treat it as a landmark
        for keyword in important_keywords:
            if keyword.lower() in segment.lower():
                landmarks.append(segment)
                break 

    # 3b. Absolute Fallback: If still no landmarks found, trust the first segment
    if not landmarks and len(segments) > 0:
        cleaned_first = segments[0].strip()
        if len(cleaned_first) > 3: # Avoid "Hi" or tiny errors
            print(f"Fallback: Assuming '{cleaned_first}' is the landmark.")
            landmarks.append(cleaned_first)

    return {
        "cities": cities,
        "landmarks": landmarks,
        "directional_cues": directional_cues,
        "original": text
    }

