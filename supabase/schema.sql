-- ============================================================================
-- MindUP - Esquema de Base de Datos y Seguridad RBAC (Supabase / PostgreSQL)
-- ============================================================================
-- Buenas Prácticas: Código legible, Modularidad, Tipado Fuerte y Seguridad RLS
-- Definición de 3 Roles: Admin, Usuario y Auditor
-- ============================================================================

-- 1. DEFINICIÓN DE ROLES (RBAC - Role-Based Access Control)
CREATE TYPE public.user_role AS ENUM ('admin', 'usuario', 'auditor');

-- 2. TABLA DE PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    rol public.user_role DEFAULT 'usuario'::public.user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA DE ENTRADAS DEL DIARIO MENTAL
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA DE REGISTROS DE ESTADO DE ÁNIMO
CREATE TABLE IF NOT EXISTS public.mood_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    mood_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA DE AUDITORÍA Y TRAZABILIDAD (Especial para rol Auditor)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES public.perfiles(id),
    accion TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', etc.
    tabla_afectada TEXT NOT NULL,
    detalles JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- FUNCIONES AUXILIARES DE SEGURIDAD (Clean Code & Best Practices)
-- ============================================================================

-- Obtener el rol actual del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verificar si el usuario autenticado tiene rol Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND rol = 'admin'::public.user_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verificar si el usuario autenticado tiene rol Auditor
CREATE OR REPLACE FUNCTION public.is_auditor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND rol = 'auditor'::public.user_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS: 1. ROL USUARIO (Solo gestiona sus propios datos)
-- ============================================================================

-- Diario: Usuario solo lee y escribe sus propias entradas
CREATE POLICY "Usuario: Ver solo sus propias entradas de diario"
    ON public.journal_entries FOR SELECT
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuario: Crear sus propias entradas de diario"
    ON public.journal_entries FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuario: Modificar sus propias entradas de diario"
    ON public.journal_entries FOR UPDATE
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuario: Eliminar sus propias entradas de diario"
    ON public.journal_entries FOR DELETE
    USING (auth.uid() = usuario_id);

-- Estado de Ánimo: Usuario solo gestiona sus registros
CREATE POLICY "Usuario: Ver solo sus propios registros de ánimo"
    ON public.mood_logs FOR SELECT
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuario: Crear sus propios registros de ánimo"
    ON public.mood_logs FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- ============================================================================
-- POLÍTICAS RLS: 2. ROL ADMIN (Control total sobre todos los registros)
-- ============================================================================

CREATE POLICY "Admin: Control total en diarios"
    ON public.journal_entries FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin: Control total en estados de ánimo"
    ON public.mood_logs FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin: Gestión total de perfiles"
    ON public.perfiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- POLÍTICAS RLS: 3. ROL AUDITOR (Solo Lectura / Inspección de auditoría)
-- ============================================================================

-- Auditor: Puede LEER todos los diarios para compliance pero NO modificarlos
CREATE POLICY "Auditor: Inspección de solo lectura en diarios"
    ON public.journal_entries FOR SELECT
    TO authenticated
    USING (public.is_auditor());

-- Auditor: Puede LEER todos los registros de ánimo
CREATE POLICY "Auditor: Inspección de solo lectura en estados de ánimo"
    ON public.mood_logs FOR SELECT
    TO authenticated
    USING (public.is_auditor());

-- Auditor: Lectura de logs de auditoría del sistema
CREATE POLICY "Auditor: Lectura completa de logs de auditoría"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_auditor() OR public.is_admin());
