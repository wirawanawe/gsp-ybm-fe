'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { Plus, Pencil, Trash2, BookMarked, X, Save, Clock, MapPin, User } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'] as const;

const emptyForm = {
    title: '', day_of_week: 'Jumat', start_time: '', end_time: '',
    location: '', facilitator: '', notes: '', is_recurring: true, is_active: true,
};

export default function TahsinPage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/activities?type=Tahsin'));
            const data = await res.json();
            setSchedules(Array.isArray(data) ? data : []);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
    const openEdit = (s: any) => {
        setEditing(s);
        setForm({
            title: s.title, day_of_week: s.day_of_week || 'Jumat',
            start_time: s.start_time || '', end_time: s.end_time || '',
            location: s.location || '', facilitator: s.facilitator || '',
            notes: s.notes || '', is_recurring: !!s.is_recurring, is_active: !!s.is_active,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return alert('Judul harus diisi');
        setSaving(true);
        try {
            const body = { ...form, type: 'Tahsin' };
            const res = editing
                ? await authFetch(apiUrl(`/api/activities/${editing.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                : await authFetch(apiUrl('/api/activities'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (res.ok) { setShowModal(false); fetchData(); }
            else { const e = await res.json(); alert(e.message || 'Gagal menyimpan'); }
        } catch { alert('Terjadi kesalahan'); } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try {
            await authFetch(apiUrl(`/api/activities/${id}`), { method: 'DELETE' });
            fetchData();
        } catch { } finally { setDeleteId(null); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BookMarked size={22} className="text-emerald-600" /> Jadwal Tahsin Mingguan
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Kelola jadwal pengajian Tahsin Al-Qur&apos;an</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16} /> Tambah Jadwal
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : schedules.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <BookMarked size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Belum ada jadwal Tahsin. Tambahkan jadwal pertama.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {schedules.map(s => (
                        <div key={s.id} className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${!s.is_active ? 'opacity-60' : 'border-slate-100'}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mb-2">
                                        {s.day_of_week || '—'}
                                    </span>
                                    <h3 className="font-semibold text-slate-800">{s.title}</h3>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                                    <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"><Trash2 size={15} /></button>
                                </div>
                            </div>
                            <div className="space-y-1.5 text-sm text-slate-600">
                                {(s.start_time || s.end_time) && (
                                    <div className="flex items-center gap-2"><Clock size={13} className="text-slate-400" />{s.start_time} — {s.end_time}</div>
                                )}
                                {s.location && <div className="flex items-center gap-2"><MapPin size={13} className="text-slate-400" />{s.location}</div>}
                                {s.facilitator && <div className="flex items-center gap-2"><User size={13} className="text-slate-400" />{s.facilitator}</div>}
                                {s.notes && <p className="text-slate-400 text-xs mt-2">{s.notes}</p>}
                            </div>
                            {!s.is_active && <span className="mt-3 inline-block text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">Tidak Aktif</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800">{editing ? 'Edit Jadwal Tahsin' : 'Tambah Jadwal Tahsin'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Judul / Nama Pengajian <span className="text-rose-500">*</span></label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="cth: Tahsin Iqra' Kelompok A" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Hari</label>
                                    <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        {DAYS.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mulai</label>
                                    <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Selesai</label>
                                    <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tempat</label>
                                    <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ruang..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pemateri / Ustaz</label>
                                <input value={form.facilitator} onChange={e => setForm(f => ({ ...f, facilitator: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Nama ustaz/pemateri" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Catatan tambahan..." />
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                                    <span className="text-sm text-slate-700">Aktif</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                                    <span className="text-sm text-slate-700">Rutin Mingguan</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                                <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={20} className="text-rose-600" /></div>
                        <h2 className="font-semibold text-slate-800 mb-2">Hapus Jadwal?</h2>
                        <p className="text-sm text-slate-500 mb-5">Data jadwal dan presensi terkait akan dihapus permanen.</p>
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
