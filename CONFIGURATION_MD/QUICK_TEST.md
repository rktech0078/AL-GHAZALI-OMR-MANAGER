# Quick Testing Steps - Simplified

## 🚀 Abhi Testing Kaise Karein

### Step 1: Server Start Karo
```bash
npm run dev
```

### Step 2: Create Exam
1. Browser mein jao: `http://localhost:3000/teacher/create-exam`
2. Form fill karo:
   - **Exam Name**: "Test Exam 1"
   - **Total Questions**: 20
   - **Passing Marks**: 40
   - **Options**: 4 (A, B, C, D)
3. Click "Create Exam"
4. Automatically redirect hoga upload page pe

### Step 3: Generate OMR PDF (Optional)
Agar PDF generator already hai to:
1. Generate karo OMR PDF
2. Print karo ya screenshot lo
3. Kuch bubbles fill karo (pen se ya digitally)

**Ya phir:**
- Koi bhi sample OMR image use karo testing ke liye

### Step 4: Upload OMR
1. Page pe already ho ge: `http://localhost:3000/teacher/upload-omr`
2. Exam select karo dropdown se
3. **Mobile pe**: "Open Camera" button → Photo lo → Upload
4. **Desktop pe**: "Choose from gallery" → File select karo → Upload

### Step 5: Result Dekho
- Processing complete hone ke baad result dikhega:
  - Marks obtained/total
  - Percentage
  - Grade
  - Pass/Fail status
  - Confidence score

## ✅ Success Check
- [ ] Exam create hua
- [ ] Upload page khula
- [ ] Image upload hua
- [ ] Processing complete hua
- [ ] Result display hua

## ⚠️ Agar Error Aaye
1. Console check karo (F12)
2. Network tab dekho
3. `.env.local` check karo (GEMINI_API_KEY)
4. Mujhe batao error message

**Ab testing shuru karo!** 🎯
