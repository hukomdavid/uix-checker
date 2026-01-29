import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Audit failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>UX Auditor - Free Website Analysis</title>
        <meta name="description" content="Analisis UX website gratis dengan AI" />
      </Head>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎯 UX Auditor
          </h1>
          <p className="text-xl text-gray-600">
            Analisis UX website Anda secara gratis dengan AI
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Dapatkan skor, analisis, dan rekomendasi perbaikan dalam hitungan detik
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Masukkan URL Website
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔍 Sedang menganalisis...' : '🚀 Mulai Audit Gratis'}
            </button>
          </form>

          {/* Loading State with Steps */}
          {loading && (
            <div className="mt-8">
              <div className="max-w-md mx-auto">
                <LoadingProgress />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-red-800 font-semibold mb-2">❌ Terjadi Kesalahan</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Statistics Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">📈 Ringkasan Audit</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard 
                  icon="🔍"
                  label="Elemen Dianalisis"
                  value="47+"
                />
                <StatCard 
                  icon="⚠️"
                  label="Masalah Ditemukan"
                  value={result.analysis.issues.length}
                />
                <StatCard 
                  icon="💡"
                  label="Rekomendasi"
                  value={result.recommendations.length}
                />
                <StatCard 
                  icon="⏱️"
                  label="Waktu Analisis"
                  value="45 detik"
                />
              </div>
            </div>

            {/* Score Overview */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                📊 Skor UX
              </h2>
              
              {/* Total Score */}
              <div className="text-center mb-8 pb-8 border-b">
                <div className="inline-block">
                  <div className="relative">
                    <svg className="w-48 h-48" viewBox="0 0 200 200">
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke={getScoreColor(result.scores.total)}
                        strokeWidth="12"
                        strokeDasharray={`${(result.scores.total / 100) * 565} 565`}
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold text-gray-900">
                        {result.scores.total}
                      </div>
                      <div className="text-sm text-gray-500">dari 100</div>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-4 font-semibold">Skor UX Total</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {getScoreLabel(result.scores.total)}
                  </p>
                </div>
              </div>

              {/* Score Breakdown with Progress Bars */}
              <div className="space-y-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Detail Penilaian
                </h3>
                <ScoreProgressBar 
                  label="Content Clarity" 
                  score={result.scores.content}
                  description="Kejelasan konten, struktur heading, meta description"
                  icon="📝"
                />
                <ScoreProgressBar 
                  label="Layout & Hierarchy" 
                  score={result.scores.layout}
                  description="Organisasi visual, hierarki informasi, struktur halaman"
                  icon="🎨"
                />
                <ScoreProgressBar 
                  label="Actionability (CTA)" 
                  score={result.scores.cta}
                  description="Kejelasan call-to-action, kemudahan mencapai tujuan"
                  icon="🎯"
                />
                <ScoreProgressBar 
                  label="Accessibility" 
                  score={result.scores.accessibility}
                  description="Kontras warna, alt text, ukuran font, label form"
                  icon="♿"
                />
              </div>

              {/* Methodology */}
              <details className="bg-gray-50 rounded-lg p-6 cursor-pointer">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  🔬 Metodologi Penilaian
                </summary>
                <div className="mt-4 text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Skor dihitung berdasarkan:</strong>
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Content Clarity (30%): Struktur heading, meta tags, rasio teks</li>
                    <li>Layout & Hierarchy (25%): Organisasi visual, kepadatan elemen</li>
                    <li>Actionability (25%): Kualitas CTA, kejelasan aksi</li>
                    <li>Accessibility (20%): WCAG 2.1 lite - kontras, alt text, font size</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Proses audit:</strong> Crawling HTML → Analisis matematis (47+ parameter) → 
                    AI analysis dengan 3 model spesialis (Analyzer, Storyteller, Recommender)
                  </p>
                </div>
              </details>

              {/* Narrative */}
              <div className="bg-blue-50 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  💬 Ringkasan Analisis
                </h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {result.narrative}
                </p>
              </div>
            </div>

            {/* Technical Evidence */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🔍 Data & Evidence
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <EvidenceCard 
                  title="Struktur Konten"
                  items={[
                    { label: 'Heading H1', value: result.metadata.h1 || 'Tidak ada' },
                    { label: 'Meta Description', value: result.metadata.meta_description ? '✓ Ada' : '✗ Tidak ada' },
                    { label: 'Jumlah Gambar', value: result.metadata.image_count }
                  ]}
                />
                <EvidenceCard 
                  title="Interaksi"
                  items={[
                    { label: 'Call-to-Action', value: `${result.metadata.cta_count} CTA` },
                    { label: 'Form', value: `${result.metadata.form_count} form` },
                    { label: 'URL Diaudit', value: result.title }
                  ]}
                />
              </div>
            </div>

            {/* PageSpeed Performance (if available) */}
            {result.performance && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  ⚡ Performance (PageSpeed Insights)
                </h2>
                
                {/* Overall Performance Score */}
                <div className="text-center mb-8 pb-8 border-b">
                  <div className="inline-block">
                    <div className="relative">
                      <svg className="w-40 h-40" viewBox="0 0 200 200">
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="12"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke={getScoreColor(result.performance.overall)}
                          strokeWidth="12"
                          strokeDasharray={`${(result.performance.overall / 100) * 502} 502`}
                          strokeLinecap="round"
                          transform="rotate(-90 100 100)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-4xl font-bold text-gray-900">
                          {result.performance.overall}
                        </div>
                        <div className="text-xs text-gray-500">Performance</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile vs Desktop */}
                {result.performance.mobile && result.performance.desktop && (
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        📱 Mobile
                      </h3>
                      <div className="space-y-2">
                        <PerformanceBar label="Performance" score={result.performance.mobile.performance} />
                        <PerformanceBar label="Accessibility" score={result.performance.mobile.accessibility} />
                        <PerformanceBar label="Best Practices" score={result.performance.mobile.bestPractices} />
                        <PerformanceBar label="SEO" score={result.performance.mobile.seo} />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        💻 Desktop
                      </h3>
                      <div className="space-y-2">
                        <PerformanceBar label="Performance" score={result.performance.desktop.performance} />
                        <PerformanceBar label="Accessibility" score={result.performance.desktop.accessibility} />
                        <PerformanceBar label="Best Practices" score={result.performance.desktop.bestPractices} />
                        <PerformanceBar label="SEO" score={result.performance.desktop.seo} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Metrics */}
                {result.performance.metrics && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4">📊 Core Web Vitals</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <MetricCard 
                        label="FCP"
                        value={formatTime(result.performance.metrics.fcp)}
                        description="First Contentful Paint"
                      />
                      <MetricCard 
                        label="LCP"
                        value={formatTime(result.performance.metrics.lcp)}
                        description="Largest Contentful Paint"
                      />
                      <MetricCard 
                        label="CLS"
                        value={result.performance.metrics.cls?.toFixed(3) || '0'}
                        description="Cumulative Layout Shift"
                      />
                      <MetricCard 
                        label="TBT"
                        value={formatTime(result.performance.metrics.tbt)}
                        description="Total Blocking Time"
                      />
                      <MetricCard 
                        label="SI"
                        value={formatTime(result.performance.metrics.si)}
                        description="Speed Index"
                      />
                    </div>
                  </div>
                )}

                {/* Opportunities */}
                {result.performance.opportunities && result.performance.opportunities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">💡 Peluang Peningkatan</h3>
                    <div className="space-y-3">
                      {result.performance.opportunities.map((opp, idx) => (
                        <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-1">{opp.title}</h4>
                          <p className="text-sm text-gray-600">{opp.description}</p>
                          {opp.savings > 0 && (
                            <p className="text-xs text-yellow-700 mt-2">
                              Potential savings: ~{formatTime(opp.savings)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-6 text-center">
                  Data from Google PageSpeed Insights
                </p>
              </div>
            )}

            {/* Issues */}
            {result.analysis.issues.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  🔍 Masalah yang Ditemukan
                </h2>
                <div className="space-y-4">
                  {result.analysis.issues.map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} />
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  💡 Rekomendasi Perbaikan
                </h2>
                <div className="space-y-4">
                  {result.recommendations.map((rec, idx) => (
                    <RecommendationCard key={idx} rec={rec} index={idx} />
                  ))}
                </div>
              </div>
            )}

            {/* Audit Another */}
            <div className="text-center">
              <button
                onClick={() => {
                  setResult(null);
                  setUrl('');
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg transition"
              >
                🔄 Audit Website Lain
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>UX Auditor - Free MVP Version</p>
          <p className="mt-2">Powered by Gemini AI & Next.js</p>
        </footer>
      </main>
    </div>
  );
}

// Performance Bar Component
function PerformanceBar({ label, score }) {
  const getColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{score}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, description }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    </div>
  );
}

// Format time helper
function formatTime(ms) {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Loading Progress Component
function LoadingProgress() {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: '🔍', label: 'Mengambil data website...', duration: 3000 },
    { icon: '📊', label: 'Menganalisis struktur halaman...', duration: 5000 },
    { icon: '🎨', label: 'Memeriksa layout & hierarki...', duration: 8000 },
    { icon: '♿', label: 'Mengevaluasi aksesibilitas...', duration: 12000 },
    { icon: '🤖', label: 'AI sedang menganalisis...', duration: 20000 },
    { icon: '💡', label: 'Menyusun rekomendasi...', duration: 25000 },
    { icon: '✨', label: 'Menyelesaikan laporan...', duration: 30000 },
  ];

  useState(() => {
    const timers = steps.map((step, index) => 
      setTimeout(() => setCurrentStep(index), step.duration)
    );
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg">
      <div className="text-center mb-6">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`flex items-center transition-all duration-500 ${
              index <= currentStep ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-500 ${
              index < currentStep 
                ? 'bg-green-100' 
                : index === currentStep 
                ? 'bg-blue-100 scale-110' 
                : 'bg-gray-100'
            }`}>
              {index < currentStep ? '✓' : step.icon}
            </div>
            <div className="ml-4 flex-1">
              <p className={`font-medium transition-all duration-500 ${
                index === currentStep ? 'text-blue-600 text-lg' : 'text-gray-600'
              }`}>
                {step.label}
              </p>
            </div>
            {index === currentStep && (
              <div className="flex-shrink-0">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Estimasi waktu: <span className="font-semibold">30-60 detik</span>
        </p>
        <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 transition-all duration-1000 ease-linear"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function getScoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score) {
  if (score >= 80) return '🎉 Excellent';
  if (score >= 60) return '👍 Good';
  if (score >= 40) return '⚠️ Needs Improvement';
  return '🚨 Critical';
}

// Stat Card Component
function StatCard({ icon, label, value }) {
  return (
    <div className="text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-90 mt-1">{label}</div>
    </div>
  );
}

// Score Progress Bar Component
function ScoreProgressBar({ label, score, description, icon }) {
  const getColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBgColor = (score) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className={`${getBgColor(score)} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{label}</h4>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900">{score}</div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// Evidence Card Component
function EvidenceCard({ title, items }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start">
            <span className="text-sm text-gray-600">{item.label}:</span>
            <span className="text-sm font-medium text-gray-900 text-right ml-4">
              {typeof item.value === 'string' && item.value.length > 50 
                ? item.value.substring(0, 50) + '...' 
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Score Card Component (keeping for backward compatibility)
function ScoreCard({ label, score, icon }) {
  const getColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-3xl font-bold ${getColor(score)}`}>
        {score}
      </div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

// Issue Card Component
function IssueCard({ issue }) {
  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    major: 'bg-orange-100 text-orange-800 border-orange-200',
    minor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const severityIcons = {
    critical: '🚨',
    major: '⚠️',
    minor: '⚡',
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 ${severityColors[issue.severity]}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3">{severityIcons[issue.severity]}</span>
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="text-xs font-semibold uppercase mr-2">
              {issue.severity}
            </span>
            <span className="text-xs px-2 py-1 bg-white rounded">
              {issue.category}
            </span>
          </div>
          <p className="font-medium mb-1">{issue.description}</p>
          <p className="text-sm opacity-75">{issue.evidence}</p>
        </div>
      </div>
    </div>
  );
}

// Recommendation Card Component
function RecommendationCard({ rec, index }) {
  const impactColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-gray-100 text-gray-800',
  };

  const effortColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
          {index + 1}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {rec.title}
          </h3>
          <p className="text-gray-700 mb-4">
            {rec.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${impactColors[rec.impact]}`}>
              Impact: {rec.impact}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${effortColors[rec.effort]}`}>
              Effort: {rec.effort}
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-800">
              {rec.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
