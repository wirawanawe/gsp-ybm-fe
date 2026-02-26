'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { User, FileText, CheckCircle2, HeartPulse, ChevronRight, Upload, ArrowLeft, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

export default function DashboardRegisterPatientPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        nik: '',
        dob: '',
        gender: 'Laki-laki',
        address: '',
        phone: '',
        status_mustahik: 'Mustahik'
    });

    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        ktp: null,
        kk: null,
        bpjs: null,
        sktm: null,
        rujukan: null
    });
    const [regNumber, setRegNumber] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [dataFromExisting, setDataFromExisting] = useState(false);
    const [existingPatientId, setExistingPatientId] = useState<number | null>(null);
    const [existingDocuments, setExistingDocuments] = useState<{ id: number; document_type: string; file_path: string }[]>([]);

    const nextStep = () => {
        if (step === 1 && formData.nik.length !== 16) {
            setErrorMsg('NIK harus tepat 16 digit sesuai KTP');
            return;
        }
        setErrorMsg('');
        setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        if (e.target.files && e.target.files[0]) {
            setFiles({ ...files, [type]: e.target.files[0] });
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name !== 'nik') setDataFromExisting(false);
    };

    const handleLookupByNik = async () => {
        if (formData.nik.length !== 16) {
            setErrorMsg('NIK harus tepat 16 digit');
            return;
        }
        setLookupLoading(true);
        setErrorMsg('');
        setDataFromExisting(false);
        setExistingPatientId(null);
        setExistingDocuments([]);
        try {
            const res = await fetch(apiUrl(`/api/patients/by-nik?nik=${formData.nik}`));
            const data = await res.json();
            if (data && res.ok) {
                if (!data.can_re_register) {
                    setErrorMsg(data.can_re_register_reason || 'Pasien belum dapat mendaftar ulang. Hanya pasien yang sudah checkout/pulang atau ditolak yang dapat mendaftar kembali.');
                    setLookupLoading(false);
                    return;
                }
                setFormData({
                    name: data.name || '',
                    nik: data.nik || formData.nik,
                    dob: data.dob ? data.dob.slice(0, 10) : '',
                    gender: data.gender || 'Laki-laki',
                    address: data.address || '',
                    phone: data.phone || '',
                    status_mustahik: data.status_mustahik || 'Mustahik'
                });
                setDataFromExisting(true);
                setExistingPatientId(data.id);

                // Ambil dokumen yang pernah diupload
                const docsRes = await fetch(apiUrl(`/api/patients/${data.id}/documents`));
                const docs = await docsRes.json();
                setExistingDocuments(Array.isArray(docs) ? docs : []);
            }
        } catch (err) {
            setErrorMsg('Gagal mencari data pasien');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.nik.length !== 16) {
            setErrorMsg('NIK harus tepat 16 digit sesuai KTP');
            return;
        }
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

            let res: Response;
            let url: string;

            if (existingPatientId) {
                // Pendaftaran ulang: gunakan data & dokumen yang sudah ada
                url = apiUrl(`/api/patients/${existingPatientId}/re-register`);
                res = await fetch(url, { method: 'POST', body: formDataToSend });
            } else {
                url = apiUrl('/api/patients/register');
                res = await fetch(url, { method: 'POST', body: formDataToSend });
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Gagal mendaftar');
            }

            setRegNumber(data.registration_number);
            setStep(3);
            toast.success(existingPatientId ? 'Pendaftaran Ulang Berhasil' : 'Pendaftaran Berhasil', {
                description: `No. registrasi: ${data.registration_number}. Pasien masuk antrian Verifikasi Pasien. Verifikasi (Layak Mustahik) agar muncul di Data Pendaftar.`,
                duration: 6000,
            });
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto min-h-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="min-w-0">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white mb-2">
                        <HeartPulse size={22} />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">Pendaftaran Pasien Baru</h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Form ini digunakan oleh petugas front desk untuk mendaftarkan pasien ke sistem GSP.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:inline-flex"
                    onClick={() => router.back()}
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Kembali
                </Button>
            </div>

            {/* Progress Timeline - Responsive */}
            <div className="mb-6 sm:mb-8 overflow-x-auto">
                <div className="flex items-center min-w-[280px] max-w-xl">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                                step >= 1
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-400'
                            }`}
                        >
                            {step > 1 ? <CheckCircle2 size={18} /> : '1'}
                        </div>
                        <span
                            className={`text-xs mt-2 font-medium ${
                                step >= 1 ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                        >
                            Data Diri
                        </span>
                    </div>

                    <div
                        className={`flex-1 h-1 mx-3 rounded-full transition-colors ${
                            step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}
                    />

                    {/* Step 2 */}
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                                step >= 2
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-400'
                            }`}
                        >
                            {step > 2 ? <CheckCircle2 size={18} /> : '2'}
                        </div>
                        <span
                            className={`text-xs mt-2 font-medium ${
                                step >= 2 ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                        >
                            Dokumen
                        </span>
                    </div>

                    <div
                        className={`flex-1 h-1 mx-3 rounded-full transition-colors ${
                            step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}
                    />

                    {/* Step 3 */}
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                                step >= 3
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-400'
                            }`}
                        >
                            3
                        </div>
                        <span
                            className={`text-xs mt-2 font-medium ${
                                step >= 3 ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                        >
                            Selesai
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100 mb-4 sm:mb-6 text-xs text-slate-600">
                <p>
                    Petugas diminta untuk memastikan bahwa data pasien sesuai dengan dokumen resmi
                    (KTP/KK) dan menuliskan nomor kontak yang aktif agar mudah dihubungi.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {step === 1 && (
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <User className="text-emerald-600" />
                            <h2 className="text-lg font-semibold text-slate-800">
                                Informasi Pribadi Pasien
                            </h2>
                        </div>

                        {errorMsg && (
                            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs rounded-r-md">
                                {errorMsg}
                            </div>
                        )}

                        {dataFromExisting && (
                            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs rounded-r-md flex items-center gap-2">
                                <CheckCircle2 size={16} />
                                Data pasien ditemukan dari pendaftaran sebelumnya. Silakan periksa dan lanjutkan.
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="nik">NIK (16 digit) - Input terlebih dahulu untuk cari data</Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input
                                        id="nik"
                                        name="nik"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={16}
                                        value={formData.nik}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormData({ ...formData, nik: val });
                                            if (errorMsg && val.length === 16) setErrorMsg('');
                                            setDataFromExisting(false);
                                            setExistingPatientId(null);
                                            setExistingDocuments([]);
                                        }}
                                        placeholder="16 digit NIK sesuai KTP"
                                        className="flex-1 w-full"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleLookupByNik}
                                        disabled={lookupLoading || formData.nik.length !== 16}
                                        className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto"
                                    >
                                        {lookupLoading ? 'Mencari...' : (
                                            <>
                                                <Search size={16} className="mr-1" />
                                                Cari Data
                                            </>
                                        )}
                                    </Button>
                                </div>
                                {formData.nik && formData.nik.length !== 16 && (
                                    <p className="text-xs text-amber-600">NIK harus tepat 16 digit untuk mencari data</p>
                                )}
                                <p className="text-xs text-slate-500">
                                    Pasien yang pernah terdaftar: masukkan NIK lalu klik Cari Data. Form akan terisi otomatis.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Sesuai KTP"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Tanggal Lahir</Label>
                                <Input
                                    id="dob"
                                    name="dob"
                                    type="date"
                                    value={formData.dob}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">No. Telepon / WhatsApp</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="08xxxxxxxxxx"
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Alamat Lengkap (KTP)</Label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="flex w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                                    placeholder="Tuliskan alamat sesuai KTP"
                                    required
                                ></textarea>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={nextStep}
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                            >
                                Lanjut ke Dokumen
                                <ChevronRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <FileText className="text-emerald-600" />
                            <h2 className="text-lg font-semibold text-slate-800">
                                Upload Berkas Persyaratan
                            </h2>
                        </div>

                        <div className="rounded-lg bg-blue-50/60 p-3 border border-blue-100 text-xs text-blue-800">
                            Format file: JPG, PNG, atau PDF. Maksimal 5MB per file.
                            <br />
                            <span className="font-medium">Dokumen dapat disusulkan</span> saat verifikasi di rumah singgah jika pasien lupa membawa saat pendaftaran.
                        </div>

                        {errorMsg && (
                            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs rounded-r-md">
                                {errorMsg}
                            </div>
                        )}

                        {existingDocuments.length > 0 && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={16} />
                                    Dokumen dari pendaftaran sebelumnya
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {existingDocuments.map(doc => (
                                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-emerald-100">
                                            <FileText size={18} className="text-emerald-600 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-800 text-sm">{doc.document_type}</div>
                                                <a
                                                    href={apiUrl(`/${doc.file_path}`)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                                                >
                                                    <Eye size={12} /> Lihat berkas
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-emerald-700 mt-3">
                                    Dokumen di atas akan tetap digunakan. Upload di bawah hanya jika perlu menambah atau mengganti.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {[
                                { label: 'KTP Pasien', id: 'ktp' },
                                { label: 'Kartu Keluarga (KK)', id: 'kk' },
                                { label: 'BPJS Kesehatan', id: 'bpjs' },
                                { label: 'SKTM', id: 'sktm' },
                                { label: 'Surat Rujukan RS', id: 'rujukan' }
                            ].map(doc => (
                                <div
                                    key={doc.id}
                                    className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center text-center transition-colors cursor-pointer group ${
                                        files[doc.id]
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                                    }`}
                                >
                                    <div
                                        className={`p-2.5 rounded-full mb-2 transition-colors ${
                                            files[doc.id]
                                                ? 'bg-emerald-200 text-emerald-700'
                                                : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                                        }`}
                                    >
                                        {files[doc.id] ? (
                                            <CheckCircle2 size={18} />
                                        ) : (
                                            <Upload size={18} />
                                        )}
                                    </div>
                                    <Label
                                        htmlFor={`file-${doc.id}`}
                                        className="font-semibold text-slate-700 mb-1 cursor-pointer text-xs"
                                    >
                                        {doc.label}
                                    </Label>
                                    <p className="text-[11px] text-slate-500 mb-3 max-w-[180px] truncate">
                                        {files[doc.id]
                                            ? files[doc.id]?.name
                                            : 'Klik untuk memilih file'}
                                    </p>
                                    <Input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        className="hidden"
                                        id={`file-${doc.id}`}
                                        onChange={e => handleFileChange(e, doc.id)}
                                    />
                                    <label
                                        htmlFor={`file-${doc.id}`}
                                        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-[11px] font-medium shadow-sm hover:bg-slate-100 cursor-pointer"
                                    >
                                        {files[doc.id] ? 'Ganti File' : 'Pilih File'}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex justify-between">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={prevStep}
                                className="h-9 px-4 text-slate-600 text-sm"
                            >
                                <ArrowLeft size={16} className="mr-1" /> Kembali
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                            >
                                {loading ? 'Memproses...' : 'Kirim Pendaftaran'}
                                {!loading && <CheckCircle2 size={16} className="ml-2" />}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="py-12 px-6 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 ring-8 ring-emerald-50">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
                            Pendaftaran Berhasil
                        </h2>
                        <p className="text-sm text-slate-600 max-w-md mb-2">
                            Nomor Registrasi pasien:
                        </p>
                        <div className="bg-slate-100 border border-slate-200 px-5 py-2 rounded-lg font-mono text-lg font-bold tracking-wider text-slate-800 my-4">
                            {regNumber}
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mb-2">
                            Nomor ini dapat digunakan untuk proses verifikasi dan penempatan kamar selanjutnya.
                        </p>
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-md mb-6">
                            Pasien baru masuk antrian <strong>Verifikasi Pasien</strong>. Agar muncul di <strong>Data Pendaftar</strong> dan bisa check-in, verifikasi di menu Verifikasi Pasien lalu pilih <strong>Layak Mustahik</strong>.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/dashboard/screening')}
                            >
                                Ke Verifikasi Pasien
                            </Button>
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => {
                                    setStep(1);
                                    setRegNumber('');
                                    setFormData({
                                        name: '',
                                        nik: '',
                                        dob: '',
                                        gender: 'Laki-laki',
                                        address: '',
                                        phone: '',
                                        status_mustahik: 'Mustahik'
                                    });
                                    setFiles({
                                        ktp: null,
                                        kk: null,
                                        bpjs: null,
                                        sktm: null,
                                        rujukan: null
                                    });
                                }}
                            >
                                Daftarkan Pasien Lain
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

