'use client';

import { useEffect, useState, useCallback } from 'react';
import { PieChart, Download, FileSpreadsheet, TrendingUp, Users, Calendar, Ambulance, LogIn, ChevronLeft, ChevronRight, Pencil, XCircle, Search } from 'lucide-react';
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
    gender: string | null;
    kabupaten: string | null;
    disease_category: string | null;
    departure_photo_path?: string | null;
    transfer_reason?: string | null;
};

type AmbulanceUsageRow = {
    id: number;
    plate_number: string;
    vehicle_model: string;
    destination: string;
    patient_name: string | null;
    registration_number?: string | null;
    departure_time: string;
    return_time: string | null;
    status: string;
    km_start: number | null;
    km_end: number | null;
    patients?: Array<{
        id?: number;
        patient_name: string;
        registration_number: string;
        destination: string;
    }>;
};

type ActivityReportRow = {
    id: number;
    activity_title: string;
    activity_type: string;
    participant_name: string;
    participant_type: string;
    attendance_date: string;
    status: string;
    notes: string | null;
};

function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange
}: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm shrink-0">
            <span className="text-slate-500">
                Menampilkan <span className="font-semibold text-slate-700">{startItem}</span> - <span className="font-semibold text-slate-700">{endItem}</span> dari <span className="font-semibold text-slate-700">{totalItems}</span> data
            </span>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <ChevronLeft size={16} />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    if (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                    ) {
                        return (
                            <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                className={`h-8 w-8 p-0 text-xs font-semibold ${currentPage === page
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                                        : ''
                                    }`}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </Button>
                        );
                    }
                    if (
                        (page === 2 && currentPage > 3) ||
                        (page === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                        return <span key={page} className="text-slate-400 px-1 text-xs select-none">...</span>;
                    }
                    return null;
                })}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <ChevronRight size={16} />
                </Button>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const [stats, setStats] = useState<OccupancyStats>({
        totalPatients: 0,
        activePatients: 0,
        dischargedPatients: 0,
        deceasedPatients: 0,
        referredPatients: 0
    });
    const [patientNameSearch, setPatientNameSearch] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedBedId, setSelectedBedId] = useState('');
    const [roomsData, setRoomsData] = useState<any[]>([]);
    const [patientStartDate, setPatientStartDate] = useState('');
    const [patientEndDate, setPatientEndDate] = useState('');
    const [ambulanceStartDate, setAmbulanceStartDate] = useState('');
    const [ambulanceEndDate, setAmbulanceEndDate] = useState('');
    const [activityStartDate, setActivityStartDate] = useState('');
    const [activityEndDate, setActivityEndDate] = useState('');
    const [patientDateType, setPatientDateType] = useState('');
    const [ambulanceDateType, setAmbulanceDateType] = useState('');

    const [editStayLog, setEditStayLog] = useState<any | null>(null);
    const [editCheckInDate, setEditCheckInDate] = useState<string>('');
    const [editCheckOutDate, setEditCheckOutDate] = useState<string>('');
    const [editFinalStatus, setEditFinalStatus] = useState<string>('');
    const [editSubmitting, setEditSubmitting] = useState(false);

    // Edit State for AmbulanceLogs
    const [editAmbulanceLog, setEditAmbulanceLog] = useState<AmbulanceUsageRow | null>(null);
    const [editAmbKmStart, setEditAmbKmStart] = useState<number | string>('');
    const [editAmbKmEnd, setEditAmbKmEnd] = useState<number | string>('');
    const [editAmbDepTime, setEditAmbDepTime] = useState<string>('');
    const [editAmbRetTime, setEditAmbRetTime] = useState<string>('');
    const [editAmbSubmitting, setEditAmbSubmitting] = useState(false);

    const [finalStatusFilter, setFinalStatusFilter] = useState<string>('');
    const [patientInOut, setPatientInOut] = useState<PatientInOutRow[]>([]);
    const [ambulanceUsage, setAmbulanceUsage] = useState<AmbulanceUsageRow[]>([]);
    const [activityReport, setActivityReport] = useState<ActivityReportRow[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [activityId, setActivityId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'pasien' | 'ambulans' | 'kegiatan'>('pasien');
    const [patientPage, setPatientPage] = useState(1);
    const [ambulancePage, setAmbulancePage] = useState(1);
    const [activityPage, setActivityPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const handleEditStayLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editStayLog) return;
        setEditSubmitting(true);
        try {
            const res = await authFetch(apiUrl(`/api/rooms/stay/${editStayLog.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    check_in_date: editCheckInDate || undefined,
                    check_out_date: editCheckOutDate || undefined,
                    final_status: editFinalStatus || undefined,
                })
            });
            if (res.ok) {
                alert('Data laporan berhasil diupdate!');
                setEditStayLog(null);
                fetchPatientReport();
            } else {
                const data = await res.json();
                alert(`Gagal: ${data.message}`);
            }
        } catch (err) {
            console.error('editStayLog err:', err);
            alert('Kesalahan jaringan');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleEditAmbulanceLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editAmbulanceLog) return;
        setEditAmbSubmitting(true);
        try {
            const res = await authFetch(apiUrl(`/api/ambulance/logs/${editAmbulanceLog.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    km_start: Number(editAmbKmStart) || 0,
                    km_end: Number(editAmbKmEnd) || 0,
                    departure_time: editAmbDepTime || undefined,
                    return_time: editAmbRetTime || undefined,
                })
            });
            if (res.ok) {
                alert('Data laporan ambulans berhasil diupdate!');
                setEditAmbulanceLog(null);
                fetchAmbulanceReport();
            } else {
                const data = await res.json();
                alert(`Gagal: ${data.message}`);
            }
        } catch (err) {
            console.error('editAmbulanceLog err:', err);
            alert('Kesalahan jaringan');
        } finally {
            setEditAmbSubmitting(false);
        }
    };

    useEffect(() => {
        setPatientPage(1);
    }, [patientStartDate, patientEndDate, finalStatusFilter, patientDateType, patientNameSearch, selectedRoomId, selectedBedId]);

    useEffect(() => {
        setAmbulancePage(1);
    }, [ambulanceStartDate, ambulanceEndDate, ambulanceDateType]);

    useEffect(() => {
        setActivityPage(1);
    }, [activityStartDate, activityEndDate, activityId]);

    useEffect(() => {
        // Fetch rooms data for dropdowns
        const loadRooms = async () => {
            try {
                const res = await authFetch(apiUrl('/api/rooms'));
                if (res.ok) {
                    const data = await res.json();
                    setRoomsData(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Failed to load rooms:', err);
            }
        };
        loadRooms();
    }, []);

    const fetchActivities = useCallback(async () => {
        try {
            const res = await authFetch(apiUrl('/api/activities'));
            const data = await res.json();
            setActivities(data);
        } catch (e) {
            console.error('Failed to fetch activities', e);
        }
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

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

    const fetchPatientReport = async () => {
        if (activeTab !== 'pasien') return;
        setLoading(true);
        setError('');
        try {
            if (patientStartDate && patientEndDate && patientStartDate > patientEndDate) {
                setError('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
                setPatientInOut([]);
                setLoading(false);
                return;
            }

            const params = new URLSearchParams();
            if (patientNameSearch) params.append('name', patientNameSearch);
            if (selectedRoomId) params.append('room_id', selectedRoomId);
            if (selectedBedId) params.append('bed_id', selectedBedId);
            if (patientStartDate) params.append('start_date', patientStartDate);
            if (patientEndDate) params.append('end_date', patientEndDate);
            if (finalStatusFilter) params.append('final_status', finalStatusFilter);
            if (patientDateType) params.append('date_type', patientDateType);

            const res = await authFetch(apiUrl(`/api/reports/patient-in-out?${params.toString()}`));
            const data = await res.json();
            setPatientInOut(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAmbulanceReport = async () => {
        setLoading(true);
        setError('');
        try {
            if (ambulanceStartDate && ambulanceEndDate && ambulanceStartDate > ambulanceEndDate) {
                setError('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
                setAmbulanceUsage([]);
                setLoading(false);
                return;
            }

            const params = new URLSearchParams();
            if (ambulanceStartDate) params.append('start_date', ambulanceStartDate);
            if (ambulanceEndDate) params.append('end_date', ambulanceEndDate);
            if (ambulanceDateType) params.append('date_type', ambulanceDateType);

            const res = await authFetch(apiUrl(`/api/reports/ambulance-usage?${params.toString()}`));
            const data = await res.json();
            setAmbulanceUsage(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityReport = async () => {
        setLoading(true);
        setError('');
        try {
            if (activityStartDate && activityEndDate && activityStartDate > activityEndDate) {
                setError('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
                setActivityReport([]);
                setLoading(false);
                return;
            }

            const params = new URLSearchParams();
            if (activityStartDate) params.append('start_date', activityStartDate);
            if (activityEndDate) params.append('end_date', activityEndDate);
            if (activityId) params.append('activity_id', activityId);

            const res = await authFetch(apiUrl(`/api/reports/activity?${params.toString()}`));
            const data = await res.json();
            setActivityReport(Array.isArray(data) ? data : []);
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
        if (activeTab === 'pasien') {
            fetchPatientReport();
        }
    }, [activeTab, patientStartDate, patientEndDate, finalStatusFilter, patientDateType, patientNameSearch, selectedRoomId, selectedBedId]);

    useEffect(() => {
        if (activeTab === 'ambulans') {
            fetchAmbulanceReport();
        }
    }, [activeTab, ambulanceStartDate, ambulanceEndDate, ambulanceDateType]);

    useEffect(() => {
        if (activeTab === 'kegiatan') {
            fetchActivityReport();
        }
    }, [activeTab, activityStartDate, activityEndDate, activityId]);

    const formatDateTime = (dt: string | null) => {
        if (!dt) return '-';
        return new Date(dt).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatDateOnly = (dt: string | null) => {
        if (!dt) return '-';
        return new Date(dt).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const downloadReport = async (
        path: string,
        filenamePrefix: string,
        paramsObj?: { start_date?: string; end_date?: string;[key: string]: any }
    ) => {
        try {
            const params = new URLSearchParams();
            if (paramsObj) {
                Object.entries(paramsObj).forEach(([key, val]) => {
                    if (val) params.append(key, val);
                });
            }
            const qs = params.toString();
            const url = apiUrl(`/api/reports/${path}${qs ? `?${qs}` : ''}`);
            const res = await authFetch(url);
            if (!res.ok) {
                throw new Error('Gagal mengunduh laporan');
            }
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;

            const start = paramsObj?.start_date;
            const end = paramsObj?.end_date;
            const suffix =
                start && end
                    ? (start === end
                        ? start
                        : `${start}_sampai_${end}`)
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

    const paginatedPatientInOut = patientInOut.slice((patientPage - 1) * ITEMS_PER_PAGE, patientPage * ITEMS_PER_PAGE);
    const paginatedAmbulanceUsage = ambulanceUsage.slice((ambulancePage - 1) * ITEMS_PER_PAGE, ambulancePage * ITEMS_PER_PAGE);
    const paginatedActivityReport = activityReport.slice((activityPage - 1) * ITEMS_PER_PAGE, activityPage * ITEMS_PER_PAGE);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-[calc(100vh-8rem)]">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6 shrink-0">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Laporan</h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Laporan pasien, ambulans, dan kegiatan operasional.
                    </p>
                    {error && (
                        <p className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                            {error}
                        </p>
                    )}
                </div>
            </div>

            {/* Ringkasan Okupansi */}
            {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
            </div> */}

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-6 shrink-0">
                <button
                    type="button"
                    onClick={() => setActiveTab('pasien')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pasien'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                >
                    <Users size={16} />
                    Pasien
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('ambulans')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'ambulans'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                >
                    <Ambulance size={16} />
                    Ambulans
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('kegiatan')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'kegiatan'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                >
                    <Calendar size={16} />
                    Kegiatan
                </button>
            </div>

            {/* Laporan Pasien Masuk & Keluar */}
            {activeTab === 'pasien' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                                <LogIn size={20} className="text-emerald-600 shrink-0" />
                                <h2 className="font-bold text-slate-800 truncate">
                                    Laporan Pasien Masuk & Keluar
                                    {patientStartDate && patientEndDate ? (
                                        <span className="hidden sm:inline font-normal text-slate-500 text-sm">
                                            {' '} ({patientStartDate === patientEndDate
                                                ? formatDateOnly(patientStartDate)
                                                : `${formatDateOnly(patientStartDate)} - ${formatDateOnly(patientEndDate)}`})
                                        </span>
                                    ) : (
                                        <span className="hidden sm:inline font-normal text-slate-500 text-sm"> - Semua data</span>
                                    )}
                                </h2>
                            </div>
                            <Button
                                variant="outline"
                                disabled={patientInOut.length === 0}
                                className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 font-semibold text-xs shrink-0 self-start sm:self-auto"
                                onClick={() => downloadReport('patient-in-out/export', 'laporan-pasien', { name: patientNameSearch, room_id: selectedRoomId, bed_id: selectedBedId, start_date: patientStartDate, end_date: patientEndDate, final_status: finalStatusFilter, date_type: patientDateType })}
                            >
                                <Download size={15} />
                                Download .xlsx
                            </Button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="text"
                                    placeholder="Cari nama pasien..."
                                    value={patientNameSearch}
                                    onChange={(e) => setPatientNameSearch(e.target.value)}
                                    className="h-9 w-48 bg-white border border-slate-200 rounded-md pl-9 pr-3 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                                />
                            </div>
                            <select
                                value={selectedRoomId}
                                onChange={(e) => {
                                    setSelectedRoomId(e.target.value);
                                    setSelectedBedId(''); // Reset bed when room changes
                                }}
                                className="h-9 px-3.5 rounded-md border border-slate-200 text-xs bg-white font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">Semua Kamar</option>
                                {roomsData.map(r => (
                                    <option key={r.id} value={r.id}>{r.room_number}</option>
                                ))}
                            </select>
                            <select
                                value={selectedBedId}
                                onChange={(e) => setSelectedBedId(e.target.value)}
                                disabled={!selectedRoomId}
                                className="h-9 px-3.5 rounded-md border border-slate-200 text-xs bg-white font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-50"
                            >
                                <option value="">Semua Bed</option>
                                {selectedRoomId && roomsData.find(r => String(r.id) === String(selectedRoomId))?.beds?.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.bed_number}</option>
                                ))}
                            </select>
                            <select
                                className="h-9 px-3.5 rounded-md border border-slate-200 text-xs bg-white font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                value={patientDateType}
                                onChange={e => setPatientDateType(e.target.value)}
                            >
                                <option value="">Masuk & Keluar</option>
                                <option value="check_in">Waktu Masuk</option>
                                <option value="check_out">Waktu Keluar</option>
                            </select>
                            <div className="flex items-center gap-2 min-w-0 bg-white border border-slate-200 rounded-md h-9 px-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                                <Calendar size={14} className="text-slate-400 shrink-0" />
                                <div className="flex items-center gap-1">
                                    <input
                                        type="date"
                                        value={patientStartDate}
                                        onChange={e => setPatientStartDate(e.target.value)}
                                        className="w-28 text-xs outline-none bg-transparent"
                                    />
                                    <span className="text-[10px] text-slate-400 font-medium">s/d</span>
                                    <input
                                        type="date"
                                        value={patientEndDate}
                                        onChange={e => setPatientEndDate(e.target.value)}
                                        className="w-28 text-xs outline-none bg-transparent"
                                    />
                                </div>
                            </div>
                            <select
                                className="h-9 px-3.5 rounded-md border border-slate-200 text-xs bg-white font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                value={finalStatusFilter}
                                onChange={e => setFinalStatusFilter(e.target.value)}
                            >
                                <option value="">Status Pasien</option>
                                <option value="Aktif & Pulang">Aktif & Pulang</option>
                                <option value="Sembuh">Sembuh / Pulang</option>
                                <option value="Rujukan Lanjut">Rujukan Lanjut</option>
                                <option value="Meninggal">Meninggal</option>
                                <option value="Pulang Paksa">Pulang Paksa</option>
                                <option value="Masih dirawat">Masih Dirawat</option>
                            </select>
                        </div>
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
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Jenis Kelamin</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Kota</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Penyakit</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Kamar / Bed</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Waktu Masuk</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Waktu Keluar</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Deskripsi</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Status Akhir</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedPatientInOut.map(row => (
                                        <tr key={row.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{row.patient_name}</div>
                                                <div className="text-xs text-slate-500">{row.registration_number}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 text-sm">
                                                {row.gender || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 text-sm">
                                                {row.kabupaten || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 text-sm">
                                                {row.disease_category || '-'}
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
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setEditStayLog(row);
                                                        setEditCheckInDate(row.check_in_date ? new Date(row.check_in_date).toISOString().slice(0, 16) : '');
                                                        setEditCheckOutDate(row.check_out_date ? new Date(row.check_out_date).toISOString().slice(0, 16) : '');
                                                        setEditFinalStatus(row.final_status || '');
                                                    }}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                                                    title="Edit Data Laporan"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <Pagination
                        currentPage={patientPage}
                        totalPages={Math.ceil(patientInOut.length / ITEMS_PER_PAGE)}
                        totalItems={patientInOut.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setPatientPage}
                    />
                </div>
            )}

            {/* Modal Edit Laporan */}
            {editStayLog && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 truncate pr-2">
                                <Pencil className="text-orange-600" />
                                Edit Laporan ({editStayLog.patient_name})
                            </h2>
                            <button onClick={() => setEditStayLog(null)} className="text-slate-400 hover:text-slate-700">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditStayLog} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Masuk</label>
                                <input
                                    type="datetime-local"
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={editCheckInDate}
                                    onChange={e => setEditCheckInDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Keluar</label>
                                <input
                                    type="datetime-local"
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={editCheckOutDate}
                                    onChange={e => setEditCheckOutDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status Akhir</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={editFinalStatus}
                                    onChange={e => setEditFinalStatus(e.target.value)}
                                >
                                    <option value="">Masih dirawat</option>
                                    <option value="Sembuh">Sembuh</option>
                                    <option value="Rujukan Lanjut">Rujukan Lanjut</option>
                                    <option value="Transfer">Transfer</option>
                                    <option value="Meninggal">Meninggal</option>
                                    <option value="Pulang Paksa">Pulang Paksa</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-2 sm:gap-3 border-t border-slate-100 mt-6">
                                <Button type="button" variant="outline" onClick={() => setEditStayLog(null)} className="w-full sm:w-auto">Batal</Button>
                                <Button type="submit" disabled={editSubmitting} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                                    {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Laporan Penggunaan Ambulans */}
            {activeTab === 'ambulans' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <Ambulance size={20} className="text-emerald-600 shrink-0" />
                            <h2 className="font-bold text-slate-800 truncate">
                                Laporan Penggunaan Ambulans
                                {ambulanceStartDate && ambulanceEndDate ? (
                                    <span className="hidden sm:inline font-normal text-slate-500 text-sm">
                                        {' '} ({ambulanceStartDate === ambulanceEndDate
                                            ? formatDateOnly(ambulanceStartDate)
                                            : `${formatDateOnly(ambulanceStartDate)} - ${formatDateOnly(ambulanceEndDate)}`})
                                    </span>
                                ) : (
                                    <span className="hidden sm:inline font-normal text-slate-500 text-sm"> - Semua data</span>
                                )}
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <select
                                className="h-9 px-3.5 rounded-md border border-slate-200 text-xs bg-white font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                value={ambulanceDateType}
                                onChange={e => setAmbulanceDateType(e.target.value)}
                            >
                                <option value="">Berangkat & Kembali</option>
                                <option value="departure">Waktu Berangkat</option>
                                <option value="return">Waktu Kembali</option>
                            </select>
                            <div className="flex items-center gap-2 min-w-0">
                                <Calendar size={16} className="text-slate-500 shrink-0" />
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="date"
                                        value={ambulanceStartDate}
                                        onChange={e => setAmbulanceStartDate(e.target.value)}
                                        className="h-9 w-32 min-w-0 text-xs px-2"
                                    />
                                    <span className="text-xs text-slate-500 font-medium">s.d</span>
                                    <Input
                                        type="date"
                                        value={ambulanceEndDate}
                                        onChange={e => setAmbulanceEndDate(e.target.value)}
                                        className="h-9 w-32 min-w-0 text-xs px-2"
                                    />
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={ambulanceUsage.length === 0}
                                className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 font-semibold text-xs shrink-0"
                                onClick={() => downloadReport('ambulance-usage/export', 'laporan-ambulans', { start_date: ambulanceStartDate, end_date: ambulanceEndDate, date_type: ambulanceDateType })}
                            >
                                <Download size={15} />
                                Download .xlsx
                            </Button>
                        </div>
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
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">KM Awal</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">KM Akhir</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Berangkat</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Kembali</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Status</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedAmbulanceUsage.map(row => (
                                        <tr key={row.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{row.plate_number}</div>
                                                <div className="text-xs text-slate-500">{row.vehicle_model}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {row.patients && row.patients.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {row.patients.map((p, idx) => (
                                                            <div key={idx} className="text-sm">
                                                                <span className="text-slate-800">{p.destination || row.destination || '-'}</span>
                                                                {row.patients!.length > 1 && (
                                                                    <span className="text-xs text-slate-400 block font-normal">({p.patient_name})</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    row.destination
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {row.patients && row.patients.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {row.patients.map((p, idx) => (
                                                            <div key={idx} className="text-sm">
                                                                <span className="font-semibold text-slate-800">{p.patient_name}</span>
                                                                <span className="text-xs text-slate-500 block">Reg: {p.registration_number || '-'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{row.patient_name || '-'}</div>
                                                        {row.registration_number && (
                                                            <div className="text-xs text-slate-500">Reg: {row.registration_number}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">{row.km_start ?? '-'}</td>
                                            <td className="px-6 py-4 text-sm">{row.km_end ?? '-'}</td>
                                            <td className="px-6 py-4 text-sm">{formatDateTime(row.departure_time)}</td>
                                            <td className="px-6 py-4 text-sm">{formatDateTime(row.return_time)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${row.status === 'In-Journey' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {row.status === 'In-Journey' ? 'Dalam Perjalanan' : 'Selesai'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setEditAmbulanceLog(row);
                                                        setEditAmbKmStart(row.km_start ?? '');
                                                        setEditAmbKmEnd(row.km_end ?? '');
                                                        setEditAmbDepTime(row.departure_time ? new Date(row.departure_time).toISOString().slice(0, 16) : '');
                                                        setEditAmbRetTime(row.return_time ? new Date(row.return_time).toISOString().slice(0, 16) : '');
                                                    }}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                                                    title="Edit Data Ambulans"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <Pagination
                        currentPage={ambulancePage}
                        totalPages={Math.ceil(ambulanceUsage.length / ITEMS_PER_PAGE)}
                        totalItems={ambulanceUsage.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setAmbulancePage}
                    />
                </div>
            )}

            {/* Modal Edit Laporan Ambulans */}
            {editAmbulanceLog && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 truncate pr-2">
                                <Pencil className="text-orange-600" />
                                Edit Laporan Ambulans ({editAmbulanceLog.plate_number})
                            </h2>
                            <button onClick={() => setEditAmbulanceLog(null)} className="text-slate-400 hover:text-slate-700">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditAmbulanceLog} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">KM Awal</label>
                                <input
                                    type="number"
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={editAmbKmStart}
                                    onChange={e => setEditAmbKmStart(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">KM Akhir</label>
                                <input
                                    type="number"
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={editAmbKmEnd}
                                    onChange={e => setEditAmbKmEnd(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Berangkat</label>
                                <input
                                    type="datetime-local"
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={editAmbDepTime}
                                    onChange={e => setEditAmbDepTime(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Kembali</label>
                                <input
                                    type="datetime-local"
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={editAmbRetTime}
                                    onChange={e => setEditAmbRetTime(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2 sm:gap-3 border-t border-slate-100 mt-6">
                                <Button type="button" variant="outline" onClick={() => setEditAmbulanceLog(null)} className="w-full sm:w-auto">Batal</Button>
                                <Button type="submit" disabled={editAmbSubmitting} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                                    {editAmbSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Laporan Kegiatan */}
            {activeTab === 'kegiatan' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <Calendar size={20} className="text-emerald-600 shrink-0" />
                            <h2 className="font-bold text-slate-800 truncate">
                                Laporan Kegiatan & Presensi
                                {activityStartDate && activityEndDate ? (
                                    <span className="hidden sm:inline font-normal text-slate-500 text-sm">
                                        {' '} ({activityStartDate === activityEndDate
                                            ? formatDateOnly(activityStartDate)
                                            : `${formatDateOnly(activityStartDate)} - ${formatDateOnly(activityEndDate)}`})
                                    </span>
                                ) : (
                                    <span className="hidden sm:inline font-normal text-slate-500 text-sm"> - Semua data</span>
                                )}
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <Calendar size={16} className="text-slate-500 shrink-0" />
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="date"
                                        value={activityStartDate}
                                        onChange={e => setActivityStartDate(e.target.value)}
                                        className="h-9 w-32 min-w-0 text-xs px-2"
                                    />
                                    <span className="text-xs text-slate-500 font-medium">s.d</span>
                                    <Input
                                        type="date"
                                        value={activityEndDate}
                                        onChange={e => setActivityEndDate(e.target.value)}
                                        className="h-9 w-32 min-w-0 text-xs px-2"
                                    />
                                </div>
                            </div>
                            <select
                                value={activityId}
                                onChange={(e) => setActivityId(e.target.value)}
                                className="h-9 px-3.5 rounded-md border border-slate-200 text-xs bg-white font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-w-[150px]"
                            >
                                <option value="">Semua Kegiatan</option>
                                {activities.map(act => (
                                    <option key={act.id} value={act.id}>{act.title}</option>
                                ))}
                            </select>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={activityReport.length === 0}
                                className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 font-semibold text-xs shrink-0"
                                onClick={() => downloadReport('activity/export', 'laporan-kegiatan', { start_date: activityStartDate, end_date: activityEndDate, activity_id: activityId })}
                            >
                                <Download size={15} />
                                Download .xlsx
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Memuat...</div>
                        ) : activityReport.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">Tidak ada data kegiatan pada tanggal ini.</div>
                        ) : (
                            <table className="w-full text-left min-w-[640px] sm:min-w-0">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Tanggal</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Kegiatan</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Peserta</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Kategori</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Status</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedActivityReport.map(row => (
                                        <tr key={row.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                {formatDateOnly(row.attendance_date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{row.activity_title}</div>
                                                <div className="text-xs text-slate-500">{row.activity_type}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">{row.participant_name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{row.participant_type}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${row.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate italic">
                                                {row.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <Pagination
                        currentPage={activityPage}
                        totalPages={Math.ceil(activityReport.length / ITEMS_PER_PAGE)}
                        totalItems={activityReport.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setActivityPage}
                    />
                </div>
            )}
        </div>
    );
}
