'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { BarChart3 } from 'lucide-react';

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
    return String(n);
};

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function RekapKeuanganPage() {
    const [groupBy, setGroupBy] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchRekap = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl(`/api/finance/rekap?group_by=${groupBy}&year=${year}`));
            const d = await res.json();
            setData(d);
        } catch { } finally { setLoading(false); }
    }, [groupBy, year]);

    useEffect(() => { fetchRekap(); }, [fetchRekap]);

    const rekap: any[] = data?.rekap || [];
    const maxVal = Math.max(...rekap.map((r: any) => Math.max(r.total_income, r.total_expense)), 1);
    const totalIncome = rekap.reduce((s: number, r: any) => s + r.total_income, 0);
    const totalExpense = rekap.reduce((s: number, r: any) => s + r.total_expense, 0);
    const saldo = totalIncome - totalExpense;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

    const labelFor = (r: any) => {
        if (groupBy === 'monthly') {
            const m = Number(r.period_key);
            return MONTHS_SHORT[m - 1] || r.period_label;
        }
        return String(r.period_label);
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 size={22} className="text-indigo-600" /> Rekap Keuangan
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Perbandingan pemasukan dan pengeluaran per periode</p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-3 items-end">
                <div>
                    <label className="text-xs text-slate-500 block mb-1">Tampilkan</label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200">
                        {(['weekly', 'monthly', 'yearly'] as const).map(g => (
                            <button key={g} onClick={() => setGroupBy(g)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${groupBy === g ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                                {g === 'weekly' ? 'Mingguan' : g === 'monthly' ? 'Bulanan' : 'Tahunan'}
                            </button>
                        ))}
                    </div>
                </div>
                {groupBy !== 'yearly' && (
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Tahun</label>
                        <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {years.map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>
                )}
                <button onClick={fetchRekap} className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                    Tampilkan
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <>
                    {/* Summary Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-center">
                            <p className="text-xs text-slate-500 mb-1">Total Masuk</p>
                            <p className="text-xl font-bold text-green-700">{fmtCurrency(totalIncome)}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-center">
                            <p className="text-xs text-slate-500 mb-1">Total Keluar</p>
                            <p className="text-xl font-bold text-amber-700">{fmtCurrency(totalExpense)}</p>
                        </div>
                        <div className={`rounded-2xl border p-5 shadow-sm text-center ${saldo >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <p className="text-xs text-slate-500 mb-1">Saldo</p>
                            <p className={`text-xl font-bold ${saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fmtCurrency(saldo)}</p>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    {rekap.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                            <BarChart3 size={40} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">Belum ada data pada periode ini.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-center gap-5 mb-5">
                                <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Pemasukan</div>
                                <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Pengeluaran</div>
                            </div>
                            <div className="overflow-x-auto pb-2">
                                <div className="flex items-end gap-3 min-w-max" style={{ height: '240px' }}>
                                    {rekap.map((r: any, i: number) => (
                                        <div key={i} className="flex flex-col items-center gap-1 w-16">
                                            <div className="flex items-end gap-1 flex-1" style={{ alignItems: 'flex-end', height: '200px' }}>
                                                {/* Income bar */}
                                                <div className="relative group w-6">
                                                    <div
                                                        className="bg-emerald-500 rounded-t-md w-full transition-all hover:bg-emerald-600 cursor-pointer"
                                                        style={{ height: `${Math.max(4, (r.total_income / maxVal) * 180)}px` }}
                                                    />
                                                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                        {fmtCurrency(r.total_income)}
                                                    </div>
                                                </div>
                                                {/* Expense bar */}
                                                <div className="relative group w-6">
                                                    <div
                                                        className="bg-amber-500 rounded-t-md w-full transition-all hover:bg-amber-600 cursor-pointer"
                                                        style={{ height: `${Math.max(4, (r.total_expense / maxVal) * 180)}px` }}
                                                    />
                                                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                        {fmtCurrency(r.total_expense)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500 text-center leading-tight">{labelFor(r)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detail Table */}
                    {rekap.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-700">Tabel Rekap Detail</h3>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left px-5 py-3 text-slate-500 font-medium">Periode</th>
                                        <th className="text-right px-4 py-3 text-slate-500 font-medium">Pemasukan</th>
                                        <th className="text-right px-4 py-3 text-slate-500 font-medium">Pengeluaran</th>
                                        <th className="text-right px-4 py-3 text-slate-500 font-medium">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {rekap.map((r: any, i: number) => {
                                        const s = r.total_income - r.total_expense;
                                        return (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 font-medium text-slate-700">{labelFor(r)}</td>
                                                <td className="px-4 py-3 text-right text-green-700 font-semibold">{fmtCurrency(r.total_income)}</td>
                                                <td className="px-4 py-3 text-right text-amber-700 font-semibold">{fmtCurrency(r.total_expense)}</td>
                                                <td className={`px-4 py-3 text-right font-bold ${s >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{fmtCurrency(s)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <td className="px-5 py-3 font-bold text-slate-800">Total</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-700">{fmtCurrency(totalIncome)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-amber-700">{fmtCurrency(totalExpense)}</td>
                                        <td className={`px-4 py-3 text-right font-bold ${saldo >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{fmtCurrency(saldo)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
