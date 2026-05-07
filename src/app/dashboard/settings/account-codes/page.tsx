'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { Shield, Plus, Pencil, Trash2, X, Save, AlertCircle } from 'lucide-react';

const TYPES = ['Income', 'Expense', 'Both'];

const emptyForm = {
    code: '', name: '', type: 'Both', is_active: 1
};

export default function AccountCodesPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/account-codes'));
            const data = await res.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
    const openEdit = (r: any) => {
        setEditing(r);
        setForm({
            code: r.code || '',
            name: r.name || '',
            type: r.type || 'Both',
            is_active: r.is_active
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) return alert('Kode dan Nama wajib diisi');
        setSaving(true);
        try {
            const res = editing
                ? await authFetch(apiUrl(`/api/account-codes/${editing.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
                : await authFetch(apiUrl('/api/account-codes'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchData(); }
            else { const e = await res.json(); alert(e.message || 'Gagal menyimpan'); }
        } catch { alert('Terjadi kesalahan'); } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try { await authFetch(apiUrl(`/api/account-codes/${id}`), { method: 'DELETE' }); fetchData(); }
        catch { } finally { setDeleteId(null); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield size={22} className="text-violet-600" /> Master Kategori Keuangan
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Kelola kategori pemasukan dan pengeluaran</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16} /> Tambah Kategori
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : records.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                    <Shield size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Belum ada data kategori keuangan.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Kode</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Nama Kategori</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Tipe</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Status</th>
                                <th className="px-4 py-3.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {records.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3.5 font-mono text-slate-700 font-medium">{r.code}</td>
                                    <td className="px-4 py-3.5 text-slate-800">{r.name}</td>
                                    <td className="px-4 py-3.5">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            r.type === 'Income' ? 'bg-green-100 text-green-700' : 
                                            r.type === 'Expense' ? 'bg-amber-100 text-amber-700' : 
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {r.type === 'Both' ? 'Income & Expense' : r.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`w-2 h-2 rounded-full inline-block mr-2 ${r.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                        <span className="text-xs text-slate-600">{r.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors"><Pencil size={14} /></button>
                                            <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800">{editing ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kode <span className="text-rose-500">*</span></label>
                                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="cth: DONASI-UMUM" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Kategori <span className="text-rose-500">*</span></label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="cth: Donasi Umum" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipe</label>
                                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    {TYPES.map(t => <option key={t} value={t}>{t === 'Both' ? 'Income & Expense' : t}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="is_active" checked={form.is_active === 1} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))} className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500" />
                                <label htmlFor="is_active" className="text-sm text-slate-700">Kategori Aktif</label>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                                <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={20} className="text-rose-600" /></div>
                        <h2 className="font-semibold text-slate-800 mb-2">Hapus Kategori?</h2>
                        <p className="text-sm text-slate-500 mb-5">Data ini mungkin sudah digunakan dalam transaksi keuangan.</p>
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
