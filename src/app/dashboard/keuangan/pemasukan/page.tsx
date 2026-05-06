'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { TrendingUp, Plus, Pencil, Trash2, X, Save } from 'lucide-react';

const CATEGORIES = ['Donasi', 'Infaq', 'Zakat', 'Wakaf', 'Dana YBM', 'Lainnya'];

const emptyForm = {
    income_date: new Date().toISOString().slice(0, 10),
    source: '', category: 'Donasi', amount: '', description: '', receipt_number: '', person_in_charge: '',
};

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const CATEGORY_COLORS: Record<string, string> = {
    Donasi: 'bg-emerald-100 text-emerald-700',
    Infaq: 'bg-teal-100 text-teal-700',
    Zakat: 'bg-green-100 text-green-700',
    Wakaf: 'bg-blue-100 text-blue-700',
    'Dana YBM': 'bg-violet-100 text-violet-700',
    Lainnya: 'bg-slate-100 text-slate-700',
};

export default function PemasukanPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let q = '?limit=200';
            if (filterFrom) q += `&date_from=${filterFrom}`;
            if (filterTo) q += `&date_to=${filterTo}`;
            const res = await authFetch(apiUrl(`/api/finance/income${q}`));
            const data = await res.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch { } finally { setLoading(false); }
    }, [filterFrom, filterTo]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
    const openEdit = (r: any) => {
        setEditing(r);
        setForm({
            income_date: r.income_date ? r.income_date.slice(0, 10) : '',
            source: r.source || '', category: r.category || 'Lainnya',
            amount: r.amount || '', description: r.description || '',
            receipt_number: r.receipt_number || '',
            person_in_charge: r.person_in_charge || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.source.trim() || !form.amount) return alert('Sumber dan jumlah wajib diisi');
        setSaving(true);
        try {
            const res = editing
                ? await authFetch(apiUrl(`/api/finance/income/${editing.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
                : await authFetch(apiUrl('/api/finance/income'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchData(); }
            else { const e = await res.json(); alert(e.message || 'Gagal menyimpan'); }
        } catch { alert('Terjadi kesalahan'); } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try { await authFetch(apiUrl(`/api/finance/income/${id}`), { method: 'DELETE' }); fetchData(); }
        catch { } finally { setDeleteId(null); }
    };

    const total = records.reduce((s, r) => s + Number(r.amount), 0);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={22} className="text-green-600" /> Dana Masuk
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Pencatatan semua pemasukan dan dana yang diterima</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16} /> Tambah Pemasukan
                </button>
            </div>

            {/* Total Card */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-5 text-white">
                <p className="text-sm text-green-100 mb-1">Total Dana Masuk</p>
                <p className="text-3xl font-bold">{fmtCurrency(total)}</p>
                <p className="text-xs text-green-200 mt-1">{records.length} transaksi</p>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-3 items-center">
                <div>
                    <label className="text-xs text-slate-500 block mb-1">Dari Tanggal</label>
                    <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1">Sampai Tanggal</label>
                    <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                {(filterFrom || filterTo) && (
                    <button onClick={() => { setFilterFrom(''); setFilterTo(''); }} className="self-end text-sm text-slate-500 hover:text-slate-700 py-2">Reset</button>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : records.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                    <TrendingUp size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Belum ada data pemasukan.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Tanggal</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Sumber</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Kategori</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Jumlah</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">PIC (Kwitansi)</th>
                                <th className="px-4 py-3.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {records.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(r.income_date)}</td>
                                    <td className="px-4 py-3.5">
                                        <div className="font-medium text-slate-800">{r.source}</div>
                                        {r.description && <div className="text-xs text-slate-400 mt-0.5">{r.description}</div>}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[r.category] || CATEGORY_COLORS['Lainnya']}`}>{r.category}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-semibold text-green-700">{fmtCurrency(Number(r.amount))}</td>
                                    <td className="px-4 py-3.5">
                                        <div className="font-medium text-slate-800 text-xs">{r.person_in_charge || '—'}</div>
                                        <div className="text-[10px] text-slate-500">{r.receipt_number || '—'}</div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                                            <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t border-slate-200">
                            <tr>
                                <td colSpan={3} className="px-5 py-3 font-semibold text-slate-700">Total</td>
                                <td className="px-4 py-3 text-right font-bold text-green-700">{fmtCurrency(total)}</td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                            <h2 className="font-semibold text-slate-800">{editing ? 'Edit Dana Masuk' : 'Tambah Dana Masuk'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal <span className="text-rose-500">*</span></label>
                                    <input type="date" value={form.income_date} onChange={e => setForm(f => ({ ...f, income_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sumber Dana <span className="text-rose-500">*</span></label>
                                <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="cth: Bapak Ahmad / YBM Pusat" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah (Rp) <span className="text-rose-500">*</span></label>
                                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Penanggung Jawab</label>
                                <input value={form.person_in_charge} onChange={e => setForm(f => ({ ...f, person_in_charge: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Opsional" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Kwitansi</label>
                                <input value={form.receipt_number} onChange={e => setForm(f => ({ ...f, receipt_number: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Opsional" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
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
                        <h2 className="font-semibold text-slate-800 mb-2">Hapus Data Pemasukan?</h2>
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
