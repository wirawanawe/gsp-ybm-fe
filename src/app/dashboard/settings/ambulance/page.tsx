'use client';

import { useEffect, useState } from 'react';
import { Ambulance, PlusCircle, Edit2, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl, authFetch } from '@/lib/api';
import Link from 'next/link';

type AmbulanceType = {
    id: number;
    plate_number: string;
    vehicle_model: string;
    status: 'Available' | 'In-Journey' | 'Maintenance';
};

export default function AmbulanceSettingsPage() {
    const [ambulances, setAmbulances] = useState<AmbulanceType[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeModal, setActiveModal] = useState<
        null | { mode: 'create' | 'edit'; id?: number }
    >(null);

    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [ambulanceForm, setAmbulanceForm] = useState({
        plate_number: '',
        vehicle_model: '',
        status: 'Available'
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/ambulance'));
            const data = await res.json();
            setAmbulances(data);
        } catch (err) {
            console.error('load ambulance data error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openCreateModal = () => {
        setFormError('');
        setIsSubmitting(false);
        setAmbulanceForm({ plate_number: '', vehicle_model: '', status: 'Available' });
        setActiveModal({ mode: 'create' });
    };

    const openEditModal = (id: number) => {
        setFormError('');
        setIsSubmitting(false);
        const item = ambulances.find(a => a.id === id);
        if (!item) return;
        setAmbulanceForm({
            plate_number: item.plate_number,
            vehicle_model: item.vehicle_model,
            status: item.status
        });
        setActiveModal({ mode: 'edit', id });
    };

    const closeModal = () => {
        setActiveModal(null);
        setFormError('');
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus data ini?')) return;
        try {
            const url = apiUrl(`/api/ambulance/${id}`);
            const res = await authFetch(url, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal menghapus');
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus data');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeModal) return;
        setIsSubmitting(true);
        setFormError('');

        try {
            const url =
                apiUrl('/api/ambulance') +
                (activeModal.mode === 'edit' ? `/${activeModal.id}` : '');
            const method = activeModal.mode === 'create' ? 'POST' : 'PUT';

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ambulanceForm)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal menyimpan data');
            }

            closeModal();
            loadData();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-[calc(100vh-8rem)] relative">
            {activeModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {activeModal.mode === 'create' ? 'Tambah' : 'Edit'} Ambulans
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 rounded-md bg-rose-50 text-rose-700 text-sm border border-rose-200">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Nomor Polisi
                                    </label>
                                    <Input
                                        value={ambulanceForm.plate_number}
                                        onChange={e =>
                                            setAmbulanceForm(prev => ({
                                                ...prev,
                                                plate_number: e.target.value
                                            }))
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Model Kendaraan
                                    </label>
                                    <Input
                                        value={ambulanceForm.vehicle_model}
                                        onChange={e =>
                                            setAmbulanceForm(prev => ({
                                                ...prev,
                                                vehicle_model: e.target.value
                                            }))
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Status
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm"
                                        value={ambulanceForm.status}
                                        onChange={e =>
                                            setAmbulanceForm(prev => ({
                                                ...prev,
                                                status: e.target.value as AmbulanceType['status']
                                            }))
                                        }
                                    >
                                        <option value="Available">Available</option>
                                        <option value="In-Journey">In-Journey</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 shrink-0">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-2 transition-colors">
                        <Link href="/dashboard/settings" className="flex items-center gap-1">
                            <ArrowLeft size={16} /> Kembali ke Master Data
                        </Link>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 truncate">
                        <Ambulance className="text-emerald-600 shrink-0" />
                        Master Ambulans
                    </h1>
                </div>
                {loading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="animate-spin" size={14} /> Memuat data...
                    </div>
                )}
            </div>
            
            <div className="mb-4">
                <Button
                    className="bg-slate-900 hover:bg-slate-800 text-sm"
                    onClick={openCreateModal}
                >
                    <PlusCircle size={16} className="mr-2" />
                    Tambah Ambulans
                </Button>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 font-semibold text-slate-700">No. Polisi</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Status</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ambulances.map(a => (
                                    <tr key={a.id}>
                                        <td className="px-4 py-2 text-slate-800">
                                            <div className="font-medium">{a.plate_number}</div>
                                            <div className="text-[11px] text-slate-500">
                                                {a.vehicle_model}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span
                                                className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${a.status === 'Available'
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    : a.status === 'In-Journey'
                                                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}
                                            >
                                                {a.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600"
                                                onClick={() => openEditModal(a.id)}
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600"
                                                onClick={() => handleDelete(a.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {ambulances.length === 0 && !loading && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-4 py-4 text-xs text-slate-500 text-center"
                                        >
                                            Belum ada data ambulans.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
