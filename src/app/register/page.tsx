'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, FileText, CheckCircle2, HeartPulse, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '', nik: '', dob: '', gender: 'Laki-laki', address: '', phone: '', status_mustahik: 'Mustahik',
    });

    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        ktp: null, kk: null, bpjs: null, sktm: null, rujukan: null
    });
    const [regNumber, setRegNumber] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        if (e.target.files && e.target.files[0]) {
            setFiles({ ...files, [type]: e.target.files[0] });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });

            if (files.ktp) formDataToSend.append('ktp', files.ktp);
            if (files.kk) formDataToSend.append('kk', files.kk);
            if (files.bpjs) formDataToSend.append('bpjs', files.bpjs);
            if (files.sktm) formDataToSend.append('sktm', files.sktm);
            if (files.rujukan) formDataToSend.append('rujukan', files.rujukan);

            const res = await fetch('http://localhost:5000/api/patients/register', {
                method: 'POST',
                body: formDataToSend,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Gagal mendaftar');
            }

            setRegNumber(data.registration_number);
            setStep(3);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <Link href="/" className="absolute top-8 left-8 text-slate-500 hover:text-emerald-700 flex items-center gap-2 font-medium transition-colors">
                <ArrowLeft size={20} />
                Kembali ke Beranda
            </Link>

            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <div className="bg-emerald-600 w-14 h-14 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-200">
                        <HeartPulse size={28} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pendaftaran Pasien GSP</h1>
                    <p className="mt-3 text-slate-500 max-w-xl mx-auto">Silakan lengkapi formulir pendaftaran di bawah ini. Dokumen Anda akan diverifikasi oleh Tim YBM PLN.</p>
                </div>

                {/* Progress Timeline */}
                <div className="mb-10">
                    <div className="flex items-center justify-center max-w-xl mx-auto">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= 1 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                                }`}>
                                {step > 1 ? <CheckCircle2 size={20} /> : '1'}
                            </div>
                            <span className={`text-sm mt-3 font-medium ${step >= 1 ? 'text-emerald-700' : 'text-slate-500'}`}>Data Diri</span>
                        </div>

                        <div className={`flex-1 h-1 mx-4 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

                        {/* Step 2 */}
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= 2 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                                }`}>
                                {step > 2 ? <CheckCircle2 size={20} /> : '2'}
                            </div>
                            <span className={`text-sm mt-3 font-medium ${step >= 2 ? 'text-emerald-700' : 'text-slate-500'}`}>Dokumen</span>
                        </div>

                        <div className={`flex-1 h-1 mx-4 rounded-full transition-colors ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

                        {/* Step 3 */}
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= 3 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                                }`}>
                                3
                            </div>
                            <span className={`text-sm mt-3 font-medium ${step >= 3 ? 'text-emerald-700' : 'text-slate-500'}`}>Selesai</span>
                        </div>
                    </div>
                </div>

                {/* Forms Container */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 sm:p-10 border border-slate-100">

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                <User className="text-emerald-600" />
                                <h2 className="text-xl font-bold text-slate-800">Informasi Pribadi Pasien</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Lengkap Sesuai KTP</Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" className="h-11" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nik">Nomor Induk Kependudukan (NIK)</Label>
                                    <Input id="nik" name="nik" value={formData.nik} onChange={handleInputChange} placeholder="3171xxxxxxxxxxxx" className="h-11" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Tanggal Lahir</Label>
                                    <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} className="h-11" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Nomor Telepon / WhatsApp Aktif</Label>
                                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="08xxxxxxxxxx" className="h-11" required />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Alamat Lengkap KTP</Label>
                                    <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Jl. Raya Contoh No. 123..." required></textarea>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <Button onClick={nextStep} className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md font-semibold text-sm">
                                    Selanjutnya <ChevronRight size={18} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                <FileText className="text-emerald-600" />
                                <h2 className="text-xl font-bold text-slate-800">Upload Berkas Persyaratan</h2>
                            </div>

                            <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100 mb-6 text-sm text-blue-800 font-medium flex gap-3 items-start">
                                <div className="mt-0.5">ℹ️</div>
                                <p>Format file yang diterima: JPG, PNG, atau PDF. Maksimal ukuran per file adalah 5MB.</p>
                            </div>

                            {errorMsg && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md">
                                    {errorMsg}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: 'KTP Pasien', id: 'ktp' },
                                    { label: 'Kartu Keluarga (KK)', id: 'kk' },
                                    { label: 'BPJS Kesehatan', id: 'bpjs' },
                                    { label: 'SKTM', id: 'sktm' },
                                    { label: 'Surat Rujukan RS', id: 'rujukan' }
                                ].map((doc) => (
                                    <div key={doc.id} className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center text-center transition-colors cursor-pointer group ${files[doc.id] ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'}`}>
                                        <div className={`p-3 rounded-full mb-3 transition-colors ${files[doc.id] ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                                            {files[doc.id] ? <CheckCircle2 size={20} /> : <Upload size={20} />}
                                        </div>
                                        <Label htmlFor={`file-${doc.id}`} className="font-bold text-slate-700 mb-1 cursor-pointer">{doc.label}</Label>
                                        <p className="text-xs text-slate-500 mb-4 max-w-[200px] truncate">
                                            {files[doc.id] ? files[doc.id]?.name : 'Klik untuk upload file'}
                                        </p>
                                        <Input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            className="hidden"
                                            id={`file-${doc.id}`}
                                            onChange={(e) => handleFileChange(e, doc.id)}
                                        />
                                        <label htmlFor={`file-${doc.id}`} className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-slate-100 cursor-pointer">
                                            {files[doc.id] ? 'Ganti File' : 'Pilih File'}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 flex justify-between">
                                <Button variant="ghost" onClick={prevStep} className="h-12 px-6 font-medium text-slate-600 hover:text-slate-900">
                                    <ArrowLeft size={18} className="mr-2" /> Kembali
                                </Button>
                                <Button onClick={handleSubmit} disabled={loading} className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md font-semibold text-sm">
                                    {loading ? 'Memproses Data...' : 'Kirim Pendaftaran'}
                                    {!loading && <CheckCircle2 size={18} className="ml-2" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Pendaftaran Berhasil!</h2>
                            <p className="text-lg text-slate-600 max-w-lg mb-2">
                                Terima kasih, data Anda telah masuk ke dalam sistem dengan Nomor Registrasi:
                            </p>
                            <div className="bg-slate-100 border border-slate-200 px-6 py-3 rounded-lg font-mono text-xl font-bold tracking-wider text-slate-800 my-6">
                                {regNumber}
                            </div>
                            <p className="text-slate-500 max-w-sm mb-10">
                                Tim Pengurus Griya Singgah YBM PLN akan melakukan verifikasi dokumen Anda selambatnya 1x24 jam.
                            </p>

                            <Link href="/">
                                <Button className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md font-medium text-sm">
                                    Kembali ke Beranda
                                </Button>
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
