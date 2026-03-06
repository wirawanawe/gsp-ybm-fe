'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl } from '@/lib/api';

type Ambulance = {
    id: number;
    plate_number: string;
    vehicle_model: string;
    status: 'Available' | 'In-Journey' | 'Maintenance';
};

type AmbulanceLog = {
    id: number;
    ambulance_id: number;
    ambulance_plate: string;
    destination: string;
    patient_name: string | null;
    status: 'In-Journey' | 'Completed' | 'Cancelled';
    departure_time: string;
    return_time: string | null;
    patients?: { id: number; patient_name: string; registration_number: string; destination?: string | null; document_path?: string | null }[];
};

export default function AmbulancePage() {
    const [logs, setLogs] = useState<AmbulanceLog[]>([]);
    const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [formState, setFormState] = useState<{
        ambulance_id: string;
        patient_id: string;
    }>({
        ambulance_id: '',
        patient_id: ''
    });
    const [patients, setPatients] = useState<{ id: number; name: string; registration_number: string }[]>([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
    const [patientDestinations, setPatientDestinations] = useState<Record<string, string>>({});
    const [patientDocuments, setPatientDocuments] = useState<Record<string, File | null>>({});

    // Waktu manual berangkat & kembali
    const [departureTime, setDepartureTime] = useState('');
    const [isCompleteOpen, setIsCompleteOpen] = useState(false);
    const [completeLogId, setCompleteLogId] = useState<number | null>(null);
    const [returnTime, setReturnTime] = useState('');
    const [isCompleting, setIsCompleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsRes, ambRes] = await Promise.all([
                fetch(apiUrl('/api/ambulance/logs')),
                fetch(apiUrl('/api/ambulance'))
            ]);
            const logsData = await logsRes.json();
            const ambData = await ambRes.json();
            setLogs(Array.isArray(logsData) ? logsData : []);
            setAmbulances(Array.isArray(ambData) ? ambData : []);
        } catch (err) {
            console.error('fetch ambulance data error:', err);
            setLogs([]);
            setAmbulances([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Booking ambulans dari seluruh Data Pasien
    const fetchPatients = async () => {
        try {
            const res = await fetch(apiUrl('/api/patients'));
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('fetch patients error:', err);
            setPatients([]);
        }
    };

    const openBookingModal = () => {
        fetchPatients();
        setFormState({ ambulance_id: '', patient_id: '' });
        setPatientSearch('');
        setSelectedPatientIds([]);
        setPatientDestinations({});
        setPatientDocuments({});
        setFormError('');
        
        // Default jam berangkat saat ini format datetime-local
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        setDepartureTime(`${year}-${month}-${date}T${hour}:${minute}`);
        
        setIsBookingOpen(true);
    };

    const openCompleteModal = (logId: number) => {
        setCompleteLogId(logId);
        // Default jam pulang saat ini format datetime-local
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        setReturnTime(`${year}-${month}-${date}T${hour}:${minute}`);
        setIsCompleteOpen(true);
    };

    const availableAmbulances = ambulances.filter(a => a.status === 'Available');
    const activeCount = ambulances.filter(a => a.status === 'In-Journey').length;

    const filteredPatients = patients.filter(p => {
        if (!patientSearch.trim()) return true;
        const term = patientSearch.toLowerCase();
        return (
            p.name.toLowerCase().includes(term) ||
            p.registration_number.toLowerCase().includes(term)
        );
    });

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validasi: minimal satu pasien dan tujuan per pasien wajib diisi
        const ids = selectedPatientIds.length
            ? selectedPatientIds
            : (formState.patient_id ? [formState.patient_id] : []);

        if (ids.length === 0) {
            setFormError('Pilih minimal satu pasien untuk booking ambulans.');
            return;
        }

        const missingDestination = ids.some(id => !patientDestinations[id] || !patientDestinations[id].trim());
        if (missingDestination) {
            setFormError('Lengkapi tujuan untuk setiap pasien yang dibawa ambulans.');
            return;
        }

        setIsSubmitting(true);
        setFormError('');
        try {
            const patient_destinations: Record<string, string> = {};
            ids.forEach(id => {
                patient_destinations[id] = patientDestinations[id] || '';
            });

            const uniqueDest = Array.from(
                new Set(
                    ids
                        .map(id => (patient_destinations[id] || '').trim())
                        .filter(Boolean)
                )
            );
            const globalDestination =
                uniqueDest.length === 1
                    ? uniqueDest[0]
                    : uniqueDest.length > 1
                        ? 'Multi tujuan (lihat per pasien)'
                        : '';

            const hasFiles = ids.some(id => patientDocuments[id]);

            let res: Response;
            if (hasFiles) {
                const fd = new FormData();
                fd.append('ambulance_id', String(Number(formState.ambulance_id)));
                fd.append('destination', globalDestination);
                if (ids[0]) fd.append('patient_id', String(Number(ids[0])));
                fd.append('patient_ids', JSON.stringify(ids.map(id => Number(id))));
                fd.append('patient_destinations', JSON.stringify(patient_destinations));
                ids.forEach(id => {
                    if (patientDocuments[id]) {
                        fd.append(`document_${id}`, patientDocuments[id] as File);
                    }
                });
                if (departureTime) fd.append('departure_time', departureTime);

                res = await fetch(apiUrl('/api/ambulance/logs'), {
                    method: 'POST',
                    body: fd
                });
            } else {
                res = await fetch(apiUrl('/api/ambulance/logs'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ambulance_id: Number(formState.ambulance_id),
                        destination: globalDestination,
                        patient_id: ids[0] ? Number(ids[0]) : null,
                        patient_ids: ids.map(id => Number(id)),
                        patient_destinations,
                        departure_time: departureTime || null
                    })
                });
            }

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal membuat booking ambulans');
            }
            setIsBookingOpen(false);
            setFormState({ ambulance_id: '', patient_id: '' });
            setSelectedPatientIds([]);
            setPatientDestinations({});
            setPatientDocuments({});
            window.location.reload();
        } catch (err: any) {
            console.error('create booking error:', err);
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!completeLogId) return;

        setIsCompleting(true);
        try {
            const res = await fetch(
                apiUrl(`/api/ambulance/logs/${completeLogId}/complete`),
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ return_time: returnTime || null })
                }
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal menyelesaikan trip');
            }
            setIsCompleteOpen(false);
            window.location.reload();
        } catch (err: any) {
            console.error('complete trip error:', err);
            alert(err.message || 'Gagal menyelesaikan trip ambulans');
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-[calc(100vh-8rem)] h-[calc(100vh-8rem)] relative">
            {/* Modal Booking - Responsive */}
            {isBookingOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate pr-2">
                                Booking Ambulans Baru
                            </h2>
                            <button
                                onClick={() => setIsBookingOpen(false)}
                                className="text-slate-400 hover:text-slate-700 shrink-0 p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateBooking} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                            {formError && (
                                <div className="mb-3 p-3 rounded-md bg-rose-50 text-rose-700 text-sm border border-rose-200">
                                    {formError}
                                </div>
                            )}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Tanggal & Jam Berangkat
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                        value={departureTime}
                                        onChange={e => setDepartureTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Pilih Ambulans Tersedia
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                        value={formState.ambulance_id}
                                        onChange={e =>
                                            setFormState(prev => ({
                                                ...prev,
                                                ambulance_id: e.target.value
                                            }))
                                        }
                                        required
                                    >
                                        <option value="">-- Pilih Ambulans --</option>
                                        {availableAmbulances.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.plate_number} ({a.vehicle_model})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Tujuan sekarang diisi per pasien, bukan tujuan umum */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Pilih Pasien (opsional)
                                    </label>
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Cari nama / no. registrasi..."
                                            value={patientSearch}
                                            onChange={e => setPatientSearch(e.target.value)}
                                            className="h-9 text-sm"
                                        />
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                            value={formState.patient_id}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setFormState(prev => ({
                                                    ...prev,
                                                    patient_id: val
                                                }));
                                                if (val && !selectedPatientIds.includes(val)) {
                                                    setSelectedPatientIds(prev => [...prev, val]);
                                                }
                                            }}
                                        >
                                            <option value="">-- Pilih Pasien --</option>
                                            {filteredPatients.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (Reg: {p.registration_number})
                                                </option>
                                            ))}
                                        </select>
                                        {selectedPatientIds.length > 0 && (
                                            <div className="space-y-2 pt-1">
                                                {selectedPatientIds.map(id => {
                                                    const p = patients.find(pt => String(pt.id) === id);
                                                    if (!p) return null;
                                                    return (
                                                        <div
                                                            key={id}
                                                            className="flex flex-col sm:flex-row sm:items-center gap-2 border border-emerald-100 rounded-md px-2 py-2 bg-emerald-50/40"
                                                        >
                                                            <div className="flex-1 text-xs text-slate-800">
                                                                <div className="font-medium">{p.name}</div>
                                                                <div className="text-slate-500">
                                                                    Reg: {p.registration_number}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <Input
                                                                    placeholder="Tujuan pasien ini (opsional)"
                                                                    value={patientDestinations[id] ?? ''}
                                                                    onChange={e =>
                                                                        setPatientDestinations(prev => ({
                                                                            ...prev,
                                                                            [id]: e.target.value
                                                                        }))
                                                                    }
                                                                    className="h-8 text-xs"
                                                                />
                                                                <div>
                                                                    <label className="text-xs text-slate-500 mb-0.5 block">Upload Dokumen</label>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,application/pdf"
                                                                        className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-medium"
                                                                        onChange={e => {
                                                                            const file = e.target.files?.[0] || null;
                                                                            setPatientDocuments(prev => ({ ...prev, [id]: file }));
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="text-emerald-700 hover:text-emerald-900 text-xs px-2 self-start mt-1"
                                                                onClick={() => {
                                                                    setSelectedPatientIds(prev =>
                                                                        prev.filter(x => x !== id)
                                                                    );
                                                                    setPatientDestinations(prev => {
                                                                        const n = { ...prev };
                                                                        delete n[id];
                                                                        return n;
                                                                    });
                                                                    setPatientDocuments(prev => {
                                                                        const n = { ...prev };
                                                                        delete n[id];
                                                                        return n;
                                                                    });
                                                                }}
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    {patients.length === 0 && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Belum ada data pasien
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsBookingOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Booking'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Complete Trip */}
            {isCompleteOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate pr-2">
                                Selesaikan Trip
                            </h2>
                            <button
                                onClick={() => setIsCompleteOpen(false)}
                                className="text-slate-400 hover:text-slate-700 shrink-0 p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCompleteTrip} className="p-4 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Tanggal & Jam Kembali
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={returnTime}
                                    onChange={e => setReturnTime(e.target.value)}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCompleteOpen(false)}
                                    disabled={isCompleting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isCompleting}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isCompleting ? 'Menyimpan...' : 'Selesai'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 shrink-0">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Logistik & Jadwal Ambulans</h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Booking perjalanan ambulans untuk rujukan pasien.
                    </p>
                </div>
                <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md shadow-emerald-200"
                    onClick={openBookingModal}
                    disabled={availableAmbulances.length === 0}
                >
                    <Plus size={18} className="mr-2" />
                    Booking Ambulans Baru
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-slate-50 border border-emerald-200 rounded-xl p-6 lg:col-span-1 shadow-sm flex flex-col items-center text-center">
                    <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                        <Navigation size={28} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">Armada Terdaftar</h3>
                    <p className="text-3xl font-black text-slate-800 mb-1">{ambulances.length}</p>
                    <span className="text-xs text-slate-500 mb-1">
                        Aktif perjalanan: {activeCount}
                    </span>
                    <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                        Tersedia: {availableAmbulances.length}
                    </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden sm:col-span-2 lg:col-span-3 flex-1 flex flex-col min-h-0">
                    <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                        <h2 className="font-bold text-slate-800 text-sm sm:text-base">Log Perjalanan</h2>
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                            <Input
                                placeholder="Cari tujuan / nopol..."
                                className="pl-9 h-9 border-slate-200"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-full py-10 text-slate-500 gap-3">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Memuat log perjalanan...</span>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                                <p className="font-medium text-slate-600">
                                    Belum ada perjalanan ambulans tercatat.
                                </p>
                                <p className="text-sm mt-1">
                                    Booking ambulans baru untuk memulai log perjalanan.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left bg-white min-w-[640px] sm:min-w-0">
                                <thead className="bg-white border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">
                                            Ambulans
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">
                                            Pasien
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Tujuan</th>
                                        <th className="px-3 sm:px-6 py-3 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Dokumentasi</th>
                                        <th className="px-3 sm:px-6 py-3 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Waktu</th>
                                        <th className="px-3 sm:px-6 py-3 font-semibold text-slate-700 text-xs sm:text-sm whitespace-nowrap">Status</th>
                                        <th className="px-3 sm:px-6 py-3 font-semibold text-slate-700 text-xs sm:text-sm text-right whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map(log => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">
                                                    {log.ambulance_plate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {Array.isArray(log.patients) && log.patients.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {log.patients.map((p) => (
                                                            <div key={p.id} className="text-xs text-slate-700">
                                                                {p.patient_name}{' '}
                                                                <span className="text-slate-400">
                                                                    ({p.registration_number})
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 font-medium">
                                                {Array.isArray(log.patients) && log.patients.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {log.patients.map((p) => (
                                                            <div key={p.id} className="text-xs text-slate-700">
                                                                {p.destination || '-'}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span>{log.destination || '-'}</span>
                                                )}
                                            </td>
                                            {/* Dokumentasi column */}
                                            <td className="px-6 py-4">
                                                {Array.isArray(log.patients) && log.patients.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {log.patients.map((p) => (
                                                            <div key={p.id} className="text-xs">
                                                                {p.document_path ? (
                                                                    <a
                                                                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3331'}/uploads/${p.document_path}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-emerald-600 hover:text-emerald-800 underline truncate max-w-[120px] block"
                                                                    >
                                                                        📄 {p.patient_name}
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="text-slate-800 font-medium">
                                                    Berangkat:{' '}
                                                    {new Date(log.departure_time).toLocaleString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    Kembali:{' '}
                                                    {log.return_time
                                                        ? new Date(
                                                              log.return_time
                                                          ).toLocaleString('id-ID', {
                                                              day: 'numeric',
                                                              month: 'short',
                                                              year: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit'
                                                          })
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                        log.status === 'In-Journey'
                                                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    }`}
                                                >
                                                    {log.status === 'In-Journey'
                                                        ? 'Dalam Perjalanan'
                                                        : 'Selesai'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {log.status === 'In-Journey' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs h-8"
                                                        onClick={() => openCompleteModal(log.id)}
                                                    >
                                                        Selesaikan Trip
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
