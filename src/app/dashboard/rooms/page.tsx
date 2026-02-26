'use client';

import { useState, useEffect } from 'react';
import { BedDouble, CheckCircle, Info, UserPlus, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/api';

export default function RoomsPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBed, setSelectedBed] = useState<any>(null);
    const [formData, setFormData] = useState({
        patient_id: '', companion_name: '', companion_nik: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [activeVisitor, setActiveVisitor] = useState<any | null>(null);
    const [checkoutBed, setCheckoutBed] = useState<any | null>(null);
    const [checkoutFinalStatus, setCheckoutFinalStatus] = useState<string>('Sembuh');

    const fetchRooms = async () => {
        try {
            const res = await fetch(apiUrl('/api/rooms'));
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
            const res = await fetch(apiUrl('/api/patients/applicants?exclude_occupied=1'));
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];

            // Saring: jangan tampilkan pasien yang status rumah singgah-nya sudah pulang
            // atau sudah memiliki tanggal checkout.
            const filtered = list.filter((p: any) => {
                const status = (p.status_rumah_singgah || '').toString();
                const checkOut = p.check_out_date;
                return status !== 'Sudah Pulang' && !checkOut;
            });

            setPatients(filtered);
        } catch (err) {
            console.error(err);
            setPatients([]);
        }
    };

    const fetchVisitorForPatient = async (patientId: string) => {
        if (!patientId) {
            setActiveVisitor(null);
            setFormData(prev => ({ ...prev, companion_name: '', companion_nik: '' }));
            return;
        }
        try {
            const res = await fetch(apiUrl(`/api/visitors?patient_id=${patientId}`));
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const active = data.find((v: any) => v.is_active) || data[0];
                setActiveVisitor(active);
                setFormData(prev => ({
                    ...prev,
                    companion_name: active.name || '',
                    companion_nik: active.nik || ''
                }));
            } else {
                setActiveVisitor(null);
                setFormData(prev => ({ ...prev, companion_name: '', companion_nik: '' }));
            }
        } catch (err) {
            console.error('fetchVisitorForPatient error:', err);
            setActiveVisitor(null);
        }
    };

    useEffect(() => {
        fetchRooms();
        fetchPatients();
    }, []);

    // Reset form & data penunggu saat modal dibuka/ditutup
    useEffect(() => {
        setFormData({ patient_id: '', companion_name: '', companion_nik: '' });
        setActiveVisitor(null);
    }, [selectedBed]);

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBed || !formData.patient_id) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(apiUrl('/api/rooms/check-in'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bed_id: selectedBed.id,
                    patient_id: formData.patient_id,
                    companion_name: formData.companion_name,
                    companion_nik: formData.companion_nik
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

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkoutBed) return;

        try {
            const res = await fetch(apiUrl('/api/rooms/check-out'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bed_id: checkoutBed.id,
                    final_status: checkoutFinalStatus
                })
            });

            if (res.ok) {
                alert('Checkout Berhasil!');
                setCheckoutBed(null);
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Pasien Terverifikasi</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={formData.patient_id}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({ ...formData, patient_id: value });
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

                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-6">
                                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                                    <Info size={16} /> Data Penunggu
                                </h3>
                                {activeVisitor ? (
                                    <div className="space-y-1 text-sm text-slate-700">
                                        <p><span className="font-medium">Nama:</span> {activeVisitor.name}</p>
                                        <p><span className="font-medium">NIK:</span> {activeVisitor.nik}</p>
                                        <p><span className="font-medium">Relasi:</span> {activeVisitor.relation}</p>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Data ini diambil otomatis dari <strong>Registrasi Penunggu</strong>.
                                            Jika penunggu perlu diubah, silakan ubah di menu Data Penunggu terlebih dahulu.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600">
                                        Belum ada penunggu yang terdaftar untuk pasien ini. Tambahkan penunggu di menu <strong>Data Penunggu</strong> bila diperlukan.
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

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manajemen Kamar & Denah</h1>
                    <p className="text-slate-600 text-sm mt-1">Visualisasi ketersediaan Bed dan proses Check-in Pasien.</p>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4 text-sm font-medium shrink-0">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500"></div> Tersedia</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-rose-500"></div> Terisi</div>
                </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
                {rooms.map((room) => {
                    const beds = Array.isArray(room.beds) ? room.beds : [];
                    return (
                    <div key={room.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 sm:gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BedDouble size={20} className="text-slate-500 shrink-0" />
                                Kamar {room.room_number}
                            </h2>
                            <span className="text-sm text-slate-500 font-medium">
                                {beds.filter((b: any) => b.is_available).length} Bed Kosong
                            </span>
                        </div>

                        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {beds.length === 0 ? (
                                <p className="col-span-full text-sm text-slate-500 py-4">
                                    Belum ada bed di kamar ini. Tambah kamar baru dari Setting (dengan kapasitas bed) agar bed dan tombol Check-in muncul.
                                </p>
                            ) : null}
                            {beds.map((bed: any) => (
                                <div
                                    key={bed.id}
                                    className={`relative p-5 rounded-xl border-2 transition-all ${bed.is_available
                                        ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-400'
                                        : 'border-rose-200 bg-rose-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="font-bold text-xl text-slate-800">{bed.bed_number}</div>
                                        <div className={`p-1.5 rounded-full ${bed.is_available ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'}`}>
                                            {bed.is_available ? <CheckCircle size={16} /> : <Info size={16} />}
                                        </div>
                                    </div>

                                    {bed.is_available ? (
                                        <div>
                                            <div className="text-emerald-700 font-medium text-sm mb-4">Bed Tersedia</div>
                                            <Button
                                                className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                                                size="sm"
                                                onClick={() => setSelectedBed(bed)}
                                            >
                                                Check-in Pasien
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-rose-700 font-medium text-sm mb-1">Terisi oleh:</div>
                                            <div className="text-slate-800 font-semibold truncate mb-1" title={bed.patient_name}>
                                                {bed.patient_name || 'Pasien Aktif'}
                                            </div>
                                            {bed.patient_registration_number && (
                                                <div className="text-[11px] text-slate-500 mb-1">
                                                    Reg: {bed.patient_registration_number}
                                                </div>
                                            )}
                                            {bed.check_in_date && (
                                                <div className="text-[11px] text-slate-500 mb-3">
                                                    Masuk: {new Date(bed.check_in_date).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="w-full border-rose-200 text-rose-700 hover:bg-rose-100"
                                                size="sm"
                                                onClick={() => {
                                                    setCheckoutBed(bed);
                                                    setCheckoutFinalStatus('Sembuh');
                                                }}
                                            >
                                                Check Out / Pulang
                                            </Button>
                                        </div>
                                    )}
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
