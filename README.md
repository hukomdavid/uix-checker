# 🎯 UX Auditor - Free MVP

Analisis UX website secara otomatis menggunakan AI (Gemini) dengan scoring matematis untuk mengurangi beban AI.

## ✨ Fitur

- ✅ **Audit Gratis** dari URL website
- 📊 **Scoring Otomatis** (Content, Layout, CTA, Accessibility)
- 🤖 **AI Analysis** dengan 3 "otak": Analyzer, Storyteller, Recommender
- 🎨 **UI Sederhana** dengan Tailwind CSS
- ⚡ **Ringan & Cepat** (target 30-60 detik per audit)

## 🏗️ Arsitektur

```
Pipeline Audit:
1. Crawler (fetch HTML) → 5-8 detik
2. Scorer (pure math) → instant
3. AI Analysis:
   - Analyzer → ~3 detik
   - Storyteller → ~3 detik
   - Recommender → ~3 detik
4. Return hasil
```

## 🚀 Setup di Replit

### 1. Buat Repl Baru
- Buka replit.com
- Pilih template: **Next.js**
- Nama: `ux-auditor-free`

### 2. Copy Semua File
Copy semua file dari folder ini ke Replit:

```
ux-auditor/
├── pages/
│   ├── _app.js
│   ├── index.js
│   └── api/
│       └── audit.js
├── lib/
│   ├── crawler.js
│   ├── scorer.js
│   ├── gemini.js
│   └── prompts.js
├── styles/
│   └── globals.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

### 3. Setup Environment Variables

Di Replit, buka **Secrets** (ikon 🔒) dan tambahkan:

```bash
GEMINI_API_KEY=your_key_here
```

**Cara dapat Gemini API Key:**
1. Buka https://ai.google.dev/
2. Klik "Get API Key"
3. Login dengan Google
4. Generate API key (GRATIS, 60 requests/menit)
5. Copy key-nya

### 4. Install Dependencies

Klik tombol **Run** atau ketik di Shell:

```bash
npm install
```

### 5. Jalankan

```bash
npm run dev
```

Buka di browser: `https://[your-repl-name].[your-username].repl.co`

## 📝 Cara Pakai

1. Masukkan URL website (contoh: `https://example.com`)
2. Klik "Mulai Audit Gratis"
3. Tunggu 30-60 detik
4. Lihat hasil:
   - **Skor UX** total dan breakdown
   - **Analisis** masalah yang ditemukan
   - **Rekomendasi** perbaikan prioritas

## 🔧 Troubleshooting

### Timeout / Request Too Long
- Replit free tier punya timeout ~60 detik
- Jika website target terlalu lambat, audit akan gagal
- Solusi: coba website lain yang lebih cepat

### Error: "AI returned invalid JSON"
- Gemini kadang return format yang sedikit beda
- Sudah ada fallback logic untuk handle ini
- Akan tampilkan hasil basic dari scoring matematis saja

### Gemini API Quota
- Free tier: 60 requests/menit
- Jika over, tunggu 1 menit
- Atau upgrade ke paid tier (optional)

## 🎨 Customization

### Ubah Bobot Scoring
Edit `lib/scorer.js`:

```javascript
// Di function calculateScores()
const total = Math.round(
  (content.score * 0.30) +  // ubah bobot di sini
  (layout.score * 0.25) +
  (cta.score * 0.25) +
  (accessibility.score * 0.20)
);
```

### Ubah Prompt AI
Edit `lib/prompts.js`:

```javascript
export function getAnalyzerPrompt(data) {
  return `You are a UX Expert... [customize prompt]`;
}
```

### Ubah UI
Edit `pages/index.js` - pakai Tailwind classes

## 🚀 Deploy ke Vercel (Production)

1. Push code ke GitHub
2. Buka vercel.com
3. Import repository
4. Tambah Environment Variable:
   ```
   GEMINI_API_KEY=your_key
   ```
5. Deploy!

## 📊 Rumus Scoring

### Content Clarity (0-100)
- H1 presence & quality: 40 poin
- Meta description: 15 poin
- Text ratio: 10 poin
- Placeholder check: -10 poin
- Paragraph count: 10 poin
- Title: 15 poin

### Layout & Hierarchy (0-100)
- Heading structure: 35 poin
- CTA density: 25 poin
- Content organization: 20 poin
- Image presence: 20 poin

### Actionability / CTA (0-100)
- CTA presence: 20 poin
- CTA text quality: 30 poin
- CTA competition: 30 poin
- Button usage: 20 poin

### Accessibility (0-100)
- Color contrast: 60 poin
- Alt text: 20 poin
- Font size: 10 poin
- Form labels: 10 poin

## 🛣️ Roadmap

**V1 (Current - MVP Gratis)**
- ✅ Audit from URL
- ✅ Basic scoring
- ✅ AI analysis
- ✅ Simple UI

**V2 (Next)**
- ⏳ Upload screenshot/image
- ⏳ PageSpeed integration
- ⏳ PDF report download
- ⏳ Save history (Supabase)

**V3 (Berbayar)**
- Multi-page audit
- Analytics integration
- Performance monitoring
- Custom reports

## 💡 Tips Optimasi

1. **Caching**: Simpan hasil audit per URL (24 jam)
2. **Rate Limiting**: Max 3-5 audit/hari untuk free user
3. **Async Processing**: Gunakan job queue untuk audit berat
4. **Fallback**: Jika AI gagal, tetap tampilkan scoring matematis

## 🤝 Contributing

Ini MVP open untuk di-improve! Silakan fork dan customize sesuai kebutuhan.

## 📄 License

MIT - Bebas dipakai & dimodifikasi

---

**Made with ☕ + 🤖 (Claude Sonnet 4.5 + Gemini)**

Dari HP, deploy ke Replit, gratis, cepat! 🚀
