'use client';

import { useEffect, useState } from 'react';
import { UserCog, PlusCircle, Edit2, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl, authFetch } from '@/lib/api';
import Link from 'next/link';

type UserType = {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
};

type RoleType = {
    id: number;
    name: string;
    accessible_menus: string | string[];
};

export default function UserSettingsPage() {
    const [users, setUsers] = useState<UserType[]>([]);
    const [roles, setRoles] = useState<RoleType[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeModal, setActiveModal] = useState<
        null | { mode: 'create' | 'edit'; id?: number }
    >(null);

    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Admin YBM'
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [userRes, roleRes] = await Promise.all([
                authFetch(apiUrl('/api/users')),
                authFetch(apiUrl('/api/roles'))
            ]);
            
            const [userData, roleData] = await Promise.all([
                userRes.json(),
                roleRes.json()
            ]);
            
            setUsers(userData);
            setRoles(roleData);
        } catch (err) {
            console.error('load user data error:', err);
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
        setUserForm({ name: '', email: '', password: '', role: roles.length > 0 ? roles[0].name : 'Admin YBM' });
        setActiveModal({ mode: 'create' });
    };

    const openEditModal = (id: number) => {
        setFormError('');
        setIsSubmitting(false);
        const item = users.find(u => u.id === id);
        if (!item) return;
        setUserForm({
            name: item.name,
            email: item.email,
            password: '',
            role: item.role
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
            const url = apiUrl(`/api/users/${id}`);
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
                apiUrl('/api/users') +
                (activeModal.mode === 'edit' ? `/${activeModal.id}` : '');
            const method = activeModal.mode === 'create' ? 'POST' : 'PUT';
            
            const body = { ...userForm };
            if (activeModal.mode === 'edit' && !body.password) {
                delete (body as any).password;
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
                                {activeModal.mode === 'create' ? 'Tambah' : 'Edit'} User
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
                                        {roles.map(r => (
                                            <option key={r.id} value={r.name}>{r.name}</option>
                                        ))}
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
                        <UserCog className="text-sky-600 shrink-0" />
                        Master User
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
                    Tambah User
                </Button>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Nama</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Role</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700 text-right">Aksi</th>
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
                                                onClick={() => openEditModal(u.id)}
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600"
                                                onClick={() => handleDelete(u.id)}
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
            </div>
        </div>
    );
}
