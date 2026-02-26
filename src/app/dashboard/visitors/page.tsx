'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl } from '@/lib/api';

type Visitor = {
    id: number;
    name: string;
    relation: string;
    patient_name: string;
    registration_number: string;
    is_active: boolean;
    created_at: string;
};

type ActivePatient = {
    id: number;
    name: string;
    registration_number: string;
};

export default function VisitorsPage() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patients, setPatients] = useState<ActivePatient[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const [formState, setFormState] = useState<{
        patient_id: string;
        name: string;
        nik: string;
        relation: string;
        ktp: File | null;
        kk: File | null;
    }>({
        patient_id: '',
        name: '',
        nik: '',
        relation: '',
        ktp: null,
        kk: null
    });

    const fetchVisitors = async () => {
        setLoading(true);
        try {
            const res = await fetch(apiUrl('/api/visitors'));
            const data = await res.json();
            setVisitors(data);
        } catch (err) {
            console.error('fetchVisitors error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivePatients = async () => {
        try {
            // gunakan pasien yang sudah terverifikasi (Layak Mustahik) sebagai kandidat penunggu
            const res = await fetch(apiUrl('/api/patients?status=Layak Mustahik'));
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('fetchActivePatients error:', err);
            setPatients([]);
        }
    };

    useEffect(() => {
        fetchVisitors();
        fetchActivePatients();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'ktp' | 'kk') => {
        if (e.target.files && e.target.files[0]) {
            setFormState(prev => ({ ...prev, [field]: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formState.nik.length !== 16) {
            setFormError('NIK harus tepat 16 digit sesuai KTP');
            return;
        }
        setIsSubmitting(true);
        setFormError('');

        try {
            const fd = new FormData();
            fd.append('patient_id', formState.patient_id);
            fd.append('name', formState.name);
            fd.append('nik', formState.nik);
            fd.append('relation', formState.relation);
            if (formState.ktp) fd.append('ktp', formState.ktp);
            if (formState.kk) fd.append('kk', formState.kk);

            const res = await fetch(apiUrl('/api/visitors'), {
                method: 'POST',
                body: fd
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal registrasi penunggu');
            }

            setIsModalOpen(false);
            setFormState({
                patient_id: '',
                name: '',
                nik: '',
                relation: '',
                ktp: null,
                kk: null
            });
            window.location.reload();
        } catch (err: any) {
            console.error('submit visitor error:', err);
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-[calc(100vh-8rem)] h-[calc(100vh-8rem)] relative">
            {/* Modal Registrasi Penunggu - Responsive */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 truncate pr-2">
                                Registrasi Penunggu Pasien
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                            {formError && (
                                <div className="mb-3 p-3 rounded-md bg-rose-50 text-rose-700 text-sm border border-rose-200">
                                    {formError}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Pilih Pasien Terverifikasi
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                        value={formState.patient_id}
                                        onChange={e =>
                                            setFormState(prev => ({
                                                ...prev,
                                                patient_id: e.target.value
                                            }))
                                        }
                                        required
                                    >
                                        <option value="">-- Pilih Pasien --</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (Reg: {p.registration_number})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Nama Penunggu
                                    </label>
                                    <Input
                                        value={formState.name}
                                        onChange={e =>
                                            setFormState(prev => ({ ...prev, name: e.target.value }))
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        NIK Penunggu (16 digit)
                                    </label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={16}
                                        value={formState.nik}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormState(prev => ({ ...prev, nik: val }));
                                        }}
                                        placeholder="16 digit NIK sesuai KTP"
                                        required
                                    />
                                    {formState.nik && formState.nik.length !== 16 && (
                                        <p className="text-xs text-amber-600 mt-1">NIK harus tepat 16 digit</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Relasi dengan Pasien
                                    </label>
                                    <Input
                                        placeholder="Istri / Anak / Saudara"
                                        value={formState.relation}
                                        onChange={e =>
                                            setFormState(prev => ({
                                                ...prev,
                                                relation: e.target.value
                                            }))
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Upload KTP Penunggu
                                    </label>
                                    <Input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={e => handleFileChange(e, 'ktp')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Upload KK Penunggu
                                    </label>
                                    <Input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={e => handleFileChange(e, 'kk')}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Penunggu'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 shrink-0">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manajemen Penunggu Pasien</h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Daftar pengunjung aktif dan riwayat pergantian penunggu.
                    </p>
                </div>
                <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md shadow-emerald-200"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={18} className="mr-2" />
                    Registrasi Penunggu
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6 shrink-0">
                <div className="relative flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                    />
                    <Input
                        placeholder="Cari penunggu atau nama pasien..."
                        className="pl-10 h-11 border-slate-200"
                    />
                </div>
                <Button variant="outline" className="h-11 border-slate-200 font-medium">
                    <Filter size={18} className="mr-2" />
                    Status: Semua
                </Button>
            </div>

            {/* Data Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 overflow-x-auto overflow-y-auto min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center h-full py-10 text-slate-500 gap-3">
                        <Loader2 className="animate-spin" size={20} />
                        <span>Memuat data penunggu...</span>
                    </div>
                ) : visitors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                        <p className="font-medium text-slate-600">
                            Belum ada data penunggu untuk ditampilkan.
                        </p>
                        <p className="text-sm mt-1">
                            Registrasi penunggu baru akan muncul di sini.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left bg-white min-w-[640px] sm:min-w-0">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Nama Penunggu</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Relasi</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Nama Pasien / Reg</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Tanggal Daftar</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Status</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm text-right whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visitors.map(v => (
                                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-800 font-medium text-sm">{v.name}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 text-sm">{v.relation}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-800">
                                        <div className="font-medium">{v.patient_name}</div>
                                        <div className="text-xs text-slate-500">
                                            Reg: {v.registration_number}
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 text-sm whitespace-nowrap">
                                        {new Date(v.created_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                v.is_active
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            {v.is_active ? 'Aktif Menunggu' : 'Selesai'}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium"
                                            disabled
                                        >
                                            Lihat Dokumen
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
