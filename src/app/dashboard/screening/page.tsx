'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, FileText, Eye, UserX, Loader2, Upload, Printer, Pencil, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiUrl, API_BASE, authFetch } from '@/lib/api';

const DOC_TYPES = [
    { id: 'ktp', label: 'KTP Pasien' },
    { id: 'kk', label: 'Kartu Keluarga (KK)' },
    { id: 'bpjs', label: 'BPJS' },
    { id: 'sktm', label: 'SKTM' },
    { id: 'rujukan', label: 'Rujukan' }
];

export default function ScreeningPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [susulanFiles, setSusulanFiles] = useState<{ [key: string]: File | null }>({});
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [savingEdit, setSavingEdit] = useState(false);

    const handlePrintRegistration = (patient: any) => {
        const win = window.open('', '_blank', 'width=800,height=600');
        if (!win) return;

        const createdDate = new Date(patient.created_at).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        win.document.write(`
            <html>
            <head>
                <title>Bukti Pendaftaran - ${patient.registration_number}</title>
                <style>
                    * { box-sizing: border-box; }
                    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #f9fafb; }
                    .card { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px 28px; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
                    .title { font-size: 18px; font-weight: 700; color: #0f172a; }
                    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
                    .reg-number { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 13px; font-weight: 700; color: #047857; background: #ecfdf3; padding: 6px 10px; border-radius: 999px; border: 1px solid #bbf7d0; }
                    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px; }
                    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; font-size: 13px; color: #0f172a; }
                    .label { font-size: 11px; color: #6b7280; }
                    .value { font-size: 13px; color: #111827; font-weight: 500; }
                    .footer { margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #6b7280; }
                    .note { font-size: 11px; color: #374151; margin-top: 4px; max-width: 360px; }
                    .stamp { text-align: right; }
                    .stamp-line { margin-top: 40px; border-top: 1px dashed #9ca3af; width: 180px; margin-left: auto; padding-top: 4px; font-size: 11px; color: #4b5563; }
                    @media print {
                        body { background: #ffffff; padding: 0; }
                        .card { border: none; border-radius: 0; max-width: none; margin: 0; box-shadow: none; }
                    }
                </style>
            </head>
            <body onload="window.print()">
                <div class="card">
                    <div class="header">
                        <div>
                            <div class="title">Bukti Pendaftaran Pasien</div>
                            <div class="subtitle">Diserahkan ke tim pengelola Rumah Singgah sebagai bukti registrasi</div>
                        </div>
                        <div class="reg-number">${patient.registration_number}</div>
                    </div>

                    <div>
                        <div class="section-title">Data Pasien</div>
                        <div class="grid">
                            <div>
                                <div class="label">Nama Lengkap</div>
                                <div class="value">${patient.name || '-'}</div>
                            </div>
                            <div>
                                <div class="label">NIK</div>
                                <div class="value">${patient.nik || '-'}</div>
                            </div>
                            <div>
                                <div class="label">Telepon</div>
                                <div class="value">${patient.phone || '-'}</div>
                            </div>
                            <div>
                                <div class="label">Tanggal Pendaftaran</div>
                                <div class="value">${createdDate}</div>
                            </div>
                            <div style="grid-column: span 2;">
                                <div class="label">Alamat</div>
                                <div class="value">${patient.address || '-'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <div>
                            <div class="label">Catatan</div>
                            <div class="note">
                                Bukti ini dibawa oleh pasien ke Rumah Singgah dan diserahkan kepada tim pengelola
                                sebagai dasar pencatatan ke Data Pendaftar dan penentuan kamar/penunggu.
                            </div>
                        </div>
                        <div class="stamp">
                            <div>Tanda tangan petugas screening</div>
                            <div class="stamp-line">Nama & Paraf</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        win.document.close();
    };

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/patients?status=Pending'));
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const openPatientDetails = async (patient: any) => {
        setSelectedPatient(patient);
        setEditForm({
            name: patient.name,
            nik: patient.nik,
            dob: patient.dob ? patient.dob.slice(0, 10) : '',
            gender: patient.gender,
            address: patient.address,
            phone: patient.phone,
            rt_rw: patient.rt_rw || '',
            kelurahan: patient.kelurahan || '',
            kecamatan: patient.kecamatan || '',
            kabupaten: patient.kabupaten || '',
            provinsi: patient.provinsi || '',
            diagnosis: patient.diagnosis || '',
            treatment_plan: patient.treatment_plan || '',
            occupation: patient.occupation || '',
            income: patient.income || '',
            age_category: patient.age_category || '',
            age: patient.age || '',
            education: patient.education || '',
            disease_category: patient.disease_category || ''
        });
        setIsEditing(false);
        setDocsLoading(true);
        try {
            const res = await authFetch(apiUrl(`/api/patients/${patient.id}/documents`));
            const docs = await res.json();
            setDocuments(docs);
        } catch (err) {
            console.error(err);
        } finally {
            setDocsLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedPatient) return;
        setSavingEdit(true);
        try {
            const res = await authFetch(apiUrl(`/api/patients/${selectedPatient.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (res.ok) {
                setSelectedPatient({ ...selectedPatient, ...editForm });
                setIsEditing(false);
                toast.success('Data pasien berhasil diupdate');
            } else {
                toast.error(data.message || 'Gagal update');
            }
        } catch (err) {
            toast.error('Gagal update data');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleSusulanUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;
        const filesToSend = Object.entries(susulanFiles).filter(([, f]) => f);
        if (filesToSend.length === 0) return;

        setUploading(true);
        try {
            const fd = new FormData();
            filesToSend.forEach(([key, file]) => fd.append(key, file!));
            const res = await authFetch(apiUrl(`/api/patients/${selectedPatient.id}/documents`), {
                method: 'POST',
                body: fd
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal mengunggah dokumen');
            setSusulanFiles({});
            const docsRes = await authFetch(apiUrl(`/api/patients/${selectedPatient.id}/documents`));
            setDocuments(await docsRes.json());
        } catch (err: any) {
            alert(err.message || 'Gagal mengunggah dokumen');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        if (!selectedPatient) return;
        if (!window.confirm('Yakin ingin menghapus berkas ini? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            const res = await authFetch(apiUrl(`/api/patients/${selectedPatient.id}/documents/${docId}`), {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal menghapus berkas');
            }
            const docsRes = await authFetch(apiUrl(`/api/patients/${selectedPatient.id}/documents`));
            setDocuments(await docsRes.json());
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus berkas');
        }
    };

    const handleVerification = async (status: string) => {
        if (!selectedPatient) return;

        try {
            const res = await authFetch(apiUrl(`/api/patients/${selectedPatient.id}/verify`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_verification: status })
            });
            const data = await res.json();

            if (res.ok) {
                setSelectedPatient(null);
                if (status === 'Layak Mustahik') {
                    toast.success('Pasien diterima. Data akan muncul di Data Pendaftar.', { duration: 4000 });
                } else {
                    toast.success('Status pasien diupdate.');
                }
                setTimeout(() => window.location.reload(), 800);
                return;
            }
            toast.error((data as { message?: string })?.message || 'Verifikasi gagal');
        } catch (err) {
            console.error('Verify error:', err);
            toast.error('Gagal memanggil API. Pastikan backend berjalan.');
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-8rem)] sm:h-[calc(100vh-8rem)] gap-4 sm:gap-6">

            {/* View Details Modal - Responsive (bottom sheet di mobile) */}
            {selectedPatient && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 truncate pr-2">
                                <FileText className="text-emerald-600 shrink-0" />
                                Verifikasi Berkas Pasien
                            </h2>
                            <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-700 shrink-0 p-1">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

                                {/* Biodata Sidebar - bisa diedit */}
                                <div className="md:col-span-1 space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Biodata Pribadi</h3>
                                            {!isEditing ? (
                                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-emerald-600 h-8 text-xs">
                                                    <Pencil size={14} className="mr-1" /> Edit
                                                </Button>
                                            ) : (
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs">Batal</Button>
                                                    <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit} className="bg-emerald-600 h-8 text-xs">
                                                        <Save size={14} className="mr-1" /> {savingEdit ? 'Menyimpan...' : 'Simpan'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <div><label className="text-xs text-slate-500">Nama</label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">NIK</label><Input value={editForm.nik} onChange={e => setEditForm({ ...editForm, nik: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Tanggal Lahir</label><Input type="date" value={editForm.dob} onChange={e => {
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
                                                }} className="h-9 mt-0.5" /></div>
                                                <div>
                                                    <label className="text-xs text-slate-500">Usia</label>
                                                    <Input value={editForm.age ? `${editForm.age} tahun` : '-'} readOnly className="h-9 mt-0.5 bg-slate-50 text-slate-600" />
                                                </div>
                                                <div><label className="text-xs text-slate-500">Kategori Usia</label><Input value={editForm.age_category} readOnly className="h-9 mt-0.5 bg-slate-50" /></div>
                                                <div><label className="text-xs text-slate-500">Jenis Kelamin</label><select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="h-9 w-full mt-0.5 rounded-md border px-2 text-sm"><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
                                                <div><label className="text-xs text-slate-500">Telepon</label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Alamat</label><Input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">RT/RW</label><Input value={editForm.rt_rw} onChange={e => setEditForm({ ...editForm, rt_rw: e.target.value })} className="h-9 mt-0.5" placeholder="001/002" /></div>
                                                <div><label className="text-xs text-slate-500">Kelurahan</label><Input value={editForm.kelurahan} onChange={e => setEditForm({ ...editForm, kelurahan: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Kecamatan</label><Input value={editForm.kecamatan} onChange={e => setEditForm({ ...editForm, kecamatan: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Kabupaten</label><Input value={editForm.kabupaten} onChange={e => setEditForm({ ...editForm, kabupaten: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Provinsi</label><Input value={editForm.provinsi} onChange={e => setEditForm({ ...editForm, provinsi: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Diagnosa</label><Input value={editForm.diagnosis} onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Rencana Tindakan</label><Input value={editForm.treatment_plan} onChange={e => setEditForm({ ...editForm, treatment_plan: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Kategori Penyakit</label><Input value={editForm.disease_category} onChange={e => setEditForm({ ...editForm, disease_category: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Pendidikan</label><Input value={editForm.education} onChange={e => setEditForm({ ...editForm, education: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Pekerjaan</label><Input value={editForm.occupation} onChange={e => setEditForm({ ...editForm, occupation: e.target.value })} className="h-9 mt-0.5" /></div>
                                                <div><label className="text-xs text-slate-500">Penghasilan</label><Input value={editForm.income} onChange={e => setEditForm({ ...editForm, income: e.target.value })} className="h-9 mt-0.5" /></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div><div className="text-xs text-slate-500">Nama Lengkap</div><div className="font-semibold text-slate-800">{selectedPatient.name}</div></div>
                                                <div><div className="text-xs text-slate-500">NIK</div><div className="font-medium text-slate-800">{selectedPatient.nik}</div></div>
                                                <div><div className="text-xs text-slate-500">No. Registrasi</div><div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 inline-block rounded border border-emerald-100 mt-1">{selectedPatient.registration_number}</div></div>
                                                <div><div className="text-xs text-slate-500">Telepon</div><div className="text-slate-800">{selectedPatient.phone}</div></div>
                                                <div><div className="text-xs text-slate-500">Alamat</div><div className="text-sm text-slate-800 leading-relaxed">{selectedPatient.address}</div></div>
                                                {(selectedPatient.rt_rw || selectedPatient.kelurahan || selectedPatient.kecamatan) && (
                                                    <div><div className="text-xs text-slate-500">RT/RW, Kel, Kec</div><div className="text-sm text-slate-800">{[selectedPatient.rt_rw, selectedPatient.kelurahan, selectedPatient.kecamatan].filter(Boolean).join(', ')}</div></div>
                                                )}
                                                {selectedPatient.diagnosis && <div><div className="text-xs text-slate-500">Diagnosa</div><div className="text-sm text-slate-800">{selectedPatient.diagnosis}</div></div>}
                                                {selectedPatient.treatment_plan && <div><div className="text-xs text-slate-500">Rencana Tindakan</div><div className="text-sm text-slate-800">{selectedPatient.treatment_plan}</div></div>}
                                                {selectedPatient.disease_category && <div><div className="text-xs text-slate-500">Kategori Penyakit</div><div className="text-sm text-slate-800">{selectedPatient.disease_category}</div></div>}
                                                {selectedPatient.age && <div><div className="text-xs text-slate-500">Usia</div><div className="text-sm text-slate-800">{selectedPatient.age} tahun</div></div>}
                                                {selectedPatient.age_category && <div><div className="text-xs text-slate-500">Kategori Usia</div><div className="text-sm text-slate-800">{selectedPatient.age_category}</div></div>}
                                                {selectedPatient.education && <div><div className="text-xs text-slate-500">Pendidikan</div><div className="text-sm text-slate-800">{selectedPatient.education}</div></div>}
                                                {selectedPatient.occupation && <div><div className="text-xs text-slate-500">Pekerjaan</div><div className="text-sm text-slate-800">{selectedPatient.occupation}</div></div>}
                                                {selectedPatient.income && <div><div className="text-xs text-slate-500">Penghasilan</div><div className="text-sm text-slate-800">{selectedPatient.income}</div></div>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Documents Grid */}
                                <div className="md:col-span-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Berkas Persyaratan</h3>

                                    {docsLoading ? (
                                        <div className="flex justify-center items-center h-40">
                                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                {documents.length === 0 ? (
                                                    <div className="col-span-2 text-center text-slate-500 py-6 border-2 border-dashed border-slate-200 rounded-xl">
                                                        Belum ada berkas. Pasien dapat menyusulkan dokumen di sini.
                                                    </div>
                                                ) : (
                                                    documents.map(doc => (
                                                        <div key={doc.id} className="border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-emerald-300 transition-colors group relative">
                                                            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-semibold text-slate-700 text-sm truncate">{doc.document_type}</div>
                                                                <a
                                                                    href={`${API_BASE}/${doc.file_path}`}
                                                                    target="_blank"
                                                                    className="text-xs text-emerald-600 font-medium hover:underline flex items-center mt-1 w-fit"
                                                                >
                                                                    Lihat Berkas <Eye size={12} className="ml-1" />
                                                                </a>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteDocument(doc.id)}
                                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors shrink-0"
                                                                title="Hapus Berkas"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {/* Susulan Dokumen - lokasi screening berbeda dengan pendaftaran */}
                                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                                <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                                                    <Upload size={16} /> Susulan Dokumen
                                                </h4>
                                                <p className="text-xs text-amber-700 mb-3">
                                                    Pasien lupa membawa dokumen saat pendaftaran? Unggah di sini sebelum verifikasi.
                                                </p>
                                                <form onSubmit={handleSusulanUpload} className="flex flex-wrap gap-3">
                                                    {DOC_TYPES.map(doc => (
                                                        <div key={doc.id} className="flex items-center gap-2">
                                                            <Input
                                                                type="file"
                                                                accept=".jpg,.jpeg,.png,.pdf"
                                                                className="hidden"
                                                                id={`susulan-${doc.id}`}
                                                                onChange={e => {
                                                                    const f = e.target.files?.[0];
                                                                    setSusulanFiles(prev => ({ ...prev, [doc.id]: f || null }));
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={`susulan-${doc.id}`}
                                                                className="cursor-pointer text-xs px-3 py-1.5 rounded-md border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 font-medium"
                                                            >
                                                                {susulanFiles[doc.id]?.name || doc.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="submit"
                                                        size="sm"
                                                        disabled={uploading || !Object.values(susulanFiles).some(Boolean)}
                                                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
                                                    >
                                                        {uploading ? 'Mengunggah...' : 'Unggah'}
                                                    </Button>
                                                </form>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Footer - stack on mobile */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0">
                            <Button
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-medium h-11 w-full sm:w-auto sm:px-6"
                                onClick={() => handleVerification('Rujukan Lain')}
                            >
                                Rujukan Lain (Tolak)
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 font-semibold h-11 w-full sm:w-auto sm:px-8"
                                onClick={() => handleVerification('Layak Mustahik')}
                            >
                                <CheckCircle size={18} className="mr-2" />
                                Layak Mustahik (Pre-Approve)
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Page Layout */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">Verifikasi Pasien Masuk</h1>
                        <p className="text-slate-600 text-sm mt-1 line-clamp-2 sm:line-clamp-none">
                            Daftar pasien baru yang mendaftar online dan menunggu persetujuan (Pre-Approved).
                        </p>
                    </div>
                    <div className="relative w-full sm:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input placeholder="Cari by NIK / Nama..." className="pl-9 h-10 border-slate-200 bg-slate-50 focus:bg-white w-full" />
                    </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="overflow-x-auto overflow-y-auto flex-1 bg-slate-50/30 min-h-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-emerald-600">
                                <Loader2 className="animate-spin mb-4" size={32} />
                                <p className="font-medium text-slate-500">Memuat data...</p>
                            </div>
                        ) : patients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <div className="bg-slate-100 p-4 rounded-full mb-4">
                                    <UserX size={32} className="text-slate-500" />
                                </div>
                                <p className="font-medium text-slate-600">Belum ada pasien yang perlu diverifikasi.</p>
                                <p className="text-sm mt-1 text-slate-500">Pasien yang baru mendaftar akan muncul di sini.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left bg-white min-w-[720px] sm:min-w-0">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">No. Pendaftaran</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Nama Pasien / NIK</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Tanggal Daftar</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm text-center whitespace-nowrap">Bukti Pendaftaran</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm text-center whitespace-nowrap">Status Awal</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm text-right whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {patients.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                <span className="font-mono text-xs font-bold text-slate-600">{p.registration_number}</span>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{p.nik}</div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 text-xs sm:text-sm whitespace-nowrap">
                                                {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                                <Button
                                                    onClick={() => handlePrintRegistration(p)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm text-xs sm:text-sm"
                                                >
                                                    <Printer size={14} className="sm:mr-2 shrink-0" />
                                                    <span className="hidden sm:inline">Print Bukti</span>
                                                </Button>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                <span className="inline-flex px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                                                    {p.status_verification}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                                                <Button
                                                    onClick={() => openPatientDetails(p)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-sm text-xs sm:text-sm"
                                                >
                                                    <Eye size={14} className="sm:mr-2 shrink-0" />
                                                    <span className="hidden sm:inline">Cek Berkas</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
