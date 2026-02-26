'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, IdCard, AlertCircle, FileText, Eye, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiUrl, API_BASE } from '@/lib/api';

type Patient = {
    id: number;
    name: string;
    nik: string;
    phone: string;
    address: string;
    registration_number?: string;
};

type Doc = { id: number; document_type: string; file_path: string };

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [berkasPatient, setBerkasPatient] = useState<Patient | null>(null);
    const [documents, setDocuments] = useState<Doc[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);

    const fetchPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiUrl('/api/patients'));
            const data = await res.json();
            if (!res.ok) {
                setError((data as { message?: string })?.message || `Gagal memuat data (${res.status})`);
                setPatients([]);
                return;
            }
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Gagal memuat data. Pastikan backend berjalan di port 5001.';
            setError(msg);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const openBerkas = async (p: Patient) => {
        setBerkasPatient(p);
        setDocsLoading(true);
        setDocuments([]);
        try {
            const res = await fetch(apiUrl(`/api/patients/${p.id}/documents`));
            const data = await res.json();
            setDocuments(Array.isArray(data) ? data : []);
        } catch {
            setDocuments([]);
        } finally {
            setDocsLoading(false);
        }
    };

    const filteredPatients = patients.filter(p => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            p.nik.toLowerCase().includes(q) ||
            (p.registration_number && p.registration_number.toLowerCase().includes(q))
        );
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-[calc(100vh-8rem)] h-[calc(100vh-8rem)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 truncate">
                        <IdCard className="text-emerald-600 shrink-0" size={22} />
                        Data Pasien
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Rekap pasien yang pernah mendaftar di sistem GSP. No. Registrasi hanya tampil di Data Pendaftar.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
                <div className="relative flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                    />
                    <Input
                        placeholder="Cari berdasarkan nama atau NIK..."
                        className="pl-9 h-10 border-slate-200"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    className="h-10 border-slate-200 text-xs sm:text-sm"
                    onClick={() => fetchPatients()}
                >
                    <Loader2 size={14} className="mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="bg-slate-50 px-3 sm:px-4 py-3 border-b border-slate-200 shrink-0">
                    <span className="text-sm font-semibold text-slate-700">Daftar Pasien</span>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-amber-600 gap-3">
                            <AlertCircle size={24} />
                            <p className="font-medium text-center">{error}</p>
                            <Button variant="outline" size="sm" onClick={fetchPatients}>
                                Coba Lagi
                            </Button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-slate-500 gap-3">
                            <Loader2 className="animate-spin" size={20} />
                            <span>Memuat data pasien...</span>
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                            <p className="font-medium text-slate-600">
                                Belum ada data pasien yang sesuai.
                            </p>
                            <p className="text-xs mt-1">
                                Coba ubah kata kunci pencarian.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm bg-white min-w-[520px] sm:min-w-0">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">Nama</th>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">NIK</th>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">Telp</th>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">Alamat</th>
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs w-28 shrink-0">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPatients.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 align-top font-medium text-slate-800">
                                            {p.name}
                                        </td>
                                        <td className="px-4 py-3 align-top text-slate-600">
                                            {p.nik}
                                        </td>
                                        <td className="px-4 py-3 align-top text-slate-600">
                                            {p.phone}
                                        </td>
                                        <td className="px-4 py-3 align-top text-slate-600 max-w-[200px] truncate" title={p.address}>
                                            {p.address}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs gap-1"
                                                onClick={() => openBerkas(p)}
                                            >
                                                <FileText size={14} />
                                                Lihat Berkas
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal Lihat Berkas - Responsive */}
            {berkasPatient && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setBerkasPatient(null)}>
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-none shadow-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate pr-2">Berkas — {berkasPatient.name}</h2>
                            <button onClick={() => setBerkasPatient(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <XCircle size={22} />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
                            {docsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-emerald-500" size={28} />
                                </div>
                            ) : documents.length === 0 ? (
                                <p className="text-slate-500 text-center py-6">Belum ada berkas untuk pasien ini.</p>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                                            <span className="font-medium text-slate-700 text-sm">{doc.document_type}</span>
                                            <a
                                                href={`${API_BASE}/${doc.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-emerald-600 text-xs font-medium hover:underline flex items-center gap-1"
                                            >
                                                Lihat <Eye size={14} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

