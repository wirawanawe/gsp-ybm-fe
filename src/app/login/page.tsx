'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login gagal');
            }

            // Save token & user data to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            router.push('/dashboard/screening');
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <Link href="/" className="absolute top-8 left-8 text-slate-500 hover:text-emerald-700 flex items-center gap-2 font-medium transition-colors">
                <ArrowLeft size={20} />
                Kembali ke Beranda
            </Link>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Login Sistem Pengelola</h1>
                    <p className="text-slate-500 mt-2">Masuk untuk mengelola data pasien dan operasional GSP YBM PLN.</p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="admin@gsp.com"
                            required
                            disabled={loading}
                            className="h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg px-4"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                            <Link href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Lupa password?</Link>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className="h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg px-4"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-xl shadow-md shadow-emerald-200 mb-4 transition-all disabled:opacity-70 flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            'Masuk'
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    <p>Jika Anda tidak memiliki akun, harap rincikan ke Administrator YBM.</p>
                </div>
            </div>
        </div>
    );
}
