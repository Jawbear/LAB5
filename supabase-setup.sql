-- ============================================
-- ScholarTrack — Supabase Database Setup
-- Student Scholarship Monitoring System
-- ============================================
-- Run this SQL in the Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)
-- ============================================

-- ============================================
-- 1. PROFILES TABLE (extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'scholar')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. SCHOLARSHIP PROGRAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scholarship_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_name TEXT NOT NULL,
    required_gwa NUMERIC(3,2) NOT NULL,  -- Maximum GWA allowed (lower is better, Philippine system)
    min_units INTEGER NOT NULL DEFAULT 0,
    allow_failing_grade BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scholarship_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scholarship programs are viewable by authenticated users"
    ON public.scholarship_programs FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage scholarship programs"
    ON public.scholarship_programs FOR ALL
    USING (auth.role() = 'authenticated');

-- ============================================
-- 3. SCHOLARS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scholars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    degree_program TEXT,
    year_level INTEGER,
    scholarship_id UUID REFERENCES public.scholarship_programs(id),
    status TEXT DEFAULT 'Active' CHECK (status IN (
        'Active', 'Pending Submission', 'For Verification',
        'Compliant', 'With Deficiency', 'Probationary',
        'For Renewal', 'Renewed', 'Disqualified'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scholars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scholars are viewable by authenticated users"
    ON public.scholars FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage scholars"
    ON public.scholars FOR ALL
    USING (auth.role() = 'authenticated');

-- ============================================
-- 4. GRADE SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.grade_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scholar_id UUID NOT NULL REFERENCES public.scholars(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    gwa NUMERIC(3,2) NOT NULL CHECK (gwa >= 1.00 AND gwa <= 5.00),
    units_enrolled INTEGER NOT NULL CHECK (units_enrolled >= 0),
    failed_subjects INTEGER DEFAULT 0 CHECK (failed_subjects >= 0),
    incomplete_subjects INTEGER DEFAULT 0 CHECK (incomplete_subjects >= 0),
    submission_status TEXT DEFAULT 'Pending' CHECK (submission_status IN ('Pending', 'Verified', 'Returned')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    evaluation_result TEXT CHECK (evaluation_result IN ('Compliant', 'With Deficiency')),
    deficiencies TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.grade_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submissions are viewable by authenticated users"
    ON public.grade_submissions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage submissions"
    ON public.grade_submissions FOR ALL
    USING (auth.role() = 'authenticated');

-- ============================================
-- 5. SAMPLE DATA — Scholarship Programs
-- ============================================
INSERT INTO public.scholarship_programs (program_name, required_gwa, min_units, allow_failing_grade, active)
VALUES
    ('DOST-SEI Merit Scholarship', 1.75, 18, false, true),
    ('University Academic Excellence Award', 1.50, 15, false, true),
    ('Government Financial Assistance', 2.50, 12, true, true),
    ('Private Foundation Grant', 2.00, 15, false, true),
    ('Athletic Scholarship', 2.75, 12, true, true);

-- ============================================
-- DONE!
-- ============================================
-- Next steps:
-- 1. Create a user in Supabase Auth (Dashboard > Authentication > Users > Add User)
-- 2. Update js/supabase-config.js with your Project URL and anon key
-- 3. Deploy to GitHub Pages
