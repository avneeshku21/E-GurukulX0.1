// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – CertificateCard
// Trophy header + certificate details + PDF download (jsPDF) + verify link
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import Button  from './ui/Button.jsx';
import { formatDate } from '../lib/utils.js';
import { useAuth } from '../context/AuthContext.jsx';

const TrophyIcon = () => (
  <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11 2v3H5v5c0 2.97 2.16 5.44 5 5.91V18H8v2h8v-2h-2v-2.09c2.84-.47 5-2.94 5-5.91V5h-6V2h-2zM7 7h10v3c0 2.21-1.79 4-4 4h-2C8.79 14 7 12.21 7 10V7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// ── PDF generation ────────────────────────────────────────────────────────────
function downloadCertificatePDF({ studentName, playlistName, certificateId, issuedAt }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const W = 297;  // A4 landscape width (mm)
  const H = 210;  // A4 landscape height (mm)

  // Background
  doc.setFillColor(252, 251, 255);
  doc.rect(0, 0, W, H, 'F');

  // Outer gold border
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(3);
  doc.rect(8, 8, W - 16, H - 16);

  // Inner gold border
  doc.setLineWidth(0.8);
  doc.rect(12, 12, W - 24, H - 24);

  // Header background strip
  doc.setFillColor(79, 70, 229);
  doc.rect(12, 12, W - 24, 28, 'F');

  // Brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('E-GurukulX', W / 2, 30, { align: 'center' });

  // Subtitle inside header
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 196, 255);
  doc.text('Where Knowledge Meets Discipline and Growth', W / 2, 37, { align: 'center' });

  // "Certificate of Completion" title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(15, 23, 42);
  doc.text('Certificate of Completion', W / 2, 68, { align: 'center' });

  // Decorative gold line under title
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 60, 73, W / 2 + 60, 73);

  // "This certifies that"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('This certifies that', W / 2, 86, { align: 'center' });

  // Student name (large, indigo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(79, 70, 229);
  doc.text(studentName, W / 2, 103, { align: 'center' });

  // "has successfully completed"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('has successfully completed the playlist', W / 2, 116, { align: 'center' });

  // Playlist name (italic)
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const safePlaylist = playlistName.length > 60 ? playlistName.slice(0, 57) + '...' : playlistName;
  doc.text(safePlaylist, W / 2, 130, { align: 'center' });

  // Gold divider
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(W / 2 - 70, 140, W / 2 + 70, 140);

  // Date (left) and ID (right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${formatDate(issuedAt)}`, W / 2 - 60, 153, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.text(`Certificate ID: ${certificateId}`, W / 2 + 55, 153, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Verify at: egurukulx.app/verify/' + certificateId, W / 2, 175, { align: 'center' });

  doc.save(`E-GurukulX-${certificateId}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CertificateCard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ id, certificateId, playlistName, issuedAt }} certificate
 */
export default function CertificateCard({ certificate }) {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    try {
      downloadCertificatePDF({
        studentName:   user?.name ?? 'Student',
        playlistName:  certificate.playlistName,
        certificateId: certificate.certificateId,
        issuedAt:      certificate.issuedAt,
      });
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-yellow-200 dark:border-yellow-900/50 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-shadow duration-200">

      {/* ── Gradient header ─────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-16 h-16 rounded-full bg-white/10 blur-lg pointer-events-none" />

        <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
          <TrophyIcon />
        </div>
        <div className="relative z-10 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Certificate of Completion
          </p>
          <h3 className="font-bold text-base text-white truncate mt-0.5">
            {certificate.playlistName}
          </h3>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Certificate ID */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Certificate ID
          </p>
          <p className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide break-all">
            {certificate.certificateId}
          </p>
        </div>

        {/* Issued date */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Issued On</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {formatDate(certificate.issuedAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="primary"
            size="sm"
            isLoading={downloading}
            leftIcon={!downloading ? <DownloadIcon /> : undefined}
            onClick={handleDownload}
            className="flex-1"
          >
            Download PDF
          </Button>

          <Link
            to={`/verify/${certificate.certificateId}`}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ExternalLinkIcon /> Verify
          </Link>
        </div>
      </div>
    </div>
  );
}
