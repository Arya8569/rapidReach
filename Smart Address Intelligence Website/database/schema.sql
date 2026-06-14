-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table for storing processed addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  original_address TEXT NOT NULL,
  standardized_address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100) NOT NULL,
  address_type TEXT DEFAULT 'mixed' CHECK (address_type IN ('residential', 'commercial', 'industrial', 'mixed')),
  landmarks TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table for nearby services/locations
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add PostGIS geometry columns for spatial queries
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Create triggers to update geometry columns
CREATE OR REPLACE FUNCTION update_address_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_service_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_address_location
  BEFORE INSERT OR UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_address_location();

CREATE TRIGGER trigger_update_service_location
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_service_location();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_location ON public.addresses USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_addresses_status ON public.addresses(status);
CREATE INDEX IF NOT EXISTS idx_addresses_created_at ON public.addresses(created_at);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_location ON public.services USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_services_verified ON public.services(verified);
CREATE INDEX IF NOT EXISTS idx_services_rating ON public.services(rating);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Explicitly disable Row-Level Security (RLS) on all tables for ease of showcase
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

-- Function to handle user creation after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample services data
INSERT INTO public.services (name, description, category, latitude, longitude, address, phone, website, rating, verified) VALUES
('City Hospital', 'Multi-specialty hospital with 24/7 emergency services', 'Healthcare', 28.6139, 77.2090, 'New Delhi, Delhi, India', '+91-11-23456789', 'https://cityhospital.example.com', 4.5, true),
('Tech Park Mall', 'Shopping and entertainment complex', 'Shopping', 12.9716, 77.5946, 'Bangalore, Karnataka, India', '+91-80-23456789', 'https://techpark.example.com', 4.2, true),
('Central Post Office', 'Main postal service center', 'Government', 19.0760, 72.8777, 'Mumbai, Maharashtra, India', '+91-22-23456789', 'https://postoffice.example.com', 3.8, true),
('Green Valley School', 'CBSE affiliated school', 'Education', 26.9124, 75.7873, 'Jaipur, Rajasthan, India', '+91-141-23456789', 'https://greenvalley.example.com', 4.1, true),
('Metro Station', 'Public transportation hub', 'Transport', 22.5726, 88.3639, 'Kolkata, West Bengal, India', '+91-33-23456789', 'https://metro.example.com', 4.3, true);

-- Create a function to find nearby services
CREATE OR REPLACE FUNCTION find_nearby_services(
  lat DECIMAL, 
  lng DECIMAL, 
  radius_km INTEGER DEFAULT 10,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating DECIMAL,
  verified BOOLEAN,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.category,
    s.latitude,
    s.longitude,
    s.address,
    s.phone,
    s.website,
    s.rating,
    s.verified,
    ROUND(
      ST_Distance(
        s.location::geography,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      ) / 1000, 2
    ) AS distance_km
  FROM public.services s
  WHERE 
    ST_DWithin(
      s.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
    AND (category_filter IS NULL OR s.category = category_filter)
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
