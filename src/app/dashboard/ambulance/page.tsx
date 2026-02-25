'use client';

import { useState } from 'react';
import { Search, Plus, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AmbulancePage() {
    const [logs] = useState([
        { id: 1, ambulance: 'B 1234 GSP', destination: 'RSUD Cengkareng', driver: 'Pak Suparmin', status: 'In-Journey', departure_time: '10:00 WIB', return_time: '-' },
        { id: 2, ambulance: 'B 5678 YBM', destination: 'RSCM Jakarta', driver: 'Pak Agung', status: 'Completed', departure_time: '08:00 WIB', return_time: '11:30 WIB' },
    ]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Logistik & Jadwal Ambulans</h1>
                    <p className="text-slate-600">Booking perjalanan ambulans untuk rujukan pasien.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md shadow-emerald-200">
                    <Plus size={18} className="mr-2" />
                    Booking Ambulans Baru
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-50 border border-emerald-200 rounded-xl p-6 lg:col-span-1 shadow-sm flex flex-col items-center text-center">
                    <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                        <Navigation size={28} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">Armada Aktif</h3>
                    <p className="text-3xl font-black text-emerald-600 mb-2">2</p>
                    <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Tersedia: 1</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden lg:col-span-3 flex-1 flex flex-col">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800">Log Perjalanan Hari Ini</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input placeholder="Cari..." className="pl-9 h-9 border-slate-200" />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left bg-white">
                            <thead className="bg-white border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Ambulans</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Tujuan</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Jam Berangkat</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Status</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{log.ambulance}</div>
                                            <div className="text-xs text-slate-500 mt-1">{log.driver}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">{log.destination}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-800 font-medium">{log.departure_time}</div>
                                            <div className="text-xs text-slate-500 mt-1">Kembali: {log.return_time}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${log.status === 'In-Journey' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                }`}>
                                                {log.status === 'In-Journey' ? 'Dalam Perjalanan' : 'Selesai'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {log.status === 'In-Journey' && (
                                                <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs h-8">
                                                    Selesaikan Trip
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
