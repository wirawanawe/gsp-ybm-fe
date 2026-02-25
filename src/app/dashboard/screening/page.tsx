'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, FileText, Eye, UserX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ScreeningPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/patients?status=Pending');
            const data = await res.json();
            setPatients(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const openPatientDetails = async (patient: any) => {
        setSelectedPatient(patient);
        setDocsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/patients/${patient.id}/documents`);
            const docs = await res.json();
            setDocuments(docs);
        } catch (err) {
            console.error(err);
        } finally {
            setDocsLoading(false);
        }
    };

    const handleVerification = async (status: string) => {
        if (!selectedPatient) return;

        try {
            const res = await fetch(`http://localhost:5000/api/patients/${selectedPatient.id}/verify`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_verification: status })
            });

            if (res.ok) {
                setSelectedPatient(null);
                fetchPatients(); // Reload list
            }
        } catch (err) {
            console.error('Verify error:', err);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">

            {/* View Details Modal Overlay - Simplistic implementation */}
            {selectedPatient && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-emerald-600" />
                                Verifikasi Berkas Pasien
                            </h2>
                            <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-700">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Biodata Sidebar */}
                                <div className="md:col-span-1 space-y-6">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Biodata Pribadi</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-xs text-slate-500">Nama Lengkap</div>
                                                <div className="font-semibold text-slate-800">{selectedPatient.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500">NIK</div>
                                                <div className="font-medium text-slate-800">{selectedPatient.nik}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500">No. Registrasi</div>
                                                <div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 inline-block rounded border border-emerald-100 mt-1">{selectedPatient.registration_number}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500">Telepon</div>
                                                <div className="text-slate-800">{selectedPatient.phone}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500">Alamat</div>
                                                <div className="text-sm text-slate-800 leading-relaxed">{selectedPatient.address}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Grid */}
                                <div className="md:col-span-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Berkas Persyaratan</h3>

                                    {docsLoading ? (
                                        <div className="flex justify-center items-center h-40">
                                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {documents.length === 0 ? (
                                                <div className="col-span-2 text-center text-slate-500 py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                                    Tidak ada berkas yang diunggah.
                                                </div>
                                            ) : (
                                                documents.map(doc => (
                                                    <div key={doc.id} className="border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-emerald-300 transition-colors group">
                                                        <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-slate-700 text-sm truncate">{doc.document_type}</div>
                                                            <a
                                                                href={`http://localhost:5000/${doc.file_path}`}
                                                                target="_blank"
                                                                className="text-xs text-emerald-600 font-medium hover:underline flex items-center mt-1"
                                                            >
                                                                Lihat Berkas <Eye size={12} className="ml-1" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-medium h-11 px-6"
                                onClick={() => handleVerification('Rujukan Lain')}
                            >
                                Rujukan Lain (Tolak)
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 font-semibold h-11 px-8"
                                onClick={() => handleVerification('Layak Mustahik')}
                            >
                                <CheckCircle size={18} className="mr-2" />
                                Layak Mustahik (Pre-Approve)
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Page Layout */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Verifikasi Pasien Masuk</h1>
                        <p className="text-slate-600 mt-1">
                            Daftar pasien baru yang mendaftar online dan menunggu persetujuan (Pre-Approved).
                        </p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input placeholder="Cari by NIK / Nama..." className="pl-9 h-10 border-slate-200 bg-slate-50 focus:bg-white" />
                    </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-y-auto flex-1 bg-slate-50/30">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-emerald-600">
                                <Loader2 className="animate-spin mb-4" size={32} />
                                <p className="font-medium text-slate-500">Memuat data...</p>
                            </div>
                        ) : patients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <div className="bg-slate-100 p-4 rounded-full mb-4">
                                    <UserX size={32} className="text-slate-500" />
                                </div>
                                <p className="font-medium text-slate-600">Belum ada pasien yang perlu diverifikasi.</p>
                                <p className="text-sm mt-1 text-slate-500">Pasien yang baru mendaftar akan muncul di sini.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left bg-white">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">No. Pendaftaran</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Nama Pasien / NIK</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Tanggal Daftar</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status Awal</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {patients.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold text-slate-600">{p.registration_number}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{p.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{p.nik}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                                                    {p.status_verification}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    onClick={() => openPatientDetails(p)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-sm"
                                                >
                                                    <Eye size={16} className="mr-2" /> Cek Berkas
                                                </Button>
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
