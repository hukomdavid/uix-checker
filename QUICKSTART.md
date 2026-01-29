# 🚀 QUICK START - Setup dari HP

## Option 1: Replit (TERMUDAH) ⭐

### Langkah 1: Buat Repl
1. Buka **replit.com** di browser HP
2. Sign up/login
3. Klik **+ Create Repl**
4. Pilih **Next.js**
5. Nama: `ux-auditor`
6. Klik **Create Repl**

### Langkah 2: Upload Files
Di Replit, klik ikon **Files** lalu:

**Cara 1: Upload ZIP**
- Download semua file ini sebagai ZIP
- Upload ke Replit
- Extract

**Cara 2: Copy-Paste Manual**
- Buat folder `lib/`, `pages/api/`, `styles/`
- Copy isi tiap file dari GitHub/folder ini
- Paste ke Replit

### Langkah 3: Setup API Key
1. Buka https://ai.google.dev/ (tab baru)
2. Klik **Get API Key in Google AI Studio**
3. Login → **Create API Key**
4. Copy key-nya (mulai dengan `AIza...`)

Di Replit:
1. Klik ikon 🔒 **Secrets** (di sidebar kiri)
2. Tambah secret:
   - Key: `GEMINI_API_KEY`
   - Value: paste key tadi
3. Save

### Langkah 4: Run!
1. Klik tombol **Run** (hijau, di atas)
2. Tunggu install dependencies (2-3 menit pertama kali)
3. Buka preview URL yang muncul
4. DONE! 🎉

---

## Option 2: StackBlitz (Alternatif)

1. Buka **stackblitz.com**
2. Login dengan GitHub
3. Klik **New Project** → **Next.js**
4. Upload files
5. Setup environment di Settings
6. Run

---

## Option 3: GitHub + Vercel (Production)

### Langkah 1: Push ke GitHub
1. Buat repo baru di GitHub (dari HP bisa via browser)
2. Upload semua files
3. Commit

### Langkah 2: Deploy ke Vercel
1. Buka **vercel.com**
2. Sign up with GitHub
3. Import repository
4. Settings → Environment Variables:
   - `GEMINI_API_KEY`: [paste key]
5. Deploy!
6. Dapet URL production (gratis!)

---

## ✅ Checklist Setup

- [ ] Semua files sudah di-upload
- [ ] `GEMINI_API_KEY` sudah diisi
- [ ] `npm install` sudah jalan
- [ ] Server sudah running di port 3000
- [ ] Bisa buka di browser
- [ ] Test audit dengan URL: https://example.com

---

## 🧪 Test Pertama

1. Buka aplikasi di browser
2. Masukkan URL: `https://www.google.com`
3. Klik **Mulai Audit Gratis**
4. Tunggu 30-60 detik
5. Kalau muncul hasil → **SUCCESS!** ✅

---

## ⚠️ Kalau Error

### "Cannot find module"
- Pastikan `package.json` sudah ada
- Run: `npm install`

### "Invalid API Key"
- Cek Gemini API key di Secrets
- Pastikan format: `AIza...` (mulai dengan AIza)

### "Timeout"
- Normal untuk free tier Replit
- Coba lagi atau gunakan website yang lebih cepat

### "AI returned invalid JSON"
- Ini fine, ada fallback logic
- Tetap akan tampilkan hasil scoring matematis

---

## 📱 Tips Coding dari HP

1. **Gunakan landscape mode** untuk layar lebih luas
2. **External keyboard** sangat membantu
3. **Split screen**: browser + code editor
4. **Dark mode** biar mata ga capek
5. **Save sering** biar ga hilang

---

## 🎯 Next Steps

Setelah jalan:
1. ✅ Test dengan berbagai website
2. ✅ Customize prompt di `lib/prompts.js`
3. ✅ Ubah warna/style di `pages/index.js`
4. ✅ Add fitur PageSpeed (opsional)
5. ✅ Deploy ke Vercel production

---

**Need help?** 
- Check `README.md` untuk detail
- Check console log di browser (F12)
- Check Replit logs di Shell

**Happy Coding! 🚀**
