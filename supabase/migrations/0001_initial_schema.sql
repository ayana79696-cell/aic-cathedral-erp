-- AIC Cathedral ERP schema is maintained in Supabase migrations.
-- Production database contains the core academic, learner, staff, assessment and security tables.
-- Apply this migration through Supabase before deploying a fresh environment.
create extension if not exists pgcrypto;
create table if not exists public.school_settings(id uuid primary key default gen_random_uuid(),school_name text not null,currency text default 'KES',created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.academic_years(id uuid primary key default gen_random_uuid(),year int not null,status text default 'active',created_at timestamptz default now());
create table if not exists public.terms(id uuid primary key default gen_random_uuid(),academic_year_id uuid references public.academic_years(id) on delete cascade,name text not null,start_date date,end_date date,status text default 'active');
create table if not exists public.classes(id uuid primary key default gen_random_uuid(),name text not null,level text,academic_year_id uuid references public.academic_years(id),status text default 'active');
create table if not exists public.streams(id uuid primary key default gen_random_uuid(),class_id uuid references public.classes(id) on delete cascade,name text not null);
create table if not exists public.learning_areas(id uuid primary key default gen_random_uuid(),name text not null,code text,category text,active boolean default true);
create table if not exists public.students(id uuid primary key default gen_random_uuid(),admission_number text unique not null,first_name text not null,middle_name text,last_name text not null,gender text,date_of_birth date,admission_date date,class_id uuid references public.classes(id),stream_id uuid references public.streams(id),status text default 'active',photo_url text,created_at timestamptz default now(),updated_at timestamptz default now());
create index if not exists students_class_idx on public.students(class_id);
