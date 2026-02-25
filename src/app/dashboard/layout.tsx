'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Users, UserCheck, BedDouble,
    Ambulance, PieChart, LogOut,
    Menu, X
} from 'lucide-react';

const sidebarLinks = [
    { name: 'Verifikasi Pasien', href: '/dashboard/screening', icon: UserCheck },
    { name: 'Manajemen Kamar', href: '/dashboard/rooms', icon: BedDouble },
    { name: 'Data Penunggu', href: '/dashboard/visitors', icon: Users },
    { name: 'Logistik Ambulans', href: '/dashboard/ambulance', icon: Ambulance },
    { name: 'Laporan Okupansi', href: '/dashboard/reports', icon: PieChart },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        const userDataStr = localStorage.getItem('user');

        if (!token || !userDataStr) {
            router.push('/login');
            return;
        }

        try {
            setUser(JSON.parse(userDataStr));
        } catch {
            router.push('/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return null; // Or a loading spinner

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                        <span className="text-xl font-bold text-white tracking-tight">GSP Dashboard</span>
                        <button
                            className="ml-auto md:hidden text-slate-400 hover:text-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 border-b border-slate-800">
                        <div className="font-medium text-slate-100">{user.name}</div>
                        <div className="text-sm text-emerald-400 mt-1">{user.role}</div>
                    </div>

                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-3">
                            {sidebarLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname.startsWith(link.href);
                                return (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                                    ? 'bg-emerald-600/10 text-emerald-400 font-medium'
                                                    : 'hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                                            {link.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                            <LogOut size={18} />
                            Keluar
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 sticky top-0 z-40">
                    <button
                        className="md:hidden mr-4 text-slate-600 hover:text-slate-900"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="font-medium text-slate-800 truncate">
                        {sidebarLinks.find(link => pathname.startsWith(link.href))?.name || 'Dashboard'}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
