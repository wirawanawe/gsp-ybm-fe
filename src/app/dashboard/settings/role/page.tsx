'use client';

import { useEffect, useState } from 'react';
import { Shield, PlusCircle, Edit2, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiUrl, authFetch } from '@/lib/api';
import Link from 'next/link';

type RoleType = {
    id: number;
    name: string;
    accessible_menus: string | string[];
};

export default function RoleSettingsPage() {
    const [roles, setRoles] = useState<RoleType[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeModal, setActiveModal] = useState<
        null | { mode: 'create' | 'edit'; id?: number }
    >(null);

    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [roleForm, setRoleForm] = useState({
        name: '',
        accessible_menus: [] as string[]
    });

    const AVAILABLE_MENUS = [
        { href: '/dashboard/reports', label: 'Laporan' },
        { href: '/dashboard/register', label: 'Pendaftaran' },
        { href: '/dashboard/screening', label: 'Verifikasi Pasien' },
        { href: '/dashboard/patients', label: 'Data Pasien' },
        { href: '/dashboard/pendaftar', label: 'Data Pendaftar' },
        { href: '/dashboard/visitors', label: 'Data Penunggu' },
        { href: '/dashboard/rooms', label: 'Manajemen Kamar' },
        { href: '/dashboard/ambulance', label: 'Logistik Ambulans' },
        { href: '/dashboard/settings', label: 'Setting' },
        { href: '/dashboard/kegiatan/tahsin', label: 'Jadwal Tahsin' },
        { href: '/dashboard/kegiatan/taklim', label: 'Jadwal Taklim' },
        { href: '/dashboard/kegiatan/harian', label: 'Kegiatan Harian' },
        { href: '/dashboard/kegiatan/presensi', label: 'Presensi' },
        { href: '/dashboard/kesehatan/tensi', label: 'Pencatatan Tensi' },
        { href: '/dashboard/kesehatan/kondisi', label: 'Kondisi Pasien' },
        { href: '/dashboard/keuangan/pemasukan', label: 'Dana Masuk' },
        { href: '/dashboard/keuangan/pengeluaran', label: 'Pengeluaran' },
        { href: '/dashboard/keuangan/laporan', label: 'Laporan Keuangan' },
        { href: '/dashboard/keuangan/rekap', label: 'Rekap Keuangan' }
    ];

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await authFetch(apiUrl('/api/roles'));
            const data = await res.json();
            setRoles(data);
        } catch (err) {
            console.error('load role data error:', err);
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
        setRoleForm({ name: '', accessible_menus: [] });
        setActiveModal({ mode: 'create' });
    };

    const openEditModal = (id: number) => {
        setFormError('');
        setIsSubmitting(false);
        const item = roles.find(r => r.id === id);
        if (!item) return;
        let parsedMenus = [];
        if (typeof item.accessible_menus === 'string') {
            try {
                parsedMenus = JSON.parse(item.accessible_menus);
            } catch(e) {}
        } else if (Array.isArray(item.accessible_menus)) {
            parsedMenus = item.accessible_menus;
        }
        setRoleForm({
            name: item.name,
            accessible_menus: parsedMenus
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
            const url = apiUrl(`/api/roles/${id}`);
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
                apiUrl('/api/roles') +
                (activeModal.mode === 'edit' ? `/${activeModal.id}` : '');
            const method = activeModal.mode === 'create' ? 'POST' : 'PUT';

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleForm)
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
                                {activeModal.mode === 'create' ? 'Tambah' : 'Edit'} Role
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
                                        Nama Role
                                    </label>
                                    <Input
                                        value={roleForm.name}
                                        onChange={e =>
                                            setRoleForm(prev => ({
                                                ...prev,
                                                name: e.target.value
                                            }))
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-2">
                                        Menu yang dapat diakses:
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 border border-slate-200 rounded-md">
                                        {AVAILABLE_MENUS.map(menu => {
                                            const isChecked = roleForm.accessible_menus.includes(menu.href);
                                            return (
                                                <label key={menu.href} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setRoleForm(prev => ({ ...prev, accessible_menus: [...prev.accessible_menus, menu.href] }));
                                                            } else {
                                                                setRoleForm(prev => ({ ...prev, accessible_menus: prev.accessible_menus.filter(href => href !== menu.href) }));
                                                            }
                                                        }}
                                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    {menu.label}
                                                </label>
                                            )
                                        })}
                                    </div>
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
                        <Shield className="text-indigo-600 shrink-0" />
                        Master Role
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
                    Tambah Role
                </Button>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 font-semibold text-slate-700">Nama Role</th>
                                    <th className="px-4 py-2 font-semibold text-slate-700 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roles.map(r => {
                                    let activeMenusCount = 0;
                                    try {
                                        activeMenusCount = typeof r.accessible_menus === 'string' ? JSON.parse(r.accessible_menus).length : r.accessible_menus.length;
                                    } catch(e) {}
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-4 py-2 text-slate-800">
                                                <div className="font-medium">{r.name}</div>
                                                <div className="text-[11px] text-slate-500">{activeMenusCount} menu diizinkan</div>
                                            </td>
                                            <td className="px-4 py-2 text-right space-x-1 whitespace-nowrap">
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
                                    );
                                })}
                                {roles.length === 0 && !loading && (
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="px-4 py-4 text-xs text-slate-500 text-center"
                                        >
                                            Belum ada data role.
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
