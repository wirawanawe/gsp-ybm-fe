'use client';

import { Wrench, Ambulance, UserCog, BedSingle, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-[calc(100vh-8rem)] relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 shrink-0">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 truncate">
                        <Wrench className="text-emerald-600 shrink-0" />
                        Pengaturan Master Data
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Pilih menu master data yang ingin dikelola.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Link 
                    href="/dashboard/settings/ambulance"
                    className="border border-slate-200 rounded-xl p-5 bg-slate-50/80 hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors group cursor-pointer h-full flex flex-col"
                >
                    <div className="flex items-center gap-3 mb-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Ambulance size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">Master Ambulans</h2>
                            <p className="text-xs text-slate-500">
                                Data armada ambulans untuk keperluan booking.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center text-emerald-600 text-sm font-medium mt-auto group-hover:underline">
                        Akses Menu <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>

                <Link 
                    href="/dashboard/settings/user"
                    className="border border-slate-200 rounded-xl p-5 bg-slate-50/80 hover:bg-sky-50/50 hover:border-sky-300 transition-colors group cursor-pointer h-full flex flex-col"
                >
                    <div className="flex items-center gap-3 mb-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                            <UserCog size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">Master User</h2>
                            <p className="text-xs text-slate-500">
                                Akun petugas yang mengakses dashboard GSP.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center text-sky-600 text-sm font-medium mt-auto group-hover:underline">
                        Akses Menu <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>

                <Link 
                    href="/dashboard/settings/room"
                    className="border border-slate-200 rounded-xl p-5 bg-slate-50/80 hover:bg-amber-50/50 hover:border-amber-300 transition-colors group cursor-pointer h-full flex flex-col"
                >
                    <div className="flex items-center gap-3 mb-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <BedSingle size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">Master Kamar</h2>
                            <p className="text-xs text-slate-500">
                                Definisi kamar dan bed yang tampil di denah.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center text-amber-600 text-sm font-medium mt-auto group-hover:underline">
                        Akses Menu <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>

                <Link 
                    href="/dashboard/settings/role"
                    className="border border-slate-200 rounded-xl p-5 bg-slate-50/80 hover:bg-indigo-50/50 hover:border-indigo-300 transition-colors group cursor-pointer h-full flex flex-col"
                >
                    <div className="flex items-center gap-3 mb-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Shield size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">Master Role</h2>
                            <p className="text-xs text-slate-500">
                                Kelola hak akses menu untuk setiap role.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center text-indigo-600 text-sm font-medium mt-auto group-hover:underline">
                        Akses Menu <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>
            </div>
        </div>
    );
}
