'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl, authFetch } from '@/lib/api';
import { PieChart, TrendingUp, TrendingDown, Minus, Download, ChevronDown } from 'lucide-react';

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function LaporanKeuanganPage() {
    const [period, setPeriod] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            let q = `?period=${period}&year=${year}&month=${month}`;
            if (period === 'weekly' && dateFrom && dateTo) {
                q += `&date_from=${dateFrom}&date_to=${dateTo}`;
            }
            const res = await authFetch(apiUrl(`/api/finance/report${q}`));
            const data = await res.json();
            setReport(data);
        } catch { } finally { setLoading(false); }
    }, [period, year, month, dateFrom, dateTo]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const saldo = report?.summary?.saldo ?? 0;
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <PieChart size={22} className="text-violet-600" /> Laporan Keuangan
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Ringkasan keuangan otomatis per periode</p>
                </div>
            </div>

            {/* Period Selector */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Periode</label>
                        <div className="flex rounded-xl overflow-hidden border border-slate-200">
                            {(['monthly', 'yearly', 'weekly'] as const).map(p => (
                                <button key={p} onClick={() => setPeriod(p)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${period === p ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    {p === 'monthly' ? 'Bulanan' : p === 'yearly' ? 'Tahunan' : 'Custom'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {period !== 'weekly' && (
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Tahun</label>
                            <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                {years.map(y => <option key={y}>{y}</option>)}
                            </select>
                        </div>
                    )}
                    {period === 'monthly' && (
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Bulan</label>
                            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                    )}
                    {period === 'weekly' && (
                        <>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Dari</label>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Sampai</label>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                        </>
                    )}
                    <button onClick={fetchReport} className="py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">
                        Tampilkan
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : report && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp size={16} className="text-green-600" />
                                </div>
                                <span className="text-sm text-slate-500 font-medium">Total Masuk</span>
                            </div>
                            <p className="text-2xl font-bold text-green-700">{fmtCurrency(report.summary.total_income)}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <TrendingDown size={16} className="text-amber-600" />
                                </div>
                                <span className="text-sm text-slate-500 font-medium">Total Keluar</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-700">{fmtCurrency(report.summary.total_expense)}</p>
                        </div>
                        <div className={`rounded-2xl border p-5 shadow-sm ${saldo >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${saldo >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                    <Minus size={16} className={saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                                </div>
                                <span className="text-sm text-slate-500 font-medium">Saldo / Selisih</span>
                            </div>
                            <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fmtCurrency(saldo)}</p>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Income by category */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <TrendingUp size={16} className="text-green-600" /> Pemasukan per Kategori
                            </h3>
                            <div className="space-y-2">
                                {(report.income_by_category || []).length === 0 && <p className="text-sm text-slate-400 text-center py-4">Tidak ada data</p>}
                                {(report.income_by_category || []).map((item: any) => (
                                    <div key={item.category} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">{item.category}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${report.summary.total_income > 0 ? (Number(item.total) / report.summary.total_income * 100) : 0}%` }} />
                                            </div>
                                            <span className="text-sm font-semibold text-green-700 w-32 text-right">{fmtCurrency(Number(item.total))}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Expense by category */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <TrendingDown size={16} className="text-amber-600" /> Pengeluaran per Kategori
                            </h3>
                            <div className="space-y-2">
                                {(report.expense_by_category || []).length === 0 && <p className="text-sm text-slate-400 text-center py-4">Tidak ada data</p>}
                                {(report.expense_by_category || []).map((item: any) => (
                                    <div key={item.category} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">{item.category}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${report.summary.total_expense > 0 ? (Number(item.total) / report.summary.total_expense * 100) : 0}%` }} />
                                            </div>
                                            <span className="text-sm font-semibold text-amber-700 w-32 text-right">{fmtCurrency(Number(item.total))}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-700">Detail Transaksi ({(report.transactions || []).length})</h3>
                        </div>
                        {(report.transactions || []).length === 0 ? (
                            <div className="p-10 text-center text-sm text-slate-400">Tidak ada transaksi pada periode ini</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-slate-500 font-medium">Tanggal</th>
                                            <th className="text-left px-4 py-3 text-slate-500 font-medium">Keterangan</th>
                                            <th className="text-left px-4 py-3 text-slate-500 font-medium">Kategori</th>
                                            <th className="text-left px-4 py-3 text-slate-500 font-medium">Jenis</th>
                                            <th className="text-right px-4 py-3 text-slate-500 font-medium">Jumlah</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(report.transactions || []).map((t: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 text-slate-600">{fmtDate(t.trx_date)}</td>
                                                <td className="px-4 py-3 text-slate-800">{t.description}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t.category}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {t.type === 'income' ? 'Masuk' : 'Keluar'}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-700' : 'text-amber-700'}`}>
                                                    {t.type === 'income' ? '+' : '-'}{fmtCurrency(Number(t.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
