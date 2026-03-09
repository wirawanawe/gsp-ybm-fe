'use client';

import { useState, useEffect } from 'react';
import { BedDouble, CheckCircle, Info, UserPlus, XCircle, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiUrl, authFetch } from '@/lib/api';

export default function RoomsPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBed, setSelectedBed] = useState<any>(null);
    const [formData, setFormData] = useState({
        patient_id: '',
        visitor_id: '',
        companion_name: '',
        companion_nik: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [activeVisitor, setActiveVisitor] = useState<any | null>(null);
    const [checkoutBed, setCheckoutBed] = useState<any | null>(null);
    const [checkoutFinalStatus, setCheckoutFinalStatus] = useState<string>('Sembuh');
    const [checkoutPhoto, setCheckoutPhoto] = useState<File | null>(null);
    const [checkInDate, setCheckInDate] = useState<string>('');
    const [checkOutDate, setCheckOutDate] = useState<string>('');
    const [transferBed, setTransferBed] = useState<any | null>(null);
    const [transferTargetBedId, setTransferTargetBedId] = useState<string>('');
    const [transferReason, setTransferReason] = useState<string>('');
    const [addPenungguBed, setAddPenungguBed] = useState<any | null>(null);
    const [addPenungguVisitorId, setAddPenungguVisitorId] = useState<string>('');
    const [addPenungguVisitors, setAddPenungguVisitors] = useState<any[]>([]);
    const [addPenungguSubmitting, setAddPenungguSubmitting] = useState(false);

    const fetchRooms = async () => {
        try {
            const res = await authFetch(apiUrl('/api/rooms'));
            const data = await res.json();
            setRooms(data);
        } catch (err) {
            console.error('Fetch rooms err:', err);
        } finally {
            setLoading(false);
        }
    };

    // Check-in hanya menampilkan Data Pendaftar (yang boleh masuk rumah singgah), bukan data terverifikasi terpisah
    const fetchPatients = async () => {
        try {
            const res = await authFetch(apiUrl('/api/patients/applicants?exclude_occupied=1'));
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];

            // Hanya tampilkan data pendaftar dengan status Menunggu (siap check-in)
            const filtered = list.filter((p: any) => (p.status_rumah_singgah || '').toString() === 'Menunggu');

            setPatients(filtered);
        } catch (err) {
            console.error(err);
            setPatients([]);
        }
    };

    const [visitorsForPatient, setVisitorsForPatient] = useState<any[]>([]);

    const openAddPenunggu = async (bed: any) => {
        if (!bed?.stay_log_id || !bed?.stay_patient_id) return;
        setAddPenungguBed(bed);
        setAddPenungguVisitorId('');
        try {
            const res = await authFetch(apiUrl(`/api/visitors?patient_id=${bed.stay_patient_id}`));
            const data = await res.json();
            const allVisitors = Array.isArray(data) ? data : [];
            const alreadyIds = new Set((bed.stay_visitors || []).map((v: any) => String(v.id)));
            const available = allVisitors.filter((v: any) => !alreadyIds.has(String(v.id)));
            setAddPenungguVisitors(available);
        } catch (err) {
            console.error('fetch visitors for add penunggu:', err);
            setAddPenungguVisitors([]);
        }
    };

    const handleAddPenunggu = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addPenungguBed?.stay_log_id || !addPenungguVisitorId) return;
        setAddPenungguSubmitting(true);
        try {
            const res = await authFetch(apiUrl(`/api/rooms/stay/${addPenungguBed.stay_log_id}/visitors`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitor_id: addPenungguVisitorId })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Penunggu berhasil ditambahkan.');
                setAddPenungguBed(null);
                setAddPenungguVisitorId('');
                fetchRooms();
            } else {
                alert(data.message || 'Gagal menambah penunggu');
            }
        } catch (err) {
            console.error('addPenunggu err:', err);
            alert('Kesalahan jaringan');
        } finally {
            setAddPenungguSubmitting(false);
        }
    };

    const fetchVisitorForPatient = async (patientId: string) => {
        if (!patientId) {
            setActiveVisitor(null);
            setVisitorsForPatient([]);
            setFormData(prev => ({ ...prev, visitor_id: '', companion_name: '', companion_nik: '' }));
            return;
        }
        try {
            const res = await authFetch(apiUrl(`/api/visitors?patient_id=${patientId}`));
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setVisitorsForPatient(list);
            if (list.length > 0) {
                const active = list.find((v: any) => v.is_active) || list[0];
                setActiveVisitor(active);
                setFormData(prev => ({
                    ...prev,
                    visitor_id: String(active.id),
                    companion_name: active.name || '',
                    companion_nik: active.nik || ''
                }));
            } else {
                setActiveVisitor(null);
                setFormData(prev => ({ ...prev, visitor_id: '', companion_name: '', companion_nik: '' }));
            }
        } catch (err) {
            console.error('fetchVisitorForPatient error:', err);
            setActiveVisitor(null);
            setVisitorsForPatient([]);
        }
    };

    useEffect(() => {
        fetchRooms();
        fetchPatients();
    }, []);

    // Reset form & data penunggu saat modal dibuka/ditutup
    useEffect(() => {
        setFormData({ patient_id: '', visitor_id: '', companion_name: '', companion_nik: '' });
        setActiveVisitor(null);
        setVisitorsForPatient([]);
    }, [selectedBed]);

    const getNowLocal = () => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBed || !formData.patient_id) return;

        setIsSubmitting(true);
        try {
            const res = await authFetch(apiUrl('/api/rooms/check-in'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bed_id: selectedBed.id,
                    patient_id: formData.patient_id,
                    visitor_id: formData.visitor_id || null,
                    companion_name: formData.companion_name,
                    companion_nik: formData.companion_nik,
                    check_in_date: checkInDate || undefined
                })
            });

            if (res.ok) {
                alert('Check-in Berhasil!');
                window.location.reload();
            } else {
                const data = await res.json();
                alert(`Gagal: ${data.message}`);
            }
        } catch (err) {
            console.error('Checkin err:', err);
            alert('Kesalahan jaringan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferBed || !transferTargetBedId) return;
        try {
            const res = await authFetch(apiUrl('/api/rooms/transfer'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_bed_id: transferBed.id,
                    to_bed_id: transferTargetBedId,
                    reason: transferReason
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Pindah kamar berhasil!');
                setTransferBed(null);
                setTransferTargetBedId('');
                setTransferReason('');
                window.location.reload();
            } else {
                alert(`Gagal: ${data.message}`);
            }
        } catch (err) {
            console.error('Transfer err:', err);
            alert('Kesalahan jaringan');
        }
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkoutBed) return;

        try {
            const fd = new FormData();
            fd.append('bed_id', String(checkoutBed.id));
            fd.append('final_status', checkoutFinalStatus);
            if (checkoutPhoto) {
                fd.append('departure_photo', checkoutPhoto);
            }
            if (checkOutDate) {
                fd.append('check_out_date', checkOutDate);
            }

            const res = await authFetch(apiUrl('/api/rooms/check-out'), {
                method: 'PUT',
                body: fd
            });

            if (res.ok) {
                alert('Checkout Berhasil!');
                setCheckoutBed(null);
                setCheckoutPhoto(null);
                setCheckOutDate('');
                window.location.reload();
            } else {
                const data = await res.json();
                alert(`Gagal: ${data.message}`);
            }
        } catch (err) {
            console.error('Checkout err:', err);
            alert('Kesalahan jaringan');
        }
    };

    const FINAL_STATUS_OPTIONS = [
        { value: 'Sembuh', label: 'Sembuh / Pulang' },
        { value: 'Rujukan Lanjut', label: 'Rujuk ke Rumah Sakit' },
        { value: 'Meninggal', label: 'Meninggal' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 relative min-h-[calc(100vh-8rem)]">

            {/* Modal Pindah Kamar */}
            {transferBed && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 overflow-y-auto">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate pr-2 flex items-center gap-2">
                                <ArrowRightLeft className="text-emerald-600" />
                                Pindah Kamar
                            </h2>
                            <button onClick={() => { setTransferBed(null); setTransferTargetBedId(''); setTransferReason(''); }} className="text-slate-400 hover:text-slate-700 shrink-0 p-1">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleTransfer} className="p-4 sm:p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Pasien: <strong>{transferBed.patient_name}</strong> (Bed {transferBed.bed_number})
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Kamar tujuan</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={transferTargetBedId}
                                    onChange={e => setTransferTargetBedId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih Bed Tujuan --</option>
                                    {rooms.flatMap((r: any) => (r.beds || [])
                                        .filter((b: any) => b.is_available && b.id !== transferBed.id)
                                        .map((b: any) => (
                                            <option key={b.id} value={b.id}>
                                                Kamar {r.room_number} - Bed {b.bed_number}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Alasan pindah</label>
                                <textarea
                                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={transferReason}
                                    onChange={e => setTransferReason(e.target.value)}
                                    placeholder="Masukkan alasan pindah kamar..."
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={() => setTransferBed(null)}>
                                    Batal
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                                    Proses Pindah
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Check-Out / Pulang - Responsive */}
            {checkoutBed && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 overflow-y-auto">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate pr-2">Check Out / Pulang</h2>
                            <button onClick={() => setCheckoutBed(null)} className="text-slate-400 hover:text-slate-700 shrink-0 p-1">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCheckout} className="p-4 sm:p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Pasien: <strong>{checkoutBed.patient_name}</strong> (Bed {checkoutBed.bed_number})
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal &amp; Jam Keluar</label>
                                <input
                                    type="datetime-local"
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={checkOutDate}
                                    onChange={e => setCheckOutDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Status Keluar</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={checkoutFinalStatus}
                                    onChange={e => setCheckoutFinalStatus(e.target.value)}
                                    required
                                >
                                    {FINAL_STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Upload Dokumen Kepulangan (foto)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-medium"
                                    onChange={e => setCheckoutPhoto(e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Opsional, unggah foto dokumentasi saat pasien pulang.
                                </p>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={() => setCheckoutBed(null)}>
                                    Batal
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                                    Proses Checkout
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah Penunggu */}
            {addPenungguBed && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">Tambah Penunggu</h2>
                            <button onClick={() => { setAddPenungguBed(null); setAddPenungguVisitorId(''); }} className="text-slate-400 hover:text-slate-700 p-1">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddPenunggu} className="p-4 sm:p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Pasien: <strong>{addPenungguBed.patient_name}</strong> (Bed {addPenungguBed.bed_number})
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Penunggu</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={addPenungguVisitorId}
                                    onChange={e => setAddPenungguVisitorId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih penunggu --</option>
                                    {addPenungguVisitors.map((v: any) => (
                                        <option key={v.id} value={v.id}>{v.name} ({v.relation})</option>
                                    ))}
                                </select>
                                {addPenungguVisitors.length === 0 && (
                                    <p className="text-xs text-slate-500 mt-1">Semua penunggu pasien ini sudah ditambahkan, atau belum ada data penunggu.</p>
                                )}
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={() => setAddPenungguBed(null)}>Batal</Button>
                                <Button type="submit" disabled={addPenungguSubmitting || !addPenungguVisitorId || addPenungguVisitors.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                                    {addPenungguSubmitting ? 'Menyimpan...' : 'Tambah'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Check-In - Responsive */}
            {selectedBed && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 truncate pr-2">
                                <UserPlus className="text-emerald-600" />
                                Check-in Pasien (Bed {selectedBed.bed_number})
                            </h2>
                            <button onClick={() => setSelectedBed(null)} className="text-slate-400 hover:text-slate-700">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCheckIn} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal &amp; Jam Masuk</label>
                                <input
                                    type="datetime-local"
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    value={checkInDate}
                                    onChange={e => setCheckInDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Pasien</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={formData.patient_id}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({ ...formData, patient_id: value, visitor_id: '' });
                                        fetchVisitorForPatient(value);
                                    }}
                                    required
                                >
                                    <option value="">-- Pilih Pasien --</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Reg: {p.registration_number})</option>
                                    ))}
                                </select>
                                {patients.length === 0 && (
                                    <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                        Belum ada pasien dengan status &quot;Layak Mustahik&quot;. Verifikasi pasien terlebih dahulu di menu <strong>Verifikasi Pasien</strong>.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Penunggu</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={formData.visitor_id}
                                    onChange={(e) => {
                                        const vid = e.target.value;
                                        const v = visitorsForPatient.find((x: any) => String(x.id) === vid);
                                        setFormData(prev => ({
                                            ...prev,
                                            visitor_id: vid,
                                            companion_name: v?.name || '',
                                            companion_nik: v?.nik || ''
                                        }));
                                        setActiveVisitor(v || null);
                                    }}
                                >
                                    <option value="">-- Tidak ada penunggu --</option>
                                    {visitorsForPatient.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} ({v.relation}){v.is_active ? ' - Aktif' : ' - Terdaftar sebelumnya'}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    Menampilkan semua data penunggu yang pernah terdaftar untuk pasien ini (termasuk dari rawat sebelumnya).
                                </p>
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                                    <Info size={16} /> Data Penunggu
                                </h3>
                                {activeVisitor ? (
                                    <div className="space-y-1 text-sm text-slate-700">
                                        <p><span className="font-medium">Nama:</span> {activeVisitor.name}</p>
                                        <p><span className="font-medium">NIK:</span> {activeVisitor.nik}</p>
                                        <p><span className="font-medium">Relasi:</span> {activeVisitor.relation}</p>
                                        {activeVisitor.phone && <p><span className="font-medium">No HP:</span> {activeVisitor.phone}</p>}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600">
                                        {formData.patient_id
                                            ? 'Belum ada penunggu terpilih. Pilih penunggu di atas atau daftarkan di menu Data Penunggu.'
                                            : 'Pilih pasien terlebih dahulu untuk melihat daftar penunggu.'}
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-slate-100 mt-6 shrink-0">
                                <Button type="button" variant="outline" onClick={() => setSelectedBed(null)} className="w-full sm:w-auto">Batal</Button>
                                <Button type="submit" disabled={isSubmitting || !formData.patient_id} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmitting ? 'Menyimpan...' : 'Proses Check-in'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manajemen Kamar & Denah</h1>
                    <p className="text-slate-600 text-sm mt-1">Visualisasi ketersediaan Bed dan proses Check-in Pasien.</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm font-medium shrink-0">
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></div>
                        <span className="text-emerald-700">Tersedia</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100">
                        <div className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200"></div>
                        <span className="text-rose-700">Terisi</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {rooms.map((room) => {
                    const beds = Array.isArray(room.beds) ? room.beds : [];
                    const availableCount = beds.filter((b: any) => b.is_available).length;
                    const occupiedCount = beds.length - availableCount;
                    return (
                        <div key={room.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 px-5 sm:px-6 py-4 border-b border-slate-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm">
                                            <BedDouble size={20} className="text-slate-600" />
                                        </div>
                                        <span>
                                            Kamar {room.room_number}
                                            {room.description && (
                                                <span className="font-normal text-slate-600 ml-2">— {room.description}</span>
                                            )}
                                        </span>
                                    </h2>
                                    <div className="flex gap-3 text-sm">
                                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
                                            {availableCount} Kosong
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-200 text-slate-600 font-medium">
                                            {occupiedCount} Terisi
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {beds.length === 0 ? (
                                    <p className="col-span-full text-sm text-slate-500 py-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                        Belum ada bed di kamar ini. Tambah kamar baru dari Setting (dengan kapasitas bed) agar bed dan tombol Check-in muncul.
                                    </p>
                                ) : null}
                                {beds.map((bed: any) => (
                                    <div
                                        key={bed.id}
                                        className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${bed.is_available
                                                ? 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white hover:border-emerald-400 hover:shadow-md'
                                                : 'border-rose-100 bg-gradient-to-b from-rose-50/80 to-white'
                                            }`}
                                    >
                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${bed.is_available ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                                                }`}>
                                                {bed.is_available ? <CheckCircle size={18} /> : <Info size={18} />}
                                            </span>
                                        </div>
                                        <div className="p-5 pt-4">
                                            <div className="text-3xl font-extrabold text-slate-800 mb-1">Bed {bed.bed_number}</div>
                                            <div className={`text-sm font-semibold mb-4 ${bed.is_available ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {bed.is_available ? 'Tersedia' : 'Terisi'}
                                            </div>

                                            {bed.is_available ? (
                                                <Button
                                                    className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl shadow-sm"
                                                    size="sm"
                                                    onClick={() => { setSelectedBed(bed); setCheckInDate(getNowLocal()); }}
                                                >
                                                    <UserPlus size={18} className="mr-2" />
                                                    Check-in Pasien
                                                </Button>
                                            ) : (
                                                <>
                                                    <div className="space-y-2 mb-4">
                                                        <div className="font-semibold text-slate-800 truncate" title={bed.patient_name}>
                                                            {bed.patient_name || 'Pasien Aktif'}
                                                        </div>
                                                        {bed.patient_registration_number && (
                                                            <div className="text-xs text-slate-500 font-mono">
                                                                {bed.patient_registration_number}
                                                            </div>
                                                        )}
                                                        {bed.check_in_date && (
                                                            <div className="text-xs text-slate-500">
                                                                Masuk: {new Date(bed.check_in_date).toLocaleString('id-ID', {
                                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </div>
                                                        )}
                                                        {(bed.stay_visitors?.length ?? 0) > 0 && (
                                                            <div className="text-xs text-slate-600 mt-1">
                                                                Penunggu: {(bed.stay_visitors as any[]).map((v: any) => v.name).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        {bed.stay_log_id && (
                                                            <Button
                                                                variant="outline"
                                                                className="w-full h-10 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-xl font-medium"
                                                                size="sm"
                                                                onClick={() => openAddPenunggu(bed)}
                                                            >
                                                                <UserPlus size={16} className="mr-2" />
                                                                Tambah Penunggu
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            className="w-full h-10 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 rounded-xl font-medium"
                                                            size="sm"
                                                            onClick={() => {
                                                                setTransferBed(bed);
                                                                setTransferTargetBedId('');
                                                                setTransferReason('');
                                                            }}
                                                        >
                                                            <ArrowRightLeft size={16} className="mr-2" />
                                                            Pindah Kamar
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full h-10 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 rounded-xl font-medium"
                                                            size="sm"
                                                            onClick={() => {
                                                                setCheckoutBed(bed);
                                                                setTransferBed(null);
                                                                setCheckoutFinalStatus('Sembuh');
                                                                setCheckOutDate(getNowLocal());
                                                            }}
                                                        >
                                                            Check Out / Pulang
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
