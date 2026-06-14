# RapidReach - Smart Address Intelligence Platform

RapidReach is a production-ready, full-stack web application designed to transform noisy, unstructured, or incomplete address text into precise, geocoded locations in India. By combining advanced AI-driven normalisation (powered by Llama 3 via Groq) and multi-stage OpenStreetMap/Nominatim geocoding, it solves the challenge of locating fuzzy or informal addresses.

---

## 🚀 Features

### Core Capabilities
- **Real-time Address Geocoding**: Converts informal addresses to precise coordinates using Nominatim/OpenStreetMap.
- **AI-Powered Standardisation**: Typo correction, abbreviation expansion, and aggressive entity/institution inference (e.g. mapping `"Curr Road"` to `"Currey Road, Mumbai"`).
- **Fuzzy Database Location Matching**: Matches addresses against locally saved services/locations in a Supabase PostgreSQL backend if standard mapping fails.
- **AI Closest-Match Fallback**: Asks the Groq AI model to identify the closest real location in India for unrecognizable or completely noisy strings, ensuring geocoding never returns blank if a close match exists.
- **Interactive Leaflet Mapping**: Live OpenStreetMap integration with custom markers and drag-and-drop pin refinement.
- **Multilingual Navigation Assistant**: Voice-assisted navigation directions in English, Hindi, and Marathi.
- **AI Logistics Chatbot**: An interactive assistant that understands context and can directly trigger map navigation on user request.
- **User Authentication**: Secure database and user management powered by Supabase.

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** (Vibrant UI/UX, Framer Motion animations)
- **TypeScript** (Type-safe codebase)
- **Tailwind CSS** (Utility-first responsive styling)
- **Leaflet + React-Leaflet** (Interactive mapping engine)
- **Lucide React** (Premium vector icons)

### Backend & Database
- **Flask (Python 3)** (Lightweight, robust REST API)
- **Supabase** (PostgreSQL database, Auth, Storage)
- **PostGIS** (Spatial geography index for distance-based queries)

### AI & Translation
- **Groq Llama 3.3** (Aggressive geographical entity inference & Chatbot)
- **Deep Translator** (Translation layers for Indian regional languages)
- **NLTK (Natural Language Toolkit)** (NLP entity tokenization and parsing)

---

## 📁 Project Structure

```
Smart Address Intelligence Website/
├── Smart Address Intelligence Website/     # Main Application Directory
│   ├── backend/                           # Flask API Backend
│   │   ├── app.py                         # Flask App Entrypoint (0.0.0.0 bind)
│   │   ├── ai_address_service.py          # AI Address Normalizer
│   │   ├── geocoding_service.py           # 9-Strategy Geocoding Waterfall
│   │   └── requirements.txt               # Python Dependencies (incl. Gunicorn)
│   ├── database/                          # DB Schema
│   │   └── schema.sql                     # Simplified schema (RLS Disabled for Showcase)
│   └── src/                               # React Frontend
│       ├── app/                           # Core App Components
│       ├── components/                    # Auth, UI, Chat, Navigation Components
│       ├── hooks/                         # Auth hooks (useAuthWorking)
│       └── services/                      # Supabase client & API services
├── render.yaml                            # Render Blueprint Spec for 1-Click Deployment
└── .gitignore                             # Global Git Exclusion Spec (Secrets Safe)
```

---

## 💻 Local Setup & Installation

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)

### 1. Database Setup
1. Create a new project in [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of [`Smart Address Intelligence Website/database/schema.sql`](./Smart%20Address%20Intelligence%20Website/database/schema.sql), paste it into the editor, and run it. This will set up the spatial extensions, create tables, and populate seed data.

### 2. Environment Variables Configuration
Create a `.env.local` file inside the `Smart Address Intelligence Website` folder:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenStreetMap/Nominatim Configuration
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org

# Groq AI API Configuration
VITE_GROQ_API_KEY=your-groq-api-key
```

### 3. Run the Backend
From the main project directory:
```bash
# Navigate to the main directory
cd "Smart Address Intelligence Website"

# Activate the virtual environment
.\.venv\Scripts\activate

# Start the Flask API server (runs on port 5000)
python backend/app.py
```

### 4. Run the Frontend
In a separate terminal:
```bash
# Navigate to the main directory
cd "Smart Address Intelligence Website"

# Start the Vite Dev server (runs on port 5173)
npm run dev
```

---

## ☁️ Deployment on Render

This project contains a **Render Blueprint Spec** (`render.yaml`). To deploy:

1. Push this codebase to your GitHub repository.
2. Go to the [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect this GitHub repository.
5. Provide your Supabase URL, Supabase Anon Key, and Groq API Key when prompted.
6. Click **Apply**. Render will deploy the backend API and the static frontend, automatically linking them together.
