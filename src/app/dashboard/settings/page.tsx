'use client';

import { useEffect, useState } from 'react';
import { Wrench, Ambulance, UserCog, BedSingle, PlusCircle, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl } from '@/lib/api';

type AmbulanceType = {
    id: number;
    plate_number: string;
    vehicle_model: string;
    status: 'Available' | 'In-Journey' | 'Maintenance';
};

type UserType = {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
};

type RoomType = {
    id: number;
    room_number: string;
    floor: number;
    capacity: number;
    description: string | null;
};

export default function SettingsPage() {
    const [ambulances, setAmbulances] = useState<AmbulanceType[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeModal, setActiveModal] = useState<
        null | { type: 'ambulance' | 'user' | 'room'; mode: 'create' | 'edit'; id?: number }
    >(null);

    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [ambulanceForm, setAmbulanceForm] = useState({
        plate_number: '',
        vehicle_model: '',
        status: 'Available'
    });

    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Admin YBM'
    });

    const [roomForm, setRoomForm] = useState({
        room_number: '',
        floor: 1,
        capacity: 1,
        description: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [ambRes, userRes, roomRes] = await Promise.all([
                fetch(apiUrl('/api/ambulance')),
                fetch(apiUrl('/api/users')),
                fetch(apiUrl('/api/rooms'))
            ]);

            const [ambData, userData, roomData] = await Promise.all([
                ambRes.json(),
                userRes.json(),
                roomRes.json()
            ]);

            setAmbulances(ambData);
            setUsers(userData);
            setRooms(roomData);
        } catch (err) {
            console.error('load settings data error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Pastikan kamar baru memiliki bed di database supaya muncul di Manajemen Kamar
    const ensureRoomBeds = async (roomId: number, capacity: number) => {
        try {
            const roomRes = await fetch(apiUrl(`/api/rooms/${roomId}`));
            const roomData = await roomRes.json();

            const beds = Array.isArray(roomData.beds) ? roomData.beds : [];
            if (beds.length > 0) {
                // Sudah ada bed, tidak perlu generate lagi
                return;
            }

            const totalBeds = Math.max(1, capacity || 1);
            for (let i = 1; i <= totalBeds; i++) {
                await fetch(apiUrl(`/api/rooms/${roomId}/beds`), {
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

    const openCreateModal = (type: 'ambulance' | 'user' | 'room') => {
        setFormError('');
        setIsSubmitting(false);
        if (type === 'ambulance') {
            setAmbulanceForm({ plate_number: '', vehicle_model: '', status: 'Available' });
        } else if (type === 'user') {
            setUserForm({ name: '', email: '', password: '', role: 'Admin YBM' });
        } else {
            setRoomForm({ room_number: '', floor: 1, capacity: 1, description: '' });
        }
        setActiveModal({ type, mode: 'create' });
    };

    const openEditModal = (type: 'ambulance' | 'user' | 'room', id: number) => {
        setFormError('');
        setIsSubmitting(false);
        if (type === 'ambulance') {
            const item = ambulances.find(a => a.id === id);
            if (!item) return;
            setAmbulanceForm({
                plate_number: item.plate_number,
                vehicle_model: item.vehicle_model,
                status: item.status
            });
        } else if (type === 'user') {
            const item = users.find(u => u.id === id);
            if (!item) return;
            setUserForm({
                name: item.name,
                email: item.email,
                password: '',
                role: item.role
            });
        } else {
            const item = rooms.find(r => r.id === id);
            if (!item) return;
            setRoomForm({
                room_number: item.room_number,
                floor: item.floor,
                capacity: item.capacity,
                description: item.description || ''
            });
        }
        setActiveModal({ type, mode: 'edit', id });
    };

    const closeModal = () => {
        setActiveModal(null);
        setFormError('');
    };

    const handleDelete = async (type: 'ambulance' | 'user' | 'room', id: number) => {
        if (!confirm('Yakin ingin menghapus data ini?')) return;
        try {
            let url = '';
            if (type === 'ambulance') url = apiUrl(`/api/ambulance/${id}`);
            if (type === 'user') url = apiUrl(`/api/users/${id}`);
            if (type === 'room') url = apiUrl(`/api/rooms/${id}`);

            const res = await fetch(url, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal menghapus');
            window.location.reload();
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
            let url = '';
            let method: 'POST' | 'PUT' = activeModal.mode === 'create' ? 'POST' : 'PUT';
            let body: any = {};

            if (activeModal.type === 'ambulance') {
                url =
                    apiUrl('/api/ambulance') +
                    (activeModal.mode === 'edit' ? `/${activeModal.id}` : '');
                body = ambulanceForm;
            } else if (activeModal.type === 'user') {
                url =
                    apiUrl('/api/users') +
                    (activeModal.mode === 'edit' ? `/${activeModal.id}` : '');
                body = userForm;
                if (activeModal.mode === 'edit' && !body.password) {
                    delete body.password;
                }
            } else {
                url =
                    apiUrl('/api/rooms') +
                    (activeModal.mode === 'edit' ? `/${activeModal.id}` : '');
                body = {
                    ...roomForm,
                    floor: Number(roomForm.floor),
                    capacity: Number(roomForm.capacity)
                };
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal menyimpan data');
            }

            // Jika membuat kamar baru, pastikan bed-nya juga dibuat (fallback bila backend lama belum auto-generate)
            if (activeModal.type === 'room' && activeModal.mode === 'create') {
                const roomId = data.id as number | undefined;
                const capacity = Number(roomForm.capacity) || 1;
                if (roomId) {
                    await ensureRoomBeds(roomId, capacity);
                }
            }

            closeModal();
            window.location.reload();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderModalTitle = () => {
        if (!activeModal) return '';
        const action = activeModal.mode === 'create' ? 'Tambah' : 'Edit';
        if (activeModal.type === 'ambulance') return `${action} Ambulans`;
        if (activeModal.type === 'user') return `${action} User`;
        return `${action} Kamar`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-[calc(100vh-8rem)] relative">
            {activeModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {renderModalTitle()}
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

                            {activeModal.type === 'ambulance' && (
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
                            )}

                            {activeModal.type === 'user' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Nama
                                        </label>
                                        <Input
                                            value={userForm.name}
                                            onChange={e =>
                                                setUserForm(prev => ({
                                                    ...prev,
                                                    name: e.target.value
                                                }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            value={userForm.email}
                                            onChange={e =>
                                                setUserForm(prev => ({
                                                    ...prev,
                                                    email: e.target.value
                                                }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Password {activeModal.mode === 'edit' && '(kosongkan jika tidak diubah)'}
                                        </label>
                                        <Input
                                            type="password"
                                            value={userForm.password}
                                            onChange={e =>
                                                setUserForm(prev => ({
                                                    ...prev,
                                                    password: e.target.value
                                                }))
                                            }
                                            required={activeModal.mode === 'create'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Role
                                        </label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm"
                                            value={userForm.role}
                                            onChange={e =>
                                                setUserForm(prev => ({
                                                    ...prev,
                                                    role: e.target.value
                                                }))
                                            }
                                        >
                                            <option value="Admin YBM">Admin YBM</option>
                                            <option value="Petugas Front Desk">Petugas Front Desk</option>
                                            <option value="Sistem Pengelola">Sistem Pengelola</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeModal.type === 'room' && (
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
                            )}

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
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 truncate">
                        <Wrench className="text-emerald-600 shrink-0" />
                        Pengaturan Master Data
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Kelola master data Ambulans, User, dan Kamar yang digunakan di seluruh modul dashboard.
                    </p>
                </div>
                {loading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="animate-spin" size={14} /> Memuat data...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/80">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Ambulance size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Master Ambulans</h2>
                            <p className="text-xs text-slate-500">
                                Data armada ambulans untuk keperluan booking.
                            </p>
                        </div>
                    </div>
                    <Button
                        className="w-full bg-slate-900 hover:bg-slate-800 text-sm"
                        onClick={() => openCreateModal('ambulance')}
                    >
                        <PlusCircle size={16} className="mr-2" />
                        Tambah Ambulans
                    </Button>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/80">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                            <UserCog size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Master User</h2>
                            <p className="text-xs text-slate-500">
                                Akun petugas yang mengakses dashboard GSP.
                            </p>
                        </div>
                    </div>
                    <Button
                        className="w-full bg-slate-900 hover:bg-slate-800 text-sm"
                        onClick={() => openCreateModal('user')}
                    >
                        <PlusCircle size={16} className="mr-2" />
                        Tambah User
                    </Button>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/80">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <BedSingle size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Master Kamar</h2>
                            <p className="text-xs text-slate-500">
                                Definisi kamar dan bed yang tampil di denah.
                            </p>
                        </div>
                    </div>
                    <Button
                        className="w-full bg-slate-900 hover:bg-slate-800 text-sm"
                        onClick={() => openCreateModal('room')}
                    >
                        <PlusCircle size={16} className="mr-2" />
                        Tambah Kamar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 overflow-x-auto min-h-0">
                {/* Tabel Ambulans */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <caption className="text-left px-4 pt-4 pb-2 text-sm font-semibold text-slate-700">
                                Daftar Ambulans
                            </caption>
                            <thead className="bg-slate-50 border-y border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 font-semibold text-slate-700">No. Polisi</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Status</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700 text-right">
                                        Aksi
                                    </th>
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
                                                className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${
                                                    a.status === 'Available'
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
                                                onClick={() => openEditModal('ambulance', a.id)}
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600"
                                                onClick={() => handleDelete('ambulance', a.id)}
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

                {/* Tabel User */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <caption className="text-left px-4 pt-4 pb-2 text-sm font-semibold text-slate-700">
                                Daftar User
                            </caption>
                            <thead className="bg-slate-50 border-y border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Nama</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Role</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="px-4 py-2 text-slate-800">
                                            <div className="font-medium">{u.name}</div>
                                            <div className="text-[11px] text-slate-500">{u.email}</div>
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 text-xs">{u.role}</td>
                                        <td className="px-4 py-2 text-right space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600"
                                                onClick={() => openEditModal('user', u.id)}
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600"
                                                onClick={() => handleDelete('user', u.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && !loading && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-4 py-4 text-xs text-slate-500 text-center"
                                        >
                                            Belum ada user selain admin default.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabel Kamar */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <caption className="text-left px-4 pt-4 pb-2 text-sm font-semibold text-slate-700">
                                Daftar Kamar
                            </caption>
                            <thead className="bg-slate-50 border-y border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 font-semibold text-slate-700">No. Kamar</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Deskripsi Kamar</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Lantai / Kapasitas</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700 text-right">
                                        Aksi
                                    </th>
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
                                                onClick={() => openEditModal('room', r.id)}
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600"
                                                onClick={() => handleDelete('room', r.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {rooms.length === 0 && !loading && (
                                    <tr>
                                        <td
                                            colSpan={3}
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

