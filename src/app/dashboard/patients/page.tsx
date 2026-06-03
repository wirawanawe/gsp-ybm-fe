'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, IdCard, AlertCircle, FileText, Eye, XCircle, Upload, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiUrl, API_BASE, authFetch } from '@/lib/api';

const DOC_TYPES = [
    { id: 'ktp', label: 'KTP Pasien' },
    { id: 'kk', label: 'Kartu Keluarga (KK)' },
    { id: 'bpjs', label: 'BPJS Kesehatan' },
    { id: 'sktm', label: 'SKTM' },
    { id: 'rujukan', label: 'Surat Rujukan RS' }
] as const;

type Patient = {
    id: number;
    name: string;
    nik: string;
    phone: string;
    address: string;
    registration_number?: string;
    dob?: string | null;
    gender?: string | null;
    rt_rw?: string | null;
    kelurahan?: string | null;
    kecamatan?: string | null;
    kabupaten?: string | null;
    provinsi?: string | null;
    diagnosis?: string | null;
    treatment_plan?: string | null;
    occupation?: string | null;
    income?: string | null;
    age_category?: string | null;
    age?: string | number | null;
    education?: string | null;
    disease_category?: string | null;
    rs_rujukan?: string | null;
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
    const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({
        ktp: null, kk: null, bpjs: null, sktm: null, rujukan: null
    });
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const [editPatient, setEditPatient] = useState<Patient | null>(null);
    const [editForm, setEditForm] = useState<{
        name: string;
        nik: string;
        phone: string;
        address: string;
        dob: string;
        gender: string;
        rt_rw: string;
        kelurahan: string;
        kecamatan: string;
        kabupaten: string;
        provinsi: string;
        diagnosis: string;
        treatment_plan: string;
        occupation: string;
        income: string;
        age_category: string;
        age: string;
        education: string;
        disease_category: string;
        rs_rujukan: string;
    }>({
        name: '',
        nik: '',
        phone: '',
        address: '',
        dob: '',
        gender: 'Laki-laki',
        rt_rw: '',
        kelurahan: '',
        kecamatan: '',
        kabupaten: '',
        provinsi: '',
        diagnosis: '',
        treatment_plan: '',
        occupation: '',
        income: '',
        age_category: '',
        age: '',
        education: '',
        disease_category: '',
        rs_rujukan: ''
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    const fetchPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(apiUrl('/api/patients'));
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
        setUploadFiles({ ktp: null, kk: null, bpjs: null, sktm: null, rujukan: null });
        setUploadError('');
        setDocsLoading(true);
        setDocuments([]);
        try {
            const res = await authFetch(apiUrl(`/api/patients/${p.id}/documents`));
            const data = await res.json();
            setDocuments(Array.isArray(data) ? data : []);
        } catch {
            setDocuments([]);
        } finally {
            setDocsLoading(false);
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        if (!berkasPatient) return;
        if (!window.confirm('Yakin ingin menghapus berkas ini? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            const res = await authFetch(apiUrl(`/api/patients/${berkasPatient.id}/documents/${docId}`), {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal menghapus berkas');
            }
            const docsRes = await authFetch(apiUrl(`/api/patients/${berkasPatient.id}/documents`));
            const list = await docsRes.json();
            setDocuments(Array.isArray(list) ? list : []);
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus berkas');
        }
    };

    const hasDocType = (docType: { id: string; label: string }) =>
        documents.some(d =>
            d.document_type === docType.label ||
            d.document_type?.toLowerCase().includes(docType.id)
        );

    const handleUploadBerkas = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!berkasPatient) return;
        const toSend = Object.entries(uploadFiles).filter(([, f]) => f) as [string, File][];
        if (toSend.length === 0) {
            setUploadError('Pilih minimal satu file untuk diunggah.');
            return;
        }
        setUploadLoading(true);
        setUploadError('');
        try {
            const fd = new FormData();
            toSend.forEach(([key, file]) => fd.append(key, file));
            const res = await authFetch(apiUrl(`/api/patients/${berkasPatient.id}/documents`), {
                method: 'POST',
                body: fd
            });
            const data = await res.json();
            if (!res.ok) throw new Error((data as { message?: string }).message || 'Gagal mengunggah berkas');
            setUploadFiles({ ktp: null, kk: null, bpjs: null, sktm: null, rujukan: null });
            const docsRes = await authFetch(apiUrl(`/api/patients/${berkasPatient.id}/documents`));
            const list = await docsRes.json();
            setDocuments(Array.isArray(list) ? list : []);
        } catch (err: any) {
            setUploadError(err.message || 'Gagal mengunggah berkas');
        } finally {
            setUploadLoading(false);
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

    const openEdit = (p: Patient) => {
        setEditPatient(p);
        setEditForm({
            name: p.name,
            nik: p.nik,
            phone: p.phone,
            address: p.address,
            dob: p.dob ? p.dob.slice(0, 10) : '',
            gender: p.gender || 'Laki-laki',
            rt_rw: p.rt_rw || '',
            kelurahan: p.kelurahan || '',
            kecamatan: p.kecamatan || '',
            kabupaten: p.kabupaten || '',
            provinsi: p.provinsi || '',
            diagnosis: p.diagnosis || '',
            treatment_plan: p.treatment_plan || '',
            occupation: p.occupation || '',
            income: p.income || '',
            age_category: p.age_category || '',
            age: p.age ? String(p.age) : '',
            education: p.education || '',
            disease_category: p.disease_category || '',
            rs_rujukan: p.rs_rujukan || ''
        });
        setEditError('');
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editPatient) return;
        setEditLoading(true);
        setEditError('');
        try {
            const res = await authFetch(apiUrl(`/api/patients/${editPatient.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error((data as { message?: string }).message || 'Gagal mengupdate pasien');
            }
            setPatients(prev =>
                prev.map(p => (p.id === editPatient.id ? { ...p, ...editForm } : p))
            );
            setEditPatient(null);
        } catch (err: any) {
            setEditError(err.message || 'Gagal mengupdate pasien');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (p: Patient) => {
        if (!window.confirm(`Yakin ingin menghapus pasien "${p.name}"? Data terkait (berkas, penunggu, riwayat inap) juga akan terhapus.`)) {
            return;
        }
        try {
            const res = await authFetch(apiUrl(`/api/patients/${p.id}`), {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error((data as { message?: string }).message || 'Gagal menghapus pasien');
            }
            setPatients(prev => prev.filter(pt => pt.id !== p.id));
            if (berkasPatient?.id === p.id) {
                setBerkasPatient(null);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Gagal menghapus pasien');
        }
    };

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
                                    <th className="px-3 sm:px-4 py-3 font-semibold text-slate-700 text-xs w-40 shrink-0">Aksi</th>
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
                                            <div className="flex flex-col sm:flex-row gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs gap-1"
                                                    onClick={() => openBerkas(p)}
                                                >
                                                    <FileText size={14} />
                                                    Berkas
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs gap-1"
                                                    onClick={() => openEdit(p)}
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs gap-1 text-rose-700 border-rose-200 hover:bg-rose-50"
                                                    onClick={() => handleDelete(p)}
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
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {documents.length === 0 ? (
                                            <p className="text-slate-500 text-center py-4 text-sm">Belum ada berkas untuk pasien ini. Gunakan form di bawah untuk melampirkan.</p>
                                        ) : (
                                            documents.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                                                    <span className="font-medium text-slate-700 text-sm">{doc.document_type}</span>
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={doc.file_path.startsWith('http') ? doc.file_path : `${API_BASE}/${doc.file_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-emerald-600 text-xs font-medium hover:underline flex items-center gap-1"
                                                        >
                                                            Lihat <Eye size={14} />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDeleteDocument(doc.id)}
                                                            className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-rose-50 transition-colors"
                                                            title="Hapus Berkas"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Edit / Lampirkan Berkas */}
                                    <div className="mt-6 pt-4 border-t border-slate-200">
                                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                                            <Upload size={16} className="text-emerald-600" />
                                            Edit Berkas — Lampirkan atau Ganti File
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-3">
                                            Pilih file untuk jenis berkas yang belum terlampir atau untuk mengganti file yang ada. Format: JPG, PNG, atau PDF. Maks. 5MB.
                                        </p>
                                        {uploadError && (
                                            <div className="mb-3 p-2 rounded-md bg-rose-50 text-rose-700 text-xs border border-rose-200">
                                                {uploadError}
                                            </div>
                                        )}
                                        <form onSubmit={handleUploadBerkas} className="space-y-3">
                                            {DOC_TYPES.map(docType => (
                                                <div key={docType.id} className="flex flex-wrap items-center gap-2">
                                                    <Input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.pdf"
                                                        className="hidden"
                                                        id={`doc-${docType.id}-${berkasPatient.id}`}
                                                        onChange={e => {
                                                            const f = e.target.files?.[0];
                                                            setUploadFiles(prev => ({ ...prev, [docType.id]: f || null }));
                                                            setUploadError('');
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`doc-${docType.id}-${berkasPatient.id}`}
                                                        className="cursor-pointer text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-2"
                                                    >
                                                        {uploadFiles[docType.id]?.name || docType.label}
                                                    </label>
                                                    {hasDocType(docType) && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                            <CheckCircle2 size={12} /> Terlampir
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="pt-2 flex justify-end">
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    disabled={uploadLoading || !Object.values(uploadFiles).some(Boolean)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                                >
                                                    {uploadLoading ? (
                                                        <>
                                                            <Loader2 size={14} className="animate-spin mr-2" />
                                                            Mengunggah...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload size={14} className="mr-2" />
                                                            Simpan Berkas
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit Pasien */}
            {editPatient && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setEditPatient(null)}>
                    <div
                        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-none shadow-xl overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate pr-2">
                                Edit Pasien — {editPatient.name}
                            </h2>
                            <button onClick={() => setEditPatient(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <XCircle size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-3">
                            {editError && (
                                <div className="mb-2 p-2 rounded-md bg-rose-50 text-rose-700 text-xs border border-rose-200">
                                    {editError}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Nama</label>
                                    <Input
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="h-9"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">NIK</label>
                                    <Input
                                        value={editForm.nik}
                                        onChange={e => setEditForm({ ...editForm, nik: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Tanggal Lahir</label>
                                    <Input
                                        type="date"
                                        value={editForm.dob}
                                        onChange={e => {
                                            const dob = e.target.value;
                                            let ageStr = '';
                                            let ageCat = '';
                                            if (dob) {
                                                const birth = new Date(dob);
                                                const today = new Date();
                                                let ageNum = today.getFullYear() - birth.getFullYear();
                                                const m = today.getMonth() - birth.getMonth();
                                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) ageNum--;
                                                ageStr = String(ageNum);
                                                if (ageNum <= 4) ageCat = 'Balita';
                                                else if (ageNum <= 17) ageCat = 'Anak';
                                                else if (ageNum <= 59) ageCat = 'Dewasa';
                                                else ageCat = 'Lansia';
                                            }
                                            setEditForm({ ...editForm, dob, age_category: ageCat, age: ageStr });
                                        }}
                                        className="h-9"
                                    />
                                </div>
                                 <div className="space-y-1">
                                     <label className="text-xs text-slate-500">Usia</label>
                                     <Input
                                         value={editForm.age ? `${editForm.age} tahun` : '-'}
                                         readOnly
                                         className="h-9 bg-slate-50 text-slate-600"
                                     />
                                     <p className="text-[10px] text-slate-500">Otomatis dari Tanggal Lahir</p>
                                 </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Jenis Kelamin</label>
                                    <select
                                        value={editForm.gender}
                                        onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                        className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
                                    >
                                        <option value="Laki-laki">Laki-laki</option>
                                        <option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Telepon</label>
                                    <Input
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">RT/RW</label>
                                    <Input
                                        value={editForm.rt_rw}
                                        onChange={e => setEditForm({ ...editForm, rt_rw: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Kelurahan</label>
                                    <Input
                                        value={editForm.kelurahan}
                                        onChange={e => setEditForm({ ...editForm, kelurahan: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Kecamatan</label>
                                    <Input
                                        value={editForm.kecamatan}
                                        onChange={e => setEditForm({ ...editForm, kecamatan: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Kabupaten/Kota</label>
                                    <Input
                                        value={editForm.kabupaten}
                                        onChange={e => setEditForm({ ...editForm, kabupaten: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Provinsi</label>
                                    <Input
                                        value={editForm.provinsi}
                                        onChange={e => setEditForm({ ...editForm, provinsi: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs text-slate-500">RS Rujukan / Asal Faskes</label>
                                    <Input
                                        value={editForm.rs_rujukan}
                                        onChange={e => setEditForm({ ...editForm, rs_rujukan: e.target.value })}
                                        className="h-9"
                                        placeholder="Contoh: RSUD dr. Soetomo, dll."
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs text-slate-500">Alamat</label>
                                    <Input
                                        value={editForm.address}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs text-slate-500">Diagnosa</label>
                                    <Input
                                        value={editForm.diagnosis}
                                        onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs text-slate-500">Rencana Tindakan</label>
                                    <Input
                                        value={editForm.treatment_plan}
                                        onChange={e => setEditForm({ ...editForm, treatment_plan: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Pekerjaan</label>
                                    <Input
                                        value={editForm.occupation}
                                        onChange={e => setEditForm({ ...editForm, occupation: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Penghasilan</label>
                                    <Input
                                        value={editForm.income}
                                        onChange={e => setEditForm({ ...editForm, income: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Pendidikan</label>
                                    <Input
                                        value={editForm.education}
                                        onChange={e => setEditForm({ ...editForm, education: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Kategori Usia</label>
                                    <Input
                                        value={editForm.age_category || '-'}
                                        readOnly
                                        className="h-9 bg-slate-50 text-slate-600"
                                    />
                                    <p className="text-[10px] text-slate-500">Otomatis dari Tanggal Lahir</p>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs text-slate-500">Kategori Penyakit</label>
                                    <Input
                                        value={editForm.disease_category}
                                        onChange={e => setEditForm({ ...editForm, disease_category: e.target.value })}
                                        className="h-9"
                                        placeholder="Contoh: Kanker, Non-Kanker, dll."
                                    />
                                </div>
                            </div>
                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setEditPatient(null)}
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
                                        <>
                                            <CheckCircle2 size={14} className="mr-1" />
                                            Simpan
                                        </>
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

