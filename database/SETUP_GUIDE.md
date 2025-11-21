# 🗄️ Database Setup Guide - Step by Step

## 📋 Supabase Database Setup Kaise Karein

### Step 1: Supabase Dashboard Open Karo
1. Browser mein jao: https://supabase.com
2. Login karo
3. Apna project select karo

---

### Step 2: SQL Editor Open Karo
1. Left sidebar mein **"SQL Editor"** pe click karo
2. **"New Query"** button click karo

---

### Step 3: Schema SQL Run Karo

#### Option A: File se Copy Karo
1. File open karo: `database/schema.sql`
2. **Saara SQL copy karo** (Ctrl+A, Ctrl+C)
3. SQL Editor mein **paste karo** (Ctrl+V)
4. **"Run"** button click karo (ya F5 press karo)

#### Option B: Direct Paste Karo
SQL Editor mein yeh paste karo aur Run karo:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables (copy from schema.sql file)
-- ... (complete SQL from schema.sql)
```

---

### Step 4: Storage Bucket Create Karo

1. Left sidebar mein **"Storage"** pe click karo
2. **"Create a new bucket"** button click karo
3. Settings:
   - **Name**: `omr-submissions`
   - **Public**: ❌ **OFF** (private bucket)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/jpeg, image/png`
4. **"Create bucket"** click karo

---

### Step 5: Storage Policies Set Karo

1. Bucket **"omr-submissions"** pe click karo
2. **"Policies"** tab pe jao
3. **"New Policy"** click karo
4. SQL Editor mein yeh run karo:

```sql
-- Upload policy
CREATE POLICY "Users can upload OMR images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'omr-submissions' AND
    auth.role() = 'authenticated'
  );

-- View policy
CREATE POLICY "Users can view own OMR images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'omr-submissions' AND
    auth.role() = 'authenticated'
  );
```

---

### Step 6: Verify Tables Created

SQL Editor mein yeh query run karo:

```sql
-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Output** (7 tables):
- ✅ `exams`
- ✅ `omr_sheets`
- ✅ `questions`
- ✅ `results`
- ✅ `schools`
- ✅ `submissions`
- ✅ `users`

---

### Step 7: Create Test User with Teacher Role

#### 7.1: Signup via Your App
1. Go to: `http://localhost:3000/signup`
2. Create account with email/password
3. Note the email you used

#### 7.2: Update User Role to Teacher
SQL Editor mein run karo:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE public.users 
SET role = 'teacher' 
WHERE email = 'your-email@example.com';
```

---

### Step 8: Verify Setup Complete

Run these queries:

```sql
-- Check users table
SELECT id, email, role FROM public.users;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'omr-submissions';
```

---

## ✅ Setup Complete Checklist

- [ ] SQL schema run kiya
- [ ] 7 tables create hue
- [ ] Storage bucket `omr-submissions` create hua
- [ ] Storage policies set kiye
- [ ] Test user create kiya
- [ ] User role `teacher` set kiya
- [ ] Verification queries run kiye

---

## 🎯 Ab Testing Karo

1. **Login karo** as teacher: `http://localhost:3000/login`
2. **Create exam**: `http://localhost:3000/teacher/create-exam`
3. **Upload OMR**: `http://localhost:3000/teacher/upload-omr`

---

## ⚠️ Common Issues

### Issue 1: "relation does not exist"
**Solution**: Schema SQL properly run nahi hua. Dobara run karo.

### Issue 2: "permission denied"
**Solution**: RLS policies set nahi hain. Storage policies wala SQL run karo.

### Issue 3: "bucket not found"
**Solution**: Storage bucket create karo (Step 4).

### Issue 4: User role update nahi ho raha
**Solution**: 
```sql
-- Check if user exists
SELECT * FROM auth.users WHERE email = 'your-email@example.com';

-- Then update in public.users
UPDATE public.users 
SET role = 'teacher' 
WHERE email = 'your-email@example.com';
```

---

## 📞 Help Needed?

Agar koi step clear nahi hai ya error aa raha hai to:
1. Error message copy karo
2. Mujhe batao
3. Main fix karunga

**Database setup ke baad testing shuru kar sakte ho!** 🚀
