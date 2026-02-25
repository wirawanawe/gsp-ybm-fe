'use client';

import { useState, useEffect } from 'react';
import { BedDouble, CheckCircle, Info, UserPlus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoomsPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBed, setSelectedBed] = useState<any>(null);
    const [formData, setFormData] = useState({
        patient_id: '', companion_name: '', companion_nik: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);

    const fetchRooms = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/rooms');
            const data = await res.json();
            setRooms(data);
        } catch (err) {
            console.error('Fetch rooms err:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            // Get patients who are "Pre-Approved" / Layak Mustahik
            const res = await fetch('http://localhost:5000/api/patients?status=Layak Mustahik');
            const data = await res.json();
            setPatients(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRooms();
        fetchPatients();
    }, []);

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBed || !formData.patient_id) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/rooms/checkin', {
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
                setSelectedBed(null);
                setFormData({ patient_id: '', companion_name: '', companion_nik: '' });
                fetchRooms(); // Refresh room data
                fetchPatients(); // Refresh patient dropdown
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

    const handleCheckout = async (bedId: number) => {
        if (!confirm('Keluarkan pasien dari kamar ini?')) return;

        try {
            const res = await fetch('http://localhost:5000/api/rooms/check-out', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bed_id: bedId,
                    final_status: 'Sembuh' // Default Sembuh for now
                })
            });

            if (res.ok) {
                alert('Checkout Berhasil!');
                fetchRooms();
                fetchPatients(); // Repull active available patients if any logic changes
            } else {
                const data = await res.json();
                alert(`Gagal: ${data.message}`);
            }
        } catch (err) {
            console.error('Checkout err:', err);
            alert('Kesalahan jaringan');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative h-[calc(100vh-8rem)]">

            {/* Modal Check-In */}
            {selectedBed && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <UserPlus className="text-emerald-600" />
                                Check-in Pasien (Bed {selectedBed.bed_number})
                            </h2>
                            <button onClick={() => setSelectedBed(null)} className="text-slate-400 hover:text-slate-700">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCheckIn} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Pasien Terverifikasi</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={formData.patient_id}
                                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- Pilih Pasien --</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Reg: {p.registration_number})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-6">
                                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                                    <Info size={16} /> Data Penunggu (Opsional)
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Nama Penunggu</label>
                                        <input
                                            type="text"
                                            className="w-full h-9 px-3 text-sm rounded-md border border-slate-200 focus:border-emerald-500 outline-none"
                                            value={formData.companion_name}
                                            onChange={(e) => setFormData({ ...formData, companion_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">NIK Penunggu</label>
                                        <input
                                            type="text"
                                            className="w-full h-9 px-3 text-sm rounded-md border border-slate-200 focus:border-emerald-500 outline-none"
                                            value={formData.companion_nik}
                                            onChange={(e) => setFormData({ ...formData, companion_nik: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                                <Button type="button" variant="outline" onClick={() => setSelectedBed(null)}>Batal</Button>
                                <Button type="submit" disabled={isSubmitting || !formData.patient_id} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmitting ? 'Menyimpan...' : 'Proses Check-in'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen Kamar & Denah</h1>
                    <p className="text-slate-600">Visualisasi ketersediaan Bed dan proses Check-in Pasien.</p>
                </div>
                <div className="flex gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500"></div> Tersedia</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-rose-500"></div> Terisi</div>
                </div>
            </div>

            <div className="space-y-8">
                {rooms.map((room) => (
                    <div key={room.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BedDouble size={20} className="text-slate-500" />
                                Kamar {room.room_number}
                            </h2>
                            <span className="text-sm text-slate-500 font-medium">
                                {room.beds.filter((b: any) => b.is_available).length} Bed Kosong
                            </span>
                        </div>

                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {room.beds.map((bed: any) => (
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
                                            <div className="text-slate-800 font-semibold truncate mb-4" title={bed.patient_name}>{bed.patient_name || 'Pasien Aktif'}</div>
                                            <Button
                                                variant="outline"
                                                className="w-full border-rose-200 text-rose-700 hover:bg-rose-100"
                                                size="sm"
                                                onClick={() => handleCheckout(bed.id)}
                                            >
                                                Check Out / Pulang
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
