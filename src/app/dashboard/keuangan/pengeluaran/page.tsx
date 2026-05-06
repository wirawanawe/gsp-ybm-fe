'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { Wallet, Plus, Pencil, Trash2, X, Save } from 'lucide-react';

const CATEGORIES = ['Operasional', 'Konsumsi', 'Transportasi', 'Kesehatan', 'Utilitas', 'Gaji', 'Lainnya'];
const PAYMENT_METHODS = ['Tunai', 'Transfer', 'Lainnya'];

const emptyForm = {
    expense_date: new Date().toISOString().slice(0, 10),
    category: 'Operasional', description: '', amount: '',
    payment_method: 'Tunai', receipt_number: '', person_in_charge: '', paid_to: ''
};

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const CAT_COLORS: Record<string, string> = {
    Operasional: 'bg-blue-100 text-blue-700',
    Konsumsi: 'bg-amber-100 text-amber-700',
    Transportasi: 'bg-sky-100 text-sky-700',
    Kesehatan: 'bg-rose-100 text-rose-700',
    Utilitas: 'bg-violet-100 text-violet-700',
    Gaji: 'bg-emerald-100 text-emerald-700',
    Lainnya: 'bg-slate-100 text-slate-700',
};

export default function PengeluaranPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');
    const [filterCat, setFilterCat] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let q = '?limit=200';
            if (filterFrom) q += `&date_from=${filterFrom}`;
            if (filterTo) q += `&date_to=${filterTo}`;
            if (filterCat) q += `&category=${encodeURIComponent(filterCat)}`;
            const res = await authFetch(apiUrl(`/api/finance/expenses${q}`));
            const data = await res.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch { } finally { setLoading(false); }
    }, [filterFrom, filterTo, filterCat]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
    const openEdit = (r: any) => {
        setEditing(r);
        setForm({
            expense_date: r.expense_date ? r.expense_date.slice(0, 10) : '',
            category: r.category || 'Operasional', description: r.description || '',
            amount: r.amount || '', payment_method: r.payment_method || 'Tunai',
            receipt_number: r.receipt_number || '', person_in_charge: r.person_in_charge || '',
            paid_to: r.paid_to || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.description.trim() || !form.amount) return alert('Keterangan dan jumlah wajib diisi');
        setSaving(true);
        try {
            const res = editing
                ? await authFetch(apiUrl(`/api/finance/expenses/${editing.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
                : await authFetch(apiUrl('/api/finance/expenses'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) { setShowModal(false); fetchData(); }
            else { const e = await res.json(); alert(e.message || 'Gagal menyimpan'); }
        } catch { alert('Terjadi kesalahan'); } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try { await authFetch(apiUrl(`/api/finance/expenses/${id}`), { method: 'DELETE' }); fetchData(); }
        catch { } finally { setDeleteId(null); }
    };

    const total = records.reduce((s, r) => s + Number(r.amount), 0);

    // Group by category for mini chart
    const byCat: Record<string, number> = {};
    for (const r of records) byCat[r.category] = (byCat[r.category] || 0) + Number(r.amount);
    const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Wallet size={22} className="text-amber-600" /> Pengeluaran Operasional
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Catat semua pengeluaran operasional rumah singgah</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16} /> Tambah Pengeluaran
                </button>
            </div>

            {/* Total & Category Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-5 text-white">
                    <p className="text-sm text-amber-100 mb-1">Total Pengeluaran</p>
                    <p className="text-2xl font-bold">{fmtCurrency(total)}</p>
                    <p className="text-xs text-amber-200 mt-1">{records.length} transaksi</p>
                </div>
                {catEntries.slice(0, 2).map(([cat, amt]) => (
                    <div key={cat} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CAT_COLORS[cat] || CAT_COLORS['Lainnya']}`}>{cat}</span>
                        <p className="text-xl font-bold text-slate-800 mt-2">{fmtCurrency(amt)}</p>
                        <p className="text-xs text-slate-400 mt-1">{total > 0 ? Math.round((amt / total) * 100) : 0}% dari total</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-3 items-end">
                <div>
                    <label className="text-xs text-slate-500 block mb-1">Dari</label>
                    <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1">Sampai</label>
                    <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1">Kategori</label>
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                        <option value="">Semua</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                {(filterFrom || filterTo || filterCat) && (
                    <button onClick={() => { setFilterFrom(''); setFilterTo(''); setFilterCat(''); }} className="py-2 text-sm text-slate-500 hover:text-slate-700">Reset</button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : records.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                    <Wallet size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Belum ada data pengeluaran.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Tanggal</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Keterangan</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Kategori</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Metode</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Jumlah</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">Dibayarkan Kpd</th>
                                <th className="text-left px-4 py-3.5 text-slate-600 font-semibold">PIC (Kwitansi)</th>
                                <th className="px-4 py-3.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {records.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(r.expense_date)}</td>
                                    <td className="px-4 py-3.5">
                                        <div className="font-medium text-slate-800">{r.description}</div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CAT_COLORS[r.category] || CAT_COLORS['Lainnya']}`}>{r.category}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-500 text-xs">{r.payment_method}</td>
                                    <td className="px-4 py-3.5 text-right font-semibold text-amber-700">{fmtCurrency(Number(r.amount))}</td>
                                    <td className="px-4 py-3.5 text-slate-500 text-xs">{r.paid_to || '—'}</td>
                                    <td className="px-4 py-3.5">
                                        <div className="font-medium text-slate-800 text-xs">{r.person_in_charge || '—'}</div>
                                        <div className="text-[10px] text-slate-500">{r.receipt_number ? '#' + r.receipt_number : '—'}</div>
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
                                <td colSpan={4} className="px-5 py-3 font-semibold text-slate-700">Total</td>
                                <td className="px-4 py-3 text-right font-bold text-amber-700">{fmtCurrency(total)}</td>
                                <td colSpan={3}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                            <h2 className="font-semibold text-slate-800">{editing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal <span className="text-rose-500">*</span></label>
                                    <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan <span className="text-rose-500">*</span></label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" placeholder="Detail pengeluaran..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah (Rp) <span className="text-rose-500">*</span></label>
                                    <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Metode Bayar</label>
                                    <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Penanggung Jawab</label>
                                    <input value={form.person_in_charge} onChange={e => setForm(f => ({ ...f, person_in_charge: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Opsional" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Dibayarkan kepada</label>
                                    <input value={form.paid_to} onChange={e => setForm(f => ({ ...f, paid_to: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Opsional" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Kwitansi</label>
                                <input value={form.receipt_number} onChange={e => setForm(f => ({ ...f, receipt_number: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Opsional" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
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
                        <h2 className="font-semibold text-slate-800 mb-2">Hapus Pengeluaran?</h2>
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
