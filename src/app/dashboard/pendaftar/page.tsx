'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, ClipboardList, AlertCircle, FileCheck, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/api';

type Applicant = {
    id: number;
    registration_number: string;
    name: string;
    nik: string;
    phone: string;
    status_verification: string;
    status_rumah_singgah: string;
    created_at: string;
    check_out_date: string | null;
};

export default function PendaftarPage() {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchApplicants = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiUrl('/api/patients/applicants'));
            const data = await res.json();
            if (!res.ok) {
                setError((data as { message?: string })?.message || `Gagal memuat data (${res.status})`);
                setApplicants([]);
                return;
            }
            setApplicants(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Gagal memuat data. Pastikan backend berjalan di port 5001.';
            setError(msg);
            setApplicants([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplicants();
    }, []);

    const filteredApplicants = applicants.filter(p => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            p.nik.toLowerCase().includes(q) ||
            p.registration_number.toLowerCase().includes(q)
        );
    });

    const handleCancel = async (p: Applicant) => {
        if (p.status_rumah_singgah !== 'Menunggu') return;
        const ok = window.confirm(
            `Batalkan pendaftar dengan nomor registrasi ${p.registration_number} atas nama ${p.name}?`
        );
        if (!ok) return;
        try {
            const res = await fetch(apiUrl(`/api/patients/${p.id}/verify`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_verification: 'Rujukan Lain' })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error((data as { message?: string }).message || 'Gagal membatalkan pendaftar');
            }
            await fetchApplicants();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Gagal membatalkan pendaftar');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-[calc(100vh-8rem)] h-[calc(100vh-8rem)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 truncate">
                        <ClipboardList className="text-emerald-600 shrink-0" size={22} />
                        Data Pendaftar
                    </h1>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
                <div className="relative flex-1 min-w-0">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                    />
                    <Input
                        placeholder="Cari berdasarkan nama, NIK, atau No. Registrasi..."
                        className="pl-9 h-10 border-slate-200"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    className="h-10 border-slate-200 text-xs sm:text-sm"
                    onClick={fetchApplicants}
                >
                    <Loader2 size={14} className="mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="bg-slate-50 px-3 sm:px-4 py-3 border-b border-slate-200 shrink-0">
                    <span className="text-sm font-semibold text-slate-700">Daftar Pendaftar</span>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-amber-600 gap-3">
                            <AlertCircle size={24} />
                            <p className="font-medium text-center">{error}</p>
                            <Button variant="outline" size="sm" onClick={fetchApplicants}>
                                Coba Lagi
                            </Button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-slate-500 gap-3">
                            <Loader2 className="animate-spin" size={20} />
                            <span>Memuat data pendaftar...</span>
                        </div>
                    ) : filteredApplicants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400 gap-4">
                            <p className="font-medium text-slate-600">
                                Belum ada data pendaftar.
                            </p>
                            <p className="text-xs text-center max-w-sm">
                                Semua Layak Mustahik (Menunggu, Dirawat, Sudah Pulang) akan muncul di sini. Verifikasi pasien di <strong>Verifikasi Pasien</strong> (pilih Layak Mustahik).
                            </p>
                            <Link href="/dashboard/screening">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <FileCheck size={16} />
                                    Ke Verifikasi Pasien
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm bg-white min-w-[640px] sm:min-w-0">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">No. Registrasi</th>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">Nama / NIK</th>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">Tgl Daftar</th>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">Status Rumah Singgah</th>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">Tanggal Checkout</th>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs text-right whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredApplicants.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-3 sm:px-4 py-3 align-top">
                                            <span className="font-mono text-[11px] font-semibold text-slate-700">
                                                {p.registration_number}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 align-top">
                                            <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">NIK: {p.nik}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">Telp: {p.phone}</div>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 align-top text-xs text-slate-600 whitespace-nowrap">
                                            {new Date(p.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 align-top text-xs">
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full border text-[11px] ${
                                                    p.status_rumah_singgah === 'Dirawat'
                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                        : p.status_rumah_singgah === 'Sudah Pulang'
                                                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}
                                            >
                                                {p.status_rumah_singgah}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 align-top text-xs text-slate-600 whitespace-nowrap">
                                            {p.check_out_date
                                                ? new Date(p.check_out_date).toLocaleDateString('id-ID', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric'
                                                  })
                                                : '–'}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 align-top text-right">
                                            {p.status_rumah_singgah === 'Menunggu' ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-[11px] gap-1 text-rose-700 border-rose-200 hover:bg-rose-50"
                                                    onClick={() => handleCancel(p)}
                                                >
                                                    <XCircle size={12} />
                                                    Batal
                                                </Button>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
