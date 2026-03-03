'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Loader2, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl, API_BASE } from '@/lib/api';

type Visitor = {
    id: number;
    name: string;
    nik: string;
    phone?: string | null;
    relation: string;
    patient_name: string;
    registration_number: string;
    is_active: boolean;
    created_at: string;
    ktp_path?: string | null;
    kk_path?: string | null;
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
        phone: string;
        relation: string;
        ktp: File | null;
        kk: File | null;
    }>({
        patient_id: '',
        name: '',
        nik: '',
        phone: '',
        relation: '',
        ktp: null,
        kk: null
    });

    const [editVisitor, setEditVisitor] = useState<Visitor | null>(null);
    const [editForm, setEditForm] = useState<{ name: string; nik: string; phone: string; relation: string }>({
        name: '',
        nik: '',
        phone: '',
        relation: ''
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [docVisitor, setDocVisitor] = useState<Visitor | null>(null);
    const [docUpload, setDocUpload] = useState<{ ktp: File | null; kk: File | null }>({ ktp: null, kk: null });
    const [docUploadLoading, setDocUploadLoading] = useState(false);
    const [docUploadError, setDocUploadError] = useState('');

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
            fd.append('phone', formState.phone);
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
                phone: '',
                relation: '',
                ktp: null,
                kk: null
            });
            fetchVisitors();
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
                {/* <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md shadow-emerald-200"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={18} className="mr-2" />
                    Registrasi Penunggu
                </Button> */}
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
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-800 font-medium text-sm">
                                        {v.name}
                                        {v.phone && (
                                            <div className="text-xs text-slate-500 mt-0.5">{v.phone}</div>
                                        )}
                                    </td>
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
                                        <div className="inline-flex flex-col sm:flex-row gap-1 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-medium gap-1"
                                                disabled={!v.ktp_path && !v.kk_path}
                                                onClick={() => setDocVisitor(v)}
                                            >
                                                <Eye size={14} />
                                                Berkas
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 font-medium gap-1"
                                                onClick={() => {
                                                    setEditVisitor(v);
                                                    setEditForm({
                                                        name: v.name,
                                                        nik: v.nik,
                                                        phone: v.phone || '',
                                                        relation: v.relation
                                                    });
                                                    setEditError('');
                                                }}
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 font-medium gap-1"
                                                onClick={async () => {
                                                    if (!window.confirm(`Hapus penunggu "${v.name}"?`)) return;
                                                    try {
                                                        const res = await fetch(apiUrl(`/api/visitors/${v.id}`), {
                                                            method: 'DELETE'
                                                        });
                                                        const data = await res.json();
                                                        if (!res.ok) {
                                                            throw new Error((data as { message?: string }).message || 'Gagal menghapus penunggu');
                                                        }
                                                        setVisitors(prev => prev.filter(x => x.id !== v.id));
                                                    } catch (err) {
                                                        alert(err instanceof Error ? err.message : 'Gagal menghapus penunggu');
                                                    }
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                Hapus
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Lihat Berkas Penunggu */}
            {docVisitor && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDocVisitor(null)}>
                    <div
                        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-none shadow-xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate pr-2">
                                Berkas Penunggu — {docVisitor.name}
                            </h2>
                            <button onClick={() => setDocVisitor(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                ✕
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                            <div className="space-y-3">
                                {!docVisitor.ktp_path && !docVisitor.kk_path ? (
                                    <p className="text-sm text-slate-500 text-center py-4">
                                        Belum ada berkas KTP/KK yang diunggah untuk penunggu ini.
                                    </p>
                                ) : (
                                    <>
                                        {docVisitor.ktp_path && (
                                            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                                <span className="font-medium text-slate-700 text-sm">KTP Penunggu</span>
                                                <a
                                                    href={docVisitor.ktp_path.startsWith('http') ? docVisitor.ktp_path : `${API_BASE}/${docVisitor.ktp_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-emerald-600 text-xs font-medium hover:underline flex items-center gap-1"
                                                >
                                                    Lihat <Eye size={14} />
                                                </a>
                                            </div>
                                        )}
                                        {docVisitor.kk_path && (
                                            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                                <span className="font-medium text-slate-700 text-sm">KK Penunggu</span>
                                                <a
                                                    href={docVisitor.kk_path.startsWith('http') ? docVisitor.kk_path : `${API_BASE}/${docVisitor.kk_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-emerald-600 text-xs font-medium hover:underline flex items-center gap-1"
                                                >
                                                    Lihat <Eye size={14} />
                                                </a>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="mt-2 pt-3 border-t border-slate-200">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">
                                    Edit / Ganti Berkas
                                </h3>
                                {docUploadError && (
                                    <div className="mb-2 p-2 rounded-md bg-rose-50 text-rose-700 text-xs border border-rose-200">
                                        {docUploadError}
                                    </div>
                                )}
                                <form
                                    className="space-y-3"
                                    onSubmit={async e => {
                                        e.preventDefault();
                                        if (!docVisitor) return;
                                        if (!docUpload.ktp && !docUpload.kk) {
                                            setDocUploadError('Pilih minimal satu file untuk diunggah.');
                                            return;
                                        }
                                        setDocUploadLoading(true);
                                        setDocUploadError('');
                                        try {
                                            const fd = new FormData();
                                            if (docUpload.ktp) fd.append('ktp', docUpload.ktp);
                                            if (docUpload.kk) fd.append('kk', docUpload.kk);
                                            const res = await fetch(apiUrl(`/api/visitors/${docVisitor.id}`), {
                                                method: 'PUT',
                                                body: fd
                                            });
                                            const data = await res.json();
                                            if (!res.ok) {
                                                throw new Error((data as { message?: string }).message || 'Gagal mengupdate berkas penunggu');
                                            }
                                            // refresh list visitors supaya path terbaru terambil
                                            await fetchVisitors();
                                            setDocUpload({ ktp: null, kk: null });
                                            setDocVisitor(null);
                                        } catch (err: any) {
                                            setDocUploadError(err.message || 'Gagal mengupdate berkas penunggu');
                                        } finally {
                                            setDocUploadLoading(false);
                                        }
                                    }}
                                >
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">KTP Penunggu (opsional)</label>
                                        <Input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={e => {
                                                const f = e.target.files?.[0] || null;
                                                setDocUpload(prev => ({ ...prev, ktp: f }));
                                                setDocUploadError('');
                                            }}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">KK Penunggu (opsional)</label>
                                        <Input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={e => {
                                                const f = e.target.files?.[0] || null;
                                                setDocUpload(prev => ({ ...prev, kk: f }));
                                                setDocUploadError('');
                                            }}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="pt-2 flex justify-end gap-2">
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={docUploadLoading || (!docUpload.ktp && !docUpload.kk)}
                                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            {docUploadLoading ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin mr-1" />
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                'Simpan Berkas'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit Penunggu */}
            {editVisitor && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setEditVisitor(null)}>
                    <div
                        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-none shadow-xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate pr-2">
                                Edit Penunggu — {editVisitor.name}
                            </h2>
                            <button onClick={() => setEditVisitor(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                ✕
                            </button>
                        </div>
                        <form
                            onSubmit={async e => {
                                e.preventDefault();
                                if (editForm.nik && editForm.nik.length !== 16) {
                                    setEditError('NIK harus tepat 16 digit sesuai KTP');
                                    return;
                                }
                                if (!editVisitor) return;
                                setEditLoading(true);
                                setEditError('');
                                try {
                                    const res = await fetch(apiUrl(`/api/visitors/${editVisitor.id}`), {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(editForm)
                                    });
                                    const data = await res.json();
                                    if (!res.ok) {
                                        throw new Error((data as { message?: string }).message || 'Gagal mengupdate penunggu');
                                    }
                                    setVisitors(prev =>
                                        prev.map(v =>
                                            v.id === editVisitor.id ? { ...v, ...editForm } : v
                                        )
                                    );
                                    setEditVisitor(null);
                                } catch (err: any) {
                                    setEditError(err.message || 'Gagal mengupdate penunggu');
                                } finally {
                                    setEditLoading(false);
                                }
                            }}
                            className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-3"
                        >
                            {editError && (
                                <div className="mb-2 p-2 rounded-md bg-rose-50 text-rose-700 text-xs border border-rose-200">
                                    {editError}
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">Nama Penunggu</label>
                                <Input
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="h-9"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">NIK Penunggu (16 digit)</label>
                                <Input
                                    value={editForm.nik}
                                    onChange={e =>
                                        setEditForm({ ...editForm, nik: e.target.value.replace(/\D/g, '') })
                                    }
                                    maxLength={16}
                                    className="h-9"
                                />
                                {editForm.nik && editForm.nik.length !== 16 && (
                                    <p className="text-[11px] text-amber-600 mt-0.5">NIK harus tepat 16 digit</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">No HP</label>
                                <Input
                                    value={editForm.phone}
                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">Relasi dengan Pasien</label>
                                <Input
                                    value={editForm.relation}
                                    onChange={e => setEditForm({ ...editForm, relation: e.target.value })}
                                    className="h-9"
                                />
                            </div>
                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setEditVisitor(null)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={editLoading}
                                >
                                    {editLoading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin mr-1" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
