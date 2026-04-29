'use client';

import { useEffect, useState } from 'react';
import { BedSingle, PlusCircle, Edit2, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl, authFetch } from '@/lib/api';
import Link from 'next/link';

type RoomType = {
    id: number;
    room_number: string;
    floor: number;
    capacity: number;
    description: string | null;
};

export default function RoomSettingsPage() {
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeModal, setActiveModal] = useState<
        null | { mode: 'create' | 'edit'; id?: number }
    >(null);

    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [roomForm, setRoomForm] = useState({
        room_number: '',
        floor: 1,
        capacity: 1,
        description: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/rooms'));
            const data = await res.json();
            setRooms(data);
        } catch (err) {
            console.error('load room data error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const ensureRoomBeds = async (roomId: number, capacity: number) => {
        try {
            const roomRes = await authFetch(apiUrl(`/api/rooms/${roomId}`));
            const roomData = await roomRes.json();

            const beds = Array.isArray(roomData.beds) ? roomData.beds : [];
            if (beds.length > 0) return;

            const totalBeds = Math.max(1, capacity || 1);
            for (let i = 1; i <= totalBeds; i++) {
                await authFetch(apiUrl(`/api/rooms/${roomId}/beds`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bed_number: String(i),
                        bed_type: 'Standar'
                    })
                });
            }
        } catch (err) {
            console.error('ensureRoomBeds error:', err);
        }
    };

    const openCreateModal = () => {
        setFormError('');
        setIsSubmitting(false);
        setRoomForm({ room_number: '', floor: 1, capacity: 1, description: '' });
        setActiveModal({ mode: 'create' });
    };

    const openEditModal = (id: number) => {
        setFormError('');
        setIsSubmitting(false);
        const item = rooms.find(r => r.id === id);
        if (!item) return;
        setRoomForm({
            room_number: item.room_number,
            floor: item.floor,
            capacity: item.capacity,
            description: item.description || ''
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
            const url = apiUrl(`/api/rooms/${id}`);
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
                apiUrl('/api/rooms') +
                (activeModal.mode === 'edit' ? `/${activeModal.id}` : '');
            const method = activeModal.mode === 'create' ? 'POST' : 'PUT';

            let body = {
                ...roomForm,
                floor: Number(roomForm.floor),
                capacity: Number(roomForm.capacity)
            };

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal menyimpan data');
            }

            if (activeModal.mode === 'create') {
                const roomId = data.id as number | undefined;
                if (roomId) {
                    await ensureRoomBeds(roomId, body.capacity);
                }
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
                                {activeModal.mode === 'create' ? 'Tambah' : 'Edit'} Kamar
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
                                        Nomor Kamar
                                    </label>
                                    <Input
                                        value={roomForm.room_number}
                                        onChange={e =>
                                            setRoomForm(prev => ({
                                                ...prev,
                                                room_number: e.target.value
                                            }))
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Lantai
                                        </label>
                                        <Input
                                            type="number"
                                            value={roomForm.floor}
                                            onChange={e =>
                                                setRoomForm(prev => ({
                                                    ...prev,
                                                    floor: Number(e.target.value)
                                                }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Kapasitas Bed
                                        </label>
                                        <Input
                                            type="number"
                                            value={roomForm.capacity}
                                            onChange={e =>
                                                setRoomForm(prev => ({
                                                    ...prev,
                                                    capacity: Number(e.target.value)
                                                }))
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                                        value={roomForm.description}
                                        onChange={e =>
                                            setRoomForm(prev => ({
                                                ...prev,
                                                description: e.target.value
                                            }))
                                        }
                                    ></textarea>
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
                        <BedSingle className="text-amber-600 shrink-0" />
                        Master Kamar
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
                    Tambah Kamar
                </Button>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 font-semibold text-slate-700">No. Kamar</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Deskripsi Kamar</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Lantai / Kapasitas</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rooms.map(r => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-2 text-slate-800 font-medium">
                                            {r.room_number}
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 text-sm max-w-[200px]">
                                            {r.description || '—'}
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 text-xs">
                                            Lantai {r.floor} · {r.capacity} bed
                                        </td>
                                        <td className="px-4 py-2 text-right space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600"
                                                onClick={() => openEditModal(r.id)}
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600"
                                                onClick={() => handleDelete(r.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {rooms.length === 0 && !loading && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-4 text-xs text-slate-500 text-center"
                                        >
                                            Belum ada data kamar.
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
