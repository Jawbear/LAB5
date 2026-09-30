# ScholarTrack — Student Scholarship Monitoring and Academic Compliance System

A web-based system for centralized scholarship monitoring, semester grade submissions, compliance checking, deficiency tracking, and management reporting.

## Features

- **Authentication**: Login/logout with role-based access control (Admin, Staff, Scholar)
- **Scholar Management**: Register, search, filter, and update scholar records
- **Scholarship Programs**: Configure requirements per scholarship (GWA, units, failing-grade policy)
- **Grade Submission & Verification**: Submit semester grades → Pending → Verified workflow
- **Compliance Evaluation**: Automated check against scholarship requirements (Philippine grading system)
- **Dashboard**: Live counts for scholars, pending, verified, compliant, and deficiency metrics

## Tech Stack

- **Frontend**: HTML, CSS (vanilla), JavaScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: GitHub Pages

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **SQL Editor** → New Query
3. Paste the contents of `supabase-setup.sql` and click **Run**

### 2. Create Auth User
1. Go to **Authentication** → **Users** → **Add User**
2. Create a user with email/password (e.g., `admin@scholartrack.com` / `password123`)

### 3. Configure Credentials
Edit `js/supabase-config.js`:
```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```
Find these in: **Project Settings** → **API**

### 4. Deploy to GitHub Pages
```bash
git init
git add .
git commit -m "Initialize scholarship monitoring system"
git remote add origin https://github.com/YOUR_USERNAME/scholarship-monitoring.git
git push -u origin main
```
Then enable GitHub Pages: **Settings** → **Pages** → Source: `main` / `/ (root)`

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (extends Supabase Auth) |
| `scholarship_programs` | Scholarship requirements configuration |
| `scholars` | Scholar records with status tracking |
| `grade_submissions` | Semester grade records with verification |

## Compliance Logic

**Philippine Grading System** (documented per lab requirement):
- Lower GWA = better performance (1.00 highest, 5.00 lowest)
- Scholar GWA must be **≤** scholarship's `required_gwa`
- Units enrolled must be **≥** scholarship's `min_units`
- If `allow_failing_grade` is false, failed subjects must be **0**

## Business Rules Implemented

| Rule | Description |
|------|-------------|
| BR-01 | Every scholar must be assigned to an active scholarship program |
| BR-02 | Every scholarship program must define its academic requirements |
| BR-03 | A grade submission must belong to one scholar, academic year, and semester |
| BR-04 | Only authorized personnel may verify submitted grades |
| BR-05 | Only verified submissions may be used for final compliance evaluation |
| BR-06 | A scholar cannot be marked Compliant while requirements are incomplete |
| BR-07 | Scholar status must be based on the rules of the assigned scholarship |
| BR-09 | A submission cannot be verified twice without authorized correction |
| BR-10 | Sensitive grade information must only be visible to authorized users |

## License

Academic project — Systems Analysis and Design Laboratory
