'use client';

import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VisitorsPage() {
    const [visitors, setVisitors] = useState([
        { id: 1, name: 'Siti Rahmawati', relation: 'Istri', patient_name: 'Budi Santoso', is_active: true, created_at: '2026-02-25' },
        { id: 2, name: 'Bambang Irawan', relation: 'Anak', patient_name: 'Ahmad Fauzi', is_active: true, created_at: '2026-02-24' },
        { id: 3, name: 'Hasan Ali', relation: 'Anak', patient_name: 'Siti Aminah', is_active: false, created_at: '2026-02-20' },
    ]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen Penunggu Pasien</h1>
                    <p className="text-slate-600">Daftar pengunjung aktif dan riwayat pergantian penunggu.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md shadow-emerald-200">
                    <Plus size={18} className="mr-2" />
                    Registrasi Penunggu
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input placeholder="Cari penunggu atau nama pasien..." className="pl-10 h-11 border-slate-200" />
                </div>
                <Button variant="outline" className="h-11 border-slate-200 font-medium">
                    <Filter size={18} className="mr-2" />
                    Status: Semua
                </Button>
            </div>

            {/* Data Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-left bg-white">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Nama Penunggu</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Relasi</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Nama Pasien</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Tanggal Daftar</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visitors.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-slate-800 font-medium">{v.name}</td>
                                <td className="px-6 py-4 text-slate-600">{v.relation}</td>
                                <td className="px-6 py-4 text-slate-800">{v.patient_name}</td>
                                <td className="px-6 py-4 text-slate-600">{v.created_at}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${v.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                        {v.is_active ? 'Aktif Menunggu' : 'Selesai'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium">
                                        Lihat Dokumen
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
