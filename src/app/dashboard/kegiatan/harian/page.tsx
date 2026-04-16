'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { Plus, Pencil, Trash2, ListChecks, X, Save, CalendarDays, User } from 'lucide-react';

const emptyForm = {
    title: '', scheduled_date: '', start_time: '', end_time: '',
    location: '', facilitator: '', notes: '', is_active: true,
};

export default function HarianPage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [filterDate, setFilterDate] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/activities?type=Kegiatan Harian'));
            const data = await res.json();
            setSchedules(Array.isArray(data) ? data : []);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openAdd = () => {
        setEditing(null);
        setForm({ ...emptyForm, scheduled_date: new Date().toISOString().slice(0, 10) });
        setShowModal(true);
    };
    const openEdit = (s: any) => {
        setEditing(s);
        setForm({
            title: s.title, scheduled_date: s.scheduled_date ? s.scheduled_date.slice(0, 10) : '',
            start_time: s.start_time || '', end_time: s.end_time || '',
            location: s.location || '', facilitator: s.facilitator || '',
            notes: s.notes || '', is_active: !!s.is_active,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return alert('Nama kegiatan harus diisi');
        setSaving(true);
        try {
            const body = { ...form, type: 'Kegiatan Harian', is_recurring: false };
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

    const filtered = filterDate
        ? schedules.filter(s => s.scheduled_date && s.scheduled_date.slice(0, 10) === filterDate)
        : schedules;

    const fmt = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ListChecks size={22} className="text-blue-600" /> Kegiatan Harian GSP
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Pencatatan kegiatan harian rumah singgah</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16} /> Tambah Kegiatan
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                    <CalendarDays size={16} className="text-slate-400" />
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="text-sm focus:outline-none text-slate-700" />
                </div>
                {filterDate && <button onClick={() => setFilterDate('')} className="text-sm text-slate-500 hover:text-slate-700">Reset</button>}
                <span className="text-sm text-slate-400">{filtered.length} kegiatan</span>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <ListChecks size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Belum ada kegiatan{filterDate ? ' pada tanggal ini' : ''}.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(s => (
                        <div key={s.id} className={`bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-start gap-4 ${!s.is_active ? 'opacity-60' : ''}`}>
                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-lg font-bold text-blue-600">{s.scheduled_date ? new Date(s.scheduled_date + 'T00:00:00').getDate() : '—'}</span>
                                <span className="text-xs text-blue-500">{s.scheduled_date ? new Date(s.scheduled_date + 'T00:00:00').toLocaleDateString('id-ID', { month: 'short' }) : ''}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800">{s.title}</h3>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                                    <span>{fmt(s.scheduled_date)}</span>
                                    {(s.start_time || s.end_time) && <span>{s.start_time}{s.end_time ? ` — ${s.end_time}` : ''}</span>}
                                    {s.location && <span>{s.location}</span>}
                                    {s.facilitator && <span className="flex items-center gap-1"><User size={10} />{s.facilitator}</span>}
                                </div>
                                {s.notes && <p className="text-xs text-slate-400 mt-1.5">{s.notes}</p>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                                <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                            <h2 className="font-semibold text-slate-800">{editing ? 'Edit Kegiatan' : 'Tambah Kegiatan Harian'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Kegiatan <span className="text-rose-500">*</span></label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="cth: Senam Pagi, Bersih-bersih, dll" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal <span className="text-rose-500">*</span></label>
                                <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mulai</label>
                                    <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Selesai</label>
                                    <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Lokasi / Tempat</label>
                                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Penanggung Jawab / PIC</label>
                                <input value={form.facilitator} onChange={e => setForm(f => ({ ...f, facilitator: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                                <span className="text-sm text-slate-700">Aktif</span>
                            </label>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
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
                        <h2 className="font-semibold text-slate-800 mb-2">Hapus Kegiatan?</h2>
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
