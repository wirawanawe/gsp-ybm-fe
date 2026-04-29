'use client';

import { useEffect, useState } from 'react';
import { PieChart, Download, FileSpreadsheet, TrendingUp, Users, Calendar, Ambulance, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl, authFetch } from '@/lib/api';

type OccupancyStats = {
    totalPatients: number;
    activePatients: number;
    dischargedPatients: number;
    deceasedPatients: number;
    referredPatients: number;
};

type PatientInOutRow = {
    id: number;
    patient_name: string;
    registration_number: string;
    nik: string;
    room_number: string;
    bed_number: string;
    check_in_date: string;
    check_out_date: string | null;
    final_status: string | null;
    departure_photo_path?: string | null;
    transfer_reason?: string | null;
};

type AmbulanceUsageRow = {
    id: number;
    plate_number: string;
    vehicle_model: string;
    destination: string;
    patient_name: string | null;
    departure_time: string;
    return_time: string | null;
    status: string;
};

export default function ReportsPage() {
    const [stats, setStats] = useState<OccupancyStats>({
        totalPatients: 0,
        activePatients: 0,
        dischargedPatients: 0,
        deceasedPatients: 0,
        referredPatients: 0
    });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [finalStatusFilter, setFinalStatusFilter] = useState<string>('');
    const [patientInOut, setPatientInOut] = useState<PatientInOutRow[]>([]);
    const [ambulanceUsage, setAmbulanceUsage] = useState<AmbulanceUsageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = async () => {
        try {
            const res = await authFetch(apiUrl('/api/reports/occupancy'));
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal mengambil data');
            setStats({
                totalPatients: data.totalPatients || 0,
                activePatients: data.activePatients || 0,
                dischargedPatients: data.dischargedPatients || 0,
                deceasedPatients: data.deceasedPatients || 0,
                referredPatients: data.referredPatients || 0
            });
        } catch (err: any) {
            setError(err.message);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        setError('');
        try {
            if (startDate && endDate && startDate > endDate) {
                setError('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
                setPatientInOut([]);
                setAmbulanceUsage([]);
                setLoading(false);
                return;
            }

            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (finalStatusFilter) params.append('final_status', finalStatusFilter);

            const [inOutRes, ambRes] = await Promise.all([
                authFetch(apiUrl(`/api/reports/patient-in-out?${params.toString()}`)),
                authFetch(apiUrl(`/api/reports/ambulance-usage?${params.toString()}`))
            ]);
            const inOutData = await inOutRes.json();
            const ambData = await ambRes.json();
            setPatientInOut(Array.isArray(inOutData) ? inOutData : []);
            setAmbulanceUsage(Array.isArray(ambData) ? ambData : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchReports();
    }, [startDate, endDate, finalStatusFilter]);

    const formatDateTime = (dt: string | null) => {
        if (!dt) return '-';
        return new Date(dt).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const buildDateQuery = () => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (finalStatusFilter) params.append('final_status', finalStatusFilter);
        return params.toString();
    };

    const downloadReport = async (path: string, filenamePrefix: string) => {
        try {
            const qs = buildDateQuery();
            const url = apiUrl(`/api/reports/${path}?${qs}`);
            const res = await authFetch(url);
            if (!res.ok) {
                throw new Error('Gagal mengunduh laporan');
            }
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            const suffix =
                startDate && endDate
                    ? (startDate === endDate
                        ? startDate
                        : `${startDate}_sampai_${endDate}`)
                    : 'semua-data';
            a.download = `${filenamePrefix}-${suffix}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Gagal mengunduh laporan');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-[calc(100vh-8rem)]">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6 shrink-0">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Laporan</h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Laporan pasien masuk/keluar dan penggunaan ambulans per tanggal.
                    </p>
                    {error && (
                        <p className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                            {error}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <Calendar size={18} className="text-slate-500 shrink-0" />
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full min-w-0 sm:w-36"
                            />
                            <span className="text-xs text-slate-500">s.d</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full min-w-0 sm:w-36"
                            />
                        </div>
                    </div>
                    <select
                        className="h-10 px-3 rounded-md border border-slate-200 text-sm"
                        value={finalStatusFilter}
                        onChange={e => setFinalStatusFilter(e.target.value)}
                    >
                        <option value="">Semua Status</option>
                        <option value="Sembuh">Sembuh / Pulang</option>
                        <option value="Rujukan Lanjut">Rujukan Lanjut</option>
                        <option value="Meninggal">Meninggal</option>
                        <option value="Masih dirawat">Masih dirawat</option>
                    </select>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 font-medium shrink-0"
                        onClick={() => { fetchStats(); fetchReports(); }}
                        disabled={loading}
                    >
                        <FileSpreadsheet size={18} className="mr-2 text-emerald-600" />
                        Terapkan
                    </Button>
                </div>
            </div>

            {/* Ringkasan Okupansi */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center text-blue-600">
                            <Users size={20} />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Total Pasien</p>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{stats.totalPatients}</h3>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-100 w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600">
                            <TrendingUp size={20} />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Sedang Dirawat</p>
                    </div>
                    <h3 className="text-2xl font-black text-emerald-600">{stats.activePatients}</h3>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600">
                            <PieChart size={20} />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Sembuh / Pulang</p>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{stats.dischargedPatients}</h3>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-rose-100 w-10 h-10 rounded-lg flex items-center justify-center text-rose-600">
                            <PieChart size={20} />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Rujukan Lain</p>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{stats.referredPatients}</h3>
                </div>
            </div>

            {/* Laporan Pasien Masuk & Keluar */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <LogIn size={20} className="text-emerald-600" />
                        <h2 className="font-bold text-slate-800">
                            Laporan Pasien Masuk & Keluar
                            {startDate && endDate ? (
                                <> - {startDate === endDate
                                    ? new Date(startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                    : `${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s.d ${new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}</>
                            ) : (
                                <span> - Semua data</span>
                            )}
                        </h2>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={patientInOut.length === 0}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1"
                        onClick={() => downloadReport('patient-in-out/export', 'laporan-pasien')}
                    >
                        <Download size={16} />
                        Download .xlsx
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Memuat...</div>
                    ) : patientInOut.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Tidak ada data pasien masuk/keluar pada tanggal ini.</div>
                    ) : (
                        <table className="w-full text-left min-w-[640px] sm:min-w-0">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Pasien</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Kamar / Bed</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Waktu Masuk</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Waktu Keluar</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Deskripsi</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Status Akhir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {patientInOut.map(row => (
                                    <tr key={row.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{row.patient_name}</div>
                                            <div className="text-xs text-slate-500">{row.registration_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {row.room_number || '-'} / Bed {row.bed_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">{formatDateTime(row.check_in_date)}</td>
                                        <td className="px-6 py-4 text-sm">{formatDateTime(row.check_out_date)}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {row.final_status === 'Transfer' ? (
                                                <span className="text-xs text-slate-700" title="Alasan pindah">
                                                    {row.transfer_reason || '-'}
                                                </span>
                                            ) : (row.final_status === 'Rujukan Lanjut' || row.final_status === 'Sembuh' || row.final_status === 'Meninggal') && row.departure_photo_path ? (
                                                <a
                                                    href={apiUrl(`/uploads/${row.departure_photo_path}`)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-emerald-700 hover:text-emerald-900 underline text-xs"
                                                >
                                                    Lihat Dokumen Kepulangan
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${row.final_status === 'Sembuh' ? 'bg-emerald-100 text-emerald-700' :
                                                row.final_status === 'Rujukan Lanjut' ? 'bg-amber-100 text-amber-700' :
                                                    row.final_status === 'Meninggal' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {row.final_status || 'Masih dirawat'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Laporan Penggunaan Ambulans */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Ambulance size={20} className="text-emerald-600" />
                        <h2 className="font-bold text-slate-800">
                            Laporan Penggunaan Ambulans
                            {startDate && endDate ? (
                                <> - {startDate === endDate
                                    ? new Date(startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                    : `${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s.d ${new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}</>
                            ) : (
                                <span> - Semua data</span>
                            )}
                        </h2>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={ambulanceUsage.length === 0}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1"
                        onClick={() => downloadReport('ambulance-usage/export', 'laporan-ambulans')}
                    >
                        <Download size={16} />
                        Download .xlsx
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Memuat...</div>
                    ) : ambulanceUsage.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Tidak ada penggunaan ambulans pada tanggal ini.</div>
                    ) : (
                        <table className="w-full text-left min-w-[640px] sm:min-w-0">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Ambulans</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Tujuan</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Pasien</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Berangkat</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Kembali</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ambulanceUsage.map(row => (
                                    <tr key={row.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{row.plate_number}</div>
                                            <div className="text-xs text-slate-500">{row.vehicle_model}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{row.destination}</td>
                                        <td className="px-6 py-4 text-slate-700">{row.patient_name || '-'}</td>
                                        <td className="px-6 py-4 text-sm">{formatDateTime(row.departure_time)}</td>
                                        <td className="px-6 py-4 text-sm">{formatDateTime(row.return_time)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${row.status === 'In-Journey' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {row.status === 'In-Journey' ? 'Dalam Perjalanan' : 'Selesai'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
