'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { HeartPulse, Search, Plus, Pencil, Trash2, X, Save, ChevronDown } from 'lucide-react';

const emptyForm = {
    patient_id: '', recorded_date: new Date().toISOString().slice(0, 10),
    recorded_time: '', systolic: '', diastolic: '', pulse: '',
    spo2: '', temperature: '', weight: '', notes: '', recorded_by_name: '',
};

function bpCategory(sys: number, dia: number) {
    if (!sys || !dia) return null;
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-emerald-600 bg-emerald-50' };
    if (sys < 130 && dia < 80) return { label: 'Meninggi', color: 'text-yellow-600 bg-yellow-50' };
    if (sys < 140 || dia < 90) return { label: 'Hipertensi Tk.1', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Hipertensi Tk.2', color: 'text-rose-600 bg-rose-50' };
}

export default function TensiPage() {
    const [vitals, setVitals] = useState<any[]>([]);
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

    const fetchVitals = useCallback(async (patientId?: number) => {
        setLoading(true);
        try {
            const q = patientId ? `?patient_id=${patientId}&limit=30` : '?limit=30';
            const res = await authFetch(apiUrl(`/api/health/vitals${q}`));
            const data = await res.json();
            setVitals(Array.isArray(data) ? data : []);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchVitals(); }, [fetchVitals]);

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
        setSelectedPatient(p);
        setShowSearch(false);
        setSearchQuery('');
        fetchVitals(p.id);
    };

    const openAdd = () => {
        if (!selectedPatient) return alert('Pilih pasien terlebih dahulu');
        setEditing(null);
        setForm({ ...emptyForm, patient_id: selectedPatient.id, recorded_date: new Date().toISOString().slice(0, 10) });
        setShowModal(true);
    };

    const openEdit = (v: any) => {
        setEditing(v);
        setForm({
            patient_id: v.patient_id,
            recorded_date: v.recorded_date ? v.recorded_date.slice(0, 10) : '',
            recorded_time: v.recorded_time || '',
            systolic: v.systolic || '', diastolic: v.diastolic || '',
            pulse: v.pulse || '', spo2: v.spo2 || '',
            temperature: v.temperature || '', weight: v.weight || '',
            notes: v.notes || '', recorded_by_name: v.recorded_by_name || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.patient_id) return alert('Patient belum dipilih');
        if (!form.recorded_date) return alert('Tanggal harus diisi');
        setSaving(true);
        try {
            const res = editing
                ? await authFetch(apiUrl(`/api/health/vitals/${editing.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
                : await authFetch(apiUrl('/api/health/vitals'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchVitals(selectedPatient?.id); }
            else { const e = await res.json(); alert(e.message || 'Gagal menyimpan'); }
        } catch { alert('Terjadi kesalahan'); } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try { await authFetch(apiUrl(`/api/health/vitals/${id}`), { method: 'DELETE' }); fetchVitals(selectedPatient?.id); }
        catch { } finally { setDeleteId(null); }
    };

    const fmt = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <HeartPulse size={22} className="text-rose-600" /> Pencatatan Tensi Pasien
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Monitor tekanan darah dan tanda vital pasien</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16} /> Catat Tensi
                </button>
            </div>

            {/* Patient search */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className="relative">
                    <div
                        onClick={() => setShowSearch(true)}
                        className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:border-rose-400 transition-colors"
                    >
                        <Search size={16} className="text-slate-400" />
                        {selectedPatient ? (
                            <div className="flex-1">
                                <span className="font-medium text-slate-800">{selectedPatient.name}</span>
                                <span className="text-xs text-slate-400 ml-2">{selectedPatient.registration_number} · NIK: {selectedPatient.nik}</span>
                            </div>
                        ) : (
                            <span className="text-slate-400 text-sm">Cari pasien berdasarkan nama atau NIK...</span>
                        )}
                        {selectedPatient && (
                            <button className="ml-auto" onClick={e => { e.stopPropagation(); setSelectedPatient(null); fetchVitals(); }}>
                                <X size={14} className="text-slate-400 hover:text-rose-500" />
                            </button>
                        )}
                    </div>

                    {showSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20">
                            <div className="p-3 border-b border-slate-100">
                                <input
                                    autoFocus
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full text-sm focus:outline-none px-2 py-1"
                                    placeholder="Ketik nama atau NIK..."
                                />
                            </div>
                            <div className="max-h-52 overflow-y-auto">
                                {searching && <div className="p-4 text-center text-sm text-slate-400">Mencari...</div>}
                                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                                    <div className="p-4 text-center text-sm text-slate-400">Pasien tidak ditemukan</div>
                                )}
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

            {/* Vitals list */}
            {loading ? (
                <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : vitals.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                    <HeartPulse size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">{selectedPatient ? 'Belum ada catatan tensi untuk pasien ini.' : 'Pilih pasien untuk melihat riwayat tensi.'}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Pasien</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Tanggal</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Tensi (mmHg)</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Nadi</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">SpO2</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Suhu</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Kategori</th>
                                <th className="px-4 py-3.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {vitals.map(v => {
                                const cat = bpCategory(v.systolic, v.diastolic);
                                return (
                                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="font-medium text-slate-800">{v.patient_name}</div>
                                            <div className="text-xs text-slate-400">{v.registration_number}</div>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600">
                                            {fmt(v.recorded_date)}
                                            {v.recorded_time && <span className="block text-xs text-slate-400">{v.recorded_time.slice(0, 5)}</span>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="font-bold text-slate-800">{v.systolic || '—'}/{v.diastolic || '—'}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600">{v.pulse ? `${v.pulse} bpm` : '—'}</td>
                                        <td className="px-4 py-3.5 text-slate-600">{v.spo2 ? `${v.spo2}%` : '—'}</td>
                                        <td className="px-4 py-3.5 text-slate-600">{v.temperature ? `${v.temperature}°C` : '—'}</td>
                                        <td className="px-4 py-3.5">
                                            {cat && <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>{cat.label}</span>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex gap-1">
                                                <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                                                <button onClick={() => setDeleteId(v.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                            <h2 className="font-semibold text-slate-800">{editing ? 'Edit Data Tensi' : 'Catat Tensi Pasien'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {selectedPatient && (
                                <div className="bg-rose-50 rounded-xl p-3 text-sm">
                                    <span className="font-medium text-rose-800">{selectedPatient.name}</span>
                                    <span className="text-rose-600 ml-2 text-xs">{selectedPatient.registration_number}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal <span className="text-rose-500">*</span></label>
                                    <input type="date" value={form.recorded_date} onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Waktu</label>
                                    <input type="time" value={form.recorded_time} onChange={e => setForm(f => ({ ...f, recorded_time: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tekanan Darah (mmHg)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Sistolik</label>
                                        <input type="number" value={form.systolic} onChange={e => setForm(f => ({ ...f, systolic: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="120" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Diastolik</label>
                                        <input type="number" value={form.diastolic} onChange={e => setForm(f => ({ ...f, diastolic: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="80" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nadi (bpm)</label>
                                    <input type="number" value={form.pulse} onChange={e => setForm(f => ({ ...f, pulse: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="80" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">SpO2 (%)</label>
                                    <input type="number" value={form.spo2} onChange={e => setForm(f => ({ ...f, spo2: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="98" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Suhu (°C)</label>
                                    <input type="number" step="0.1" value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="36.5" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Berat Badan (kg)</label>
                                    <input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="60" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Dicatat oleh</label>
                                    <input value={form.recorded_by_name} onChange={e => setForm(f => ({ ...f, recorded_by_name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Nama petugas" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
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
                        <h2 className="font-semibold text-slate-800 mb-2">Hapus Data Tensi?</h2>
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
