import os
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from groq import Groq
import base64
from dotenv import load_dotenv

# Load env from root .env.local if not loaded
# Current file is in /backend, .env.local is in /
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

class VisionService:
    def __init__(self):
        # Support both standard key and VITE prefixed key from .env.local
        self.groq_api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY")
        self.client = None
        if self.groq_api_key:
            try:
                self.client = Groq(api_key=self.groq_api_key)
                print("VisionService: Groq AI Client Initialized")
            except Exception as e:
                print(f"Failed to init Groq client: {e}")
        else:
            print("VisionService: No Groq API Key found (checked GROQ_API_KEY and VITE_GROQ_API_KEY)")

    def analyze_image(self, image_path):
        """
        Analyzes image for location data.
        Priority 1: EXIF Metadata (Precise GPS).
        Priority 2: Visual Analysis via Groq/AI (Landmarks/Text).
        """
        result = {
            "source": None,
            "lat": None,
            "lon": None,
            "description": None,
            "error": None
        }

        # 1. Try EXIF Data
        try:
            exif_data = self._get_exif_data(image_path)
            if exif_data:
                lat, lon = self._get_lat_lon(exif_data)
                if lat and lon:
                    result["source"] = "gps_exif"
                    result["lat"] = lat
                    result["lon"] = lon
                    return result
        except Exception as e:
            print(f"EXIF extraction failed: {e}")

        # 2. visual Analysis (AI)
        # Only proceed if we have a client
        if self.client:
            try:
                description = self._analyze_with_groq(image_path)
                result["source"] = "visual_ai"
                result["description"] = description
                # Note: The coordinates for AI result will be fetched by Geocoding Service later
                # using this description.
                return result
            except Exception as e:
                print(f"AI Analysis failed: {e}")
                result["error"] = f"AI Analysis failed: {str(e)}"
        else:
             result["error"] = "No GPS found and Groq API Key not configured."

        return result

    def _analyze_with_groq(self, image_path):
        """
        Sends image to Groq LLaVA model to identify location.
        """
        # Encode image
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            
        chat_completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this image to identify the EXACT location. Focus on text on signs (English/Hindi), building names, shop boards, and famous landmarks. The context is likely INDIA. Identify the specific place, area, and city. Return ONLY the precise address or location name to be used for geocoding (e.g. 'Chhatrapati Shivaji Maharaj Terminus, Mumbai'). Do not write full sentences."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded_string}",
                            },
                        },
                    ],
                }
            ],
            model="llava-v1.5-7b-4096-preview",
        )
        return chat_completion.choices[0].message.content

    def _get_exif_data(self, image_path):
        image = Image.open(image_path)
        image.verify()
        return image._getexif()

    def _get_lat_lon(self, exif_data):
        """
        Returns the latitude and longitude, if available, from the provided exif_data.
        """
        lat = None
        lon = None

        if exif_data:
            gps_info = {}
            for tag, value in exif_data.items():
                decoded = TAGS.get(tag, tag)
                if decoded == "GPSInfo":
                    for t in value:
                        sub_decoded = GPSTAGS.get(t, t)
                        gps_info[sub_decoded] = value[t]

            if gps_info:
                gps_lat = gps_info.get("GPSLatitude")
                gps_lat_ref = gps_info.get("GPSLatitudeRef")
                gps_lon = gps_info.get("GPSLongitude")
                gps_lon_ref = gps_info.get("GPSLongitudeRef")

                if gps_lat and gps_lat_ref and gps_lon and gps_lon_ref:
                    lat = self._convert_to_degrees(gps_lat)
                    if gps_lat_ref != "N":
                        lat = -lat

                    lon = self._convert_to_degrees(gps_lon)
                    if gps_lon_ref != "E":
                        lon = -lon

        return lat, lon

    def _convert_to_degrees(self, value):
        """
        Helper function to convert the GPS coordinates stored in the EXIF to degress in float format
        """
        d = float(value[0])
        m = float(value[1])
        s = float(value[2])
        return d + (m / 60.0) + (s / 3600.0)

vision_service = VisionService()
