'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { Plus, Pencil, Trash2, CalendarDays, X, Save, Clock, MapPin, User } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'] as const;

const emptyForm = {
    title: '', day_of_week: 'Jumat', scheduled_date: '', start_time: '', end_time: '',
    location: '', facilitator: '', notes: '', is_recurring: false, is_active: true,
};

export default function TaklimPage() {
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
            const res = await authFetch(apiUrl('/api/activities?type=Taklim'));
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
            scheduled_date: s.scheduled_date ? s.scheduled_date.slice(0, 10) : '',
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
            const body = { ...form, type: 'Taklim' };
            const res = editing
                ? await authFetch(apiUrl(`/api/activities/${editing.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                : await authFetch(apiUrl('/api/activities'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (res.ok) { setShowModal(false); fetchData(); }
            else { const e = await res.json(); alert(e.message || 'Gagal menyimpan'); }
        } catch { alert('Terjadi kesalahan'); } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try { await authFetch(apiUrl(`/api/activities/${id}`), { method: 'DELETE' }); fetchData(); }
        catch { } finally { setDeleteId(null); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarDays size={22} className="text-teal-600" /> Jadwal Taklim
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Kelola jadwal pengajian dan ceramah</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16} /> Tambah Jadwal
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : schedules.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <CalendarDays size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Belum ada jadwal Taklim.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Judul</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Hari/Tanggal</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Waktu</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Pemateri</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Lokasi</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Status</th>
                                <th className="px-4 py-3.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {schedules.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3.5 font-medium text-slate-800">{s.title}</td>
                                    <td className="px-4 py-3.5 text-slate-600">
                                        {s.day_of_week || '—'}
                                        {s.scheduled_date && <span className="block text-xs text-slate-400">{new Date(s.scheduled_date).toLocaleDateString('id-ID')}</span>}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-600">
                                        <div className="flex items-center gap-1.5"><Clock size={13} className="text-slate-400" />{s.start_time || '—'}{s.end_time ? ` - ${s.end_time}` : ''}</div>
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-600">{s.facilitator || '—'}</td>
                                    <td className="px-4 py-3.5 text-slate-600">{s.location || '—'}</td>
                                    <td className="px-4 py-3.5">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {s.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                                            <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                            <h2 className="font-semibold text-slate-800">{editing ? 'Edit Jadwal Taklim' : 'Tambah Jadwal Taklim'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Judul / Tema <span className="text-rose-500">*</span></label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="cth: Taklim Bulanan - Fiqh Ibadah" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Hari</label>
                                    <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                        {DAYS.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Spesifik</label>
                                    <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mulai</label>
                                    <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Selesai</label>
                                    <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Lokasi</label>
                                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="cth: Masjid / Aula" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pemateri / Ustaz</label>
                                <input value={form.facilitator} onChange={e => setForm(f => ({ ...f, facilitator: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-teal-600" />
                                    <span className="text-sm text-slate-700">Aktif</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
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
                        <h2 className="font-semibold text-slate-800 mb-2">Hapus Jadwal?</h2>
                        <p className="text-sm text-slate-500 mb-5">Aksi ini tidak dapat dibatalkan.</p>
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
