'use client';

import { useState } from 'react';
import { PieChart, Download, FileSpreadsheet, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
    const [stats] = useState({
        totalPatients: 124,
        activePatients: 8,
        dischargedPatients: 110,
        deceasedPatients: 2,
        referredPatients: 4,
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col min-h-[calc(100vh-8rem)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Laporan Okupansi & Pasien</h1>
                    <p className="text-slate-600">Ringkasan bulanan data pasien masuk, keluar, dan status akhir.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 font-medium">
                        <FileSpreadsheet size={18} className="mr-2 text-emerald-600" />
                        Ekspor CSV
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200">
                        <Download size={18} className="mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">Total Pasien Bulan Ini</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.totalPatients}</h3>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Aktif</span>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">Pasien Sedang Dirawat</p>
                    <h3 className="text-3xl font-black text-emerald-600 mt-1">{stats.activePatients}</h3>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600">
                            <PieChart size={24} />
                        </div>
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">Selesai</span>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">Pasien Sembuh / Pulang</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.dischargedPatients}</h3>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-rose-100 w-12 h-12 rounded-xl flex items-center justify-center text-rose-600">
                            <PieChart size={24} />
                        </div>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">Rujukan Lanjut / Lainnya</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.referredPatients}</h3>
                </div>
            </div>

            <div className="mt-auto border-t border-slate-100 pt-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <PieChart size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Grafik Okupansi</h3>
                    <p className="text-slate-500 max-w-sm mt-2">
                        Integrasi Chart.js atau Recharts dapat ditambahkan di sini untuk visualisasi data okupansi kamar bulanan.
                    </p>
                </div>
            </div>
        </div>
    );
}
