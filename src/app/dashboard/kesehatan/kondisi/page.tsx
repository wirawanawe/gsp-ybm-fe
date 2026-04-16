'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { Activity, Search, Plus, Pencil, Trash2, X, Save } from 'lucide-react';

const SEVERITY_STYLES: Record<string, string> = {
    'Baik': 'bg-emerald-100 text-emerald-700',
    'Sedang': 'bg-blue-100 text-blue-700',
    'Perlu Perhatian': 'bg-amber-100 text-amber-700',
    'Kritis': 'bg-rose-100 text-rose-700',
};

const emptyForm = {
    patient_id: '', condition_date: new Date().toISOString().slice(0, 10),
    severity: 'Sedang', description: '', actions_taken: '', follow_up: '', recorded_by_name: '',
};

export default function KondisiPage() {
    const [conditions, setConditions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [searching, setSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchConditions = useCallback(async (patientId?: number) => {
        setLoading(true);
        try {
            const q = patientId ? `?patient_id=${patientId}&limit=30` : '?limit=30';
            const res = await authFetch(apiUrl(`/api/health/conditions${q}`));
            const data = await res.json();
            setConditions(Array.isArray(data) ? data : []);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchConditions(); }, [fetchConditions]);

    const doSearch = useCallback(async (q: string) => {
        if (q.trim().length < 2) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const res = await authFetch(apiUrl(`/api/health/patients-search?q=${encodeURIComponent(q)}`));
            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data : []);
        } catch { } finally { setSearching(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => doSearch(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery, doSearch]);

    const selectPatient = (p: any) => {
        setSelectedPatient(p); setShowSearch(false); setSearchQuery(''); fetchConditions(p.id);
    };

    const openAdd = () => {
        if (!selectedPatient) return alert('Pilih pasien terlebih dahulu');
        setEditing(null);
        setForm({ ...emptyForm, patient_id: selectedPatient.id });
        setShowModal(true);
    };

    const openEdit = (c: any) => {
        setEditing(c);
        setForm({
            patient_id: c.patient_id,
            condition_date: c.condition_date ? c.condition_date.slice(0, 10) : '',
            severity: c.severity || 'Sedang', description: c.description || '',
            actions_taken: c.actions_taken || '', follow_up: c.follow_up || '',
            recorded_by_name: c.recorded_by_name || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.description.trim()) return alert('Deskripsi kondisi harus diisi');
        setSaving(true);
        try {
            const res = editing
                ? await authFetch(apiUrl(`/api/health/conditions/${editing.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
                : await authFetch(apiUrl('/api/health/conditions'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchConditions(selectedPatient?.id); }
            else { const e = await res.json(); alert(e.message || 'Gagal menyimpan'); }
        } catch { alert('Terjadi kesalahan'); } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try { await authFetch(apiUrl(`/api/health/conditions/${id}`), { method: 'DELETE' }); fetchConditions(selectedPatient?.id); }
        catch { } finally { setDeleteId(null); }
    };

    const fmt = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={22} className="text-orange-600" /> Catatan Kondisi Pasien
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Rekam kondisi harian dan tindakan yang dilakukan</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16} /> Tambah Catatan
                </button>
            </div>

            {/* Patient Search */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className="relative">
                    <div onClick={() => setShowSearch(true)} className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:border-orange-400 transition-colors">
                        <Search size={16} className="text-slate-400" />
                        {selectedPatient ? (
                            <div className="flex-1">
                                <span className="font-medium text-slate-800">{selectedPatient.name}</span>
                                <span className="text-xs text-slate-400 ml-2">{selectedPatient.registration_number}</span>
                            </div>
                        ) : (
                            <span className="text-slate-400 text-sm">Cari pasien berdasarkan nama atau NIK...</span>
                        )}
                        {selectedPatient && (
                            <button onClick={e => { e.stopPropagation(); setSelectedPatient(null); fetchConditions(); }}>
                                <X size={14} className="text-slate-400 hover:text-rose-500" />
                            </button>
                        )}
                    </div>
                    {showSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20">
                            <div className="p-3 border-b border-slate-100">
                                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full text-sm focus:outline-none px-2 py-1" placeholder="Ketik nama atau NIK..." />
                            </div>
                            <div className="max-h-52 overflow-y-auto">
                                {searching && <div className="p-4 text-center text-sm text-slate-400">Mencari...</div>}
                                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && <div className="p-4 text-center text-sm text-slate-400">Pasien tidak ditemukan</div>}
                                {searchResults.map(p => (
                                    <button key={p.id} onClick={() => selectPatient(p)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                        <div className="font-medium text-slate-800 text-sm">{p.name}</div>
                                        <div className="text-xs text-slate-400">{p.registration_number} · NIK: {p.nik}</div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowSearch(false)} className="w-full py-2 text-xs text-slate-400 hover:bg-slate-50 border-t border-slate-100">Tutup</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Conditions list */}
            {loading ? (
                <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : conditions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                    <Activity size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">{selectedPatient ? 'Belum ada catatan kondisi untuk pasien ini.' : 'Pilih pasien atau tambahkan catatan baru.'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {conditions.map(c => (
                        <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${SEVERITY_STYLES[c.severity] || 'bg-slate-100 text-slate-600'}`}>{c.severity}</span>
                                    <div>
                                        <p className="font-medium text-slate-800">{c.patient_name}</p>
                                        <p className="text-xs text-slate-400">{fmt(c.condition_date)}{c.recorded_by_name ? ` · ${c.recorded_by_name}` : ''}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Kondisi</p>
                                    <p className="text-sm text-slate-700">{c.description}</p>
                                </div>
                                {c.actions_taken && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tindakan</p>
                                        <p className="text-sm text-slate-700">{c.actions_taken}</p>
                                    </div>
                                )}
                                {c.follow_up && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tindak Lanjut</p>
                                        <p className="text-sm text-slate-700">{c.follow_up}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                            <h2 className="font-semibold text-slate-800">{editing ? 'Edit Catatan Kondisi' : 'Tambah Catatan Kondisi'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {selectedPatient && (
                                <div className="bg-orange-50 rounded-xl p-3 text-sm">
                                    <span className="font-medium text-orange-800">{selectedPatient.name}</span>
                                    <span className="text-orange-600 ml-2 text-xs">{selectedPatient.registration_number}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal <span className="text-rose-500">*</span></label>
                                    <input type="date" value={form.condition_date} onChange={e => setForm(f => ({ ...f, condition_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tingkat Kondisi</label>
                                    <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                                        {['Baik', 'Sedang', 'Perlu Perhatian', 'Kritis'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi Kondisi <span className="text-rose-500">*</span></label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" placeholder="Deskripsikan kondisi pasien secara detail..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tindakan yang Dilakukan</label>
                                <textarea value={form.actions_taken} onChange={e => setForm(f => ({ ...f, actions_taken: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" placeholder="Misalnya: pemberian obat, kompres, dll." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tindak Lanjut</label>
                                <textarea value={form.follow_up} onChange={e => setForm(f => ({ ...f, follow_up: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" placeholder="Rencana tindak lanjut, jadwal kontrol, dll." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dicatat oleh</label>
                                <input value={form.recorded_by_name} onChange={e => setForm(f => ({ ...f, recorded_by_name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Nama petugas" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                                <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={20} className="text-rose-600" /></div>
                        <h2 className="font-semibold text-slate-800 mb-2">Hapus Catatan Kondisi?</h2>
                        <p className="text-sm text-slate-500 mb-5">Data ini akan dihapus permanen.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm">Batal</button>
                            <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
