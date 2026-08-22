-- ==========================================
-- Esquema de Base de Datos Supabase para MindUP
-- ==========================================

-- 1. Tabla de Entradas del Diario Mental
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Registros de Estado de Ánimo
CREATE TABLE IF NOT EXISTS public.mood_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mood_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (Lectura y Escritura permitidas para demo)
CREATE POLICY "Permitir acceso público a lecturas de diario" ON public.journal_entries
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de entradas de diario" ON public.journal_entries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir acceso público a registros de ánimo" ON public.mood_logs
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de estados de ánimo" ON public.mood_logs
    FOR INSERT WITH CHECK (true);
