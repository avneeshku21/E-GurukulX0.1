import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import Button from '../components/ui/Button.jsx';
import { get } from '../lib/api.js';
import { formatDate } from '../lib/utils.js';

function AnimatedCheck({ valid }) {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-current animate-pulse" style={{ color: valid ? '#22c55e' : '#ef4444' }}>
      <span className="text-5xl font-bold">{valid ? '✓' : '✕'}</span>
      <span className="absolute inset-0 rounded-full border-4 border-current opacity-30 animate-ping" />
    </div>
  );
}

function downloadCertificatePdf(data) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 297, 210, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(3);
  doc.rect(10, 10, 277, 190);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(28);
  doc.text('E-GurukulX Certificate Verification', 148.5, 42, { align: 'center' });
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(data.student?.name ?? 'Unknown Student', 148.5, 76, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`Completed playlist: ${data.playlist?.name ?? 'Unknown Playlist'}`, 148.5, 94, { align: 'center' });
  doc.text(`Certificate ID: ${data.certificateId}`, 148.5, 108, { align: 'center' });
  doc.text(`Completed on ${formatDate(data.issuedAt)}`, 148.5, 122, { align: 'center' });
  doc.save(`${data.certificateId}.pdf`);
}

export default function CertificateVerifyPage() {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await get(`/certificate/verify/${certificateId}`);
        const data = response.data?.data;
        setCertificate(data);
        setIsValid(!!data?.valid && !data?.isRevoked);
      } catch {
        setCertificate(null);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [certificateId]);

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 text-center shadow-xl shadow-slate-950/5">
        {isLoading ? (
          <div className="space-y-5">
            <div className="mx-auto h-28 w-28 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-8 w-56 mx-auto rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-72 mx-auto rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ) : isValid && certificate ? (
          <div className="space-y-6">
            <AnimatedCheck valid />
            <div>
              <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-300">✅ Valid Certificate</h1>
              <p className="mt-3 text-lg font-mono text-slate-900 dark:text-slate-100 break-all">{certificate.certificateId}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Student Name</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{certificate.student?.name}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Playlist Name</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{certificate.playlist?.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Completed on {formatDate(certificate.issuedAt)}. This certificate was issued by E-GurukulX.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => downloadCertificatePdf(certificate)}>Download PDF</Button>
              <Link to="/">
                <Button variant="outline">Go to E-GurukulX</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatedCheck valid={false} />
            <div>
              <h1 className="text-3xl font-bold text-red-600 dark:text-red-300">❌ Invalid or Revoked Certificate</h1>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Certificate ID: <span className="font-mono text-slate-900 dark:text-slate-100">{certificateId}</span> not found</p>
            </div>
            <Link to="/">
              <Button>Go to E-GurukulX</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
