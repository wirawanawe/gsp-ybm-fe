import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeartPulse, ArrowRight, ShieldCheck, FileText, Activity } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <HeartPulse size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">
            GSP YBM <span className="text-emerald-600">PLN</span>
          </span>
        </div>
        <nav className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
              Login Petugas
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-200">
              Daftar Pasien
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 py-24 md:py-32 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-slate-50 to-slate-50 -z-10" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-sm font-medium mb-8 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Sistem Digitalisasi Terpadu
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6">
            Layanan <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Griya Singgah</span> Pasien
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
            Portal pendataan terintegrasi untuk pasien mustahik YBM PLN. Daftar dari mana saja, verifikasi lebih cepat, dan dapatkan pelayanan maksimal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-14 px-8 text-base shadow-lg shadow-emerald-200 rounded-full">
                Mulai Pendaftaran
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base rounded-full border-slate-300 text-slate-700 hover:bg-slate-100">
                Masuk Sistem
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Kemudahan Dalam Satu Platform</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Sistem dirancang untuk menyederhanakan alur operasional dari mulai pendaftaran dokumen hingga check-out pasien.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  <FileText size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800">Verifikasi Dokumen</h3>
                <p className="text-slate-600 leading-relaxed">
                  Upload dokumen rekam medis, KTP, dan SKTM langsung dari perangkat Anda tanpa perlu datang secara fisik untuk screening awal.
                </p>
              </div>

              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="bg-emerald-100 w-14 h-14 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800">Pre-Approved YBM</h3>
                <p className="text-slate-600 leading-relaxed">
                  Sistem 'Pre-Approved' memangkas waktu tunggu dengan menghubungkan Admin YBM untuk memvalidasi kelayakan pasien mustahik.
                </p>
              </div>

              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                  <Activity size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800">Manajemen Kamar</h3>
                <p className="text-slate-600 leading-relaxed">
                  Denah interaktif untuk melihat ketersediaan kamar, mengelola check-in pasien, dan memantau status penunggu.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 border-t bg-white text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Yayasan Baitul Maal PLN. All rights reserved.</p>
      </footer>
    </div>
  );
}
