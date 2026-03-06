-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  full_name TEXT,
  avatar_url TEXT,
  logo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- COMANDO PARA CRIAR BUCKET DE LOGOS (Rode isso no SQL Editor):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true);
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'branding');
-- CREATE POLICY "User Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'branding' AND auth.uid() IS NOT NULL);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  niche TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating FLOAT,
  total_ratings INTEGER,
  presence_score INTEGER,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'closed')),
  notes TEXT,
  meta_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads" 
  ON public.leads FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
CREATE POLICY "Users can insert their own leads" 
  ON public.leads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update their own leads" 
  ON public.leads FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can delete their own leads" 
  ON public.leads FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger function to create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- COMANDO PARA TORNAR SUPER ADMIN (Rode isso agora no SQL Editor):
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'helgonhc19@yahoo.com.br';

-- Se o perfil ainda não existir (caso você tenha criado o usuário antes do trigger), rode este:
-- INSERT INTO public.profiles (id, email, role)
-- SELECT id, email, 'super_admin' FROM auth.users WHERE email = 'helgonhc19@yahoo.com.br'
-- ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- COMANDO PARA TORNAR KEVEN ADMIN:
-- INSERT INTO public.profiles (id, email, role)
-- SELECT id, email, 'admin' FROM auth.users WHERE email = 'keven.developer@gmail.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
