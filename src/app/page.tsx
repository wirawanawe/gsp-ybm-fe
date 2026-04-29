'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, FileText, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { apiUrl } from '@/lib/api';

type Slider = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
};

export default function LandingPage() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      const res = await fetch(apiUrl('/api/hero-sliders/public'));
      const data = await res.json();
      setSliders(data);
    } catch (e) {
      console.error('Failed to fetch sliders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliders.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [sliders]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % sliders.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + sliders.length) % sliders.length);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 border-b bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 min-w-0">
          <Image src="/images/logo.jpg" alt="Logo GSP YBM PLN" width={100} height={100} className="rounded-md object-contain w-12 h-12 sm:w-[100px] sm:h-[100px]" />
          <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-800 truncate">
            GSP YBM <span className="text-[#009bb9]">PLN</span>
          </span>
        </div>
        <nav className="flex gap-2 sm:gap-4 shrink-0">
          <Link href="/login">
            <Button variant="ghost" className="font-medium text-[#009bb9] hover:text-[#009bb9]/80 hover:bg-[#009bb9]/10">
              Login Petugas
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Slider Section */}
        <section className="relative h-[600px] md:h-[700px] w-full overflow-hidden bg-slate-900">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#009bb9]/30 border-t-[#009bb9] rounded-full animate-spin" />
            </div>
          ) : sliders.length > 0 ? (
            <>
              {sliders.map((slider, index) => (
                <div
                  key={slider.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                >
                  <div className="absolute inset-0 bg-black/50 z-10" />
                  <img
                    src={apiUrl(slider.image_url)}
                    alt={slider.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                      <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
                        {slider.title}
                      </h1>
                      <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                        {slider.subtitle}
                      </p>
                      <div className="pt-4">
                        <Link href={slider.button_link || '/login'}>
                          <Button size="lg" className="h-14 px-10 text-base rounded-full bg-[#009bb9] hover:bg-[#009bb9]/90 text-white shadow-xl shadow-[#009bb9]/20 transition-all hover:scale-105 active:scale-95">
                            {slider.button_text || 'Masuk Sistem'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sliders.length > 1 && (
                <>
                  <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                    {sliders.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentIndex ? 'bg-[#009bb9] w-8' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            // Fallback Hero
            <div className="relative h-full w-full flex flex-col items-center justify-center text-center px-4 overflow-hidden">
              <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100 via-slate-50 to-slate-50 -z-10" />
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6">
                Layanan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009bb9] to-teal-400">Griya Singgah</span> Pasien
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mb-8">
                Portal pendataan terintegrasi untuk pasien mustahik YBM PLN. Daftar dari mana saja, verifikasi lebih cepat, dan dapatkan pelayanan maksimal.
              </p>
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 rounded-full bg-[#009bb9] hover:bg-[#009bb9]/90">Masuk Sistem</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="px-4 sm:px-6 py-16 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Kemudahan Dalam Satu Platform</h2>
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
                <div className="bg-teal-100 w-14 h-14 rounded-xl flex items-center justify-center text-teal-600 mb-6">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800">Pre-Approved YBM</h3>
                <p className="text-slate-600 leading-relaxed">
                  Sistem 'Pre-Approved' memangkas waktu tunggu dengan menghubungkan Admin YBM untuk memvalidasi kelayakan pasien mustahik.
                </p>
              </div>

              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="bg-amber-100 w-14 h-14 rounded-xl flex items-center justify-center text-amber-600 mb-6">
                  <Activity size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800">Monitoring Real-time</h3>
                <p className="text-slate-600 leading-relaxed">
                  Pantau ketersediaan kamar, status pendaftaran, hingga logistik ambulans secara real-time melalui dashboard pusat.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-[#009bb9] text-slate-400 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.jpg" alt="Logo YBM PLN" width={40} height={40} className="rounded-sm brightness-90 grayscale" />
            <span className="font-bold text-white">GSP YBM PLN</span>
          </div>
          <p className="text-sm text-white">© 2026 Griya Singgah Pasien YBM PLN. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Bantuan</Link>
            <Link href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
