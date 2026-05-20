'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Play,
  FileDown,
  Loader2,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import API from '@/services/api';

interface VerificationLog {
  id: string;
  verificationType: 'AADHAAR' | 'PAN';
  requestPayload: any;
  responsePayload: any;
  verificationStatus: 'VERIFIED' | 'FAILED';
  verifiedAt: string;
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  aadhaarNumber: string;
  panNumber: string;
  dob: string;
  address: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'PARTIAL';
  createdAt: string;
  verificationLogs: VerificationLog[];
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Unwrap Next.js App Router params using React.use()
  const { id } = use(params);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCandidateDetails = async () => {
    try {
      const response = await API.get(`/candidates/${id}`);
      setCandidate(response.data.candidate);
    } catch (error: any) {
      console.error('Error fetching candidate details:', error);
      setErrorMsg(error.response?.data?.error || 'Failed to fetch candidate details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidateDetails();
  }, [id]);

  const handleStartVerification = async () => {
    setVerifying(true);
    setErrorMsg(null);
    try {
      const response = await API.post(`/verifications/${id}/start`);
      setCandidate(response.data.candidate);
    } catch (error: any) {
      console.error('Verification error:', error);
      setErrorMsg(error.response?.data?.error || 'Verification process failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!candidate) return;
    try {
      const response = await API.get(`/reports/${id}`, {
        responseType: 'blob',
      });
      // Create element link to trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Verification_Report_${candidate.fullName.replace(/\s+/g, '_')}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download PDF report. Make sure verification is complete.');
    }
  };

  const getStatusBanner = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Verification Status: Verified</h4>
              <p className="text-xs text-emerald-500/80 mt-0.5">
                All records match perfectly. The candidate is fully authenticated.
              </p>
            </div>
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Verification Status: Failed</h4>
              <p className="text-xs text-red-500/80 mt-0.5">
                The verification failed. One or more external check records did not match.
              </p>
            </div>
          </div>
        );
      case 'PARTIAL':
        return (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Verification Status: Partial Match</h4>
              <p className="text-xs text-amber-500/80 mt-0.5">
                One document check verified successfully, but another failed check.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 text-blue-400">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white animate-pulse">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-blue-300">Verification Status: Pending</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  No verification run has been conducted on this candidate yet.
                </p>
              </div>
            </div>
            <button
              onClick={handleStartVerification}
              disabled={verifying}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/15 hover:bg-blue-500 disabled:opacity-50 transition-all self-start sm:self-center"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Audits...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Verification
                </>
              )}
            </button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (errorMsg && !candidate) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center max-w-lg mx-auto mt-20">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Error Loading Profile</h3>
        <p className="text-sm text-slate-400 mt-2">{errorMsg}</p>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </Link>

        {candidate.status !== 'PENDING' && (
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 hover:border-slate-700 transition-colors shadow-md"
          >
            <FileDown className="h-4 w-4" />
            Download PDF Report
          </button>
        )}
      </div>

      {/* Main Grid: Details & Action */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col: Candidate Info card (2/3 width) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status banner */}
          {getStatusBanner(candidate.status)}

          {errorMsg && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Profile Card */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 backdrop-blur-xl space-y-6">
            <h3 className="text-base font-bold text-white border-b border-slate-900 pb-3">
              Candidate Profile Details
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                {/* Full name */}
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
                      Full Name
                    </span>
                    <p className="text-sm font-semibold text-white">{candidate.fullName}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
                      Email Address
                    </span>
                    <p className="text-sm font-semibold text-white truncate">{candidate.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
                      Phone Number
                    </span>
                    <p className="text-sm font-semibold text-white">{candidate.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Date of Birth */}
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
                      Date of Birth
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {new Date(candidate.dob).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Aadhaar */}
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                    <CreditCard className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
                      Aadhaar (Masked)
                    </span>
                    <p className="text-sm font-mono font-semibold text-white">{candidate.aadhaarNumber}</p>
                  </div>
                </div>

                {/* PAN */}
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                    <CreditCard className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
                      PAN Card (Masked)
                    </span>
                    <p className="text-sm font-mono font-semibold text-white">{candidate.panNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="flex gap-3 border-t border-slate-900 pt-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-400">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
                  Residential Address
                </span>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{candidate.address}</p>
              </div>
            </div>
          </div>

          {/* Registry Audit Logs */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 backdrop-blur-xl space-y-5">
            <h3 className="text-base font-bold text-white border-b border-slate-900 pb-3">
              API Registry Response Logs
            </h3>

            {candidate.verificationLogs.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-slate-600 text-xs">
                <Terminal className="h-8 w-8 mb-2" />
                <span>No registry response logs recorded yet.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {candidate.verificationLogs.map((log) => {
                  const isOpen = expandedLog === log.id;
                  return (
                    <div key={log.id} className="rounded-xl border border-slate-900 bg-slate-950/60 overflow-hidden">
                      <button
                        onClick={() => setExpandedLog(isOpen ? null : log.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-900/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Terminal className="h-4 w-4 text-blue-500" />
                          <div>
                            <span className="text-xs font-bold text-white">
                              {log.verificationType} CHECK LOG
                            </span>
                            <span className="text-[10px] text-slate-500 ml-2">
                              {new Date(log.verifiedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {log.verificationStatus === 'VERIFIED' ? (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">
                              SUCCESS
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-400 uppercase">
                              FAILED
                            </span>
                          )}
                          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-900 bg-slate-950 p-4 font-mono text-[10px] text-slate-400 space-y-3">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500">// Request Payload</span>
                            <pre className="mt-1 bg-black/40 p-2.5 rounded-lg overflow-x-auto text-blue-300">
                              {JSON.stringify(log.requestPayload, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500">// Registry Response Payload</span>
                            <pre className="mt-1 bg-black/40 p-2.5 rounded-lg overflow-x-auto text-emerald-400">
                              {JSON.stringify(log.responsePayload, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Timeline view (1/3 width) */}
        <div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 backdrop-blur-xl">
            <h3 className="text-base font-bold text-white border-b border-slate-900 pb-3 mb-6">
              Verification Timeline
            </h3>

            {/* Vertical timeline */}
            <div className="relative border-l border-slate-900 pl-6 space-y-8 ml-3 text-xs">
              {/* Point 1: Created */}
              <div className="relative">
                <div className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-white">Candidate Created</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Profile successfully registered in database.
                  </p>
                  <p className="text-[9px] text-slate-600 mt-1">
                    {new Date(candidate.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Point 2: Triggered */}
              <div className="relative">
                <div
                  className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full font-bold text-xs ${
                    candidate.status !== 'PENDING'
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border border-slate-800 text-slate-600'
                  }`}
                >
                  {candidate.status !== 'PENDING' ? '✓' : '2'}
                </div>
                <div>
                  <h4 className={`font-bold ${candidate.status !== 'PENDING' ? 'text-white' : 'text-slate-500'}`}>
                    Verification Run Triggered
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Recruiter triggered external identity registry search query.
                  </p>
                  {candidate.status !== 'PENDING' && (
                    <p className="text-[9px] text-slate-600 mt-1">
                      {candidate.verificationLogs.length > 0 &&
                        new Date(candidate.verificationLogs[0].verifiedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Point 3: Verification Check Results */}
              <div className="relative">
                <div
                  className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full font-bold text-xs ${
                    candidate.status !== 'PENDING'
                      ? candidate.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                        : candidate.status === 'PARTIAL'
                        ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                        : 'bg-red-500/20 border border-red-500 text-red-400'
                      : 'bg-slate-950 border border-slate-800 text-slate-600'
                  }`}
                >
                  {candidate.status !== 'PENDING' ? '✓' : '3'}
                </div>
                <div>
                  <h4 className={`font-bold ${candidate.status !== 'PENDING' ? 'text-white' : 'text-slate-500'}`}>
                    Identity Registries Search
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Matches evaluated on mock Aadhaar and PAN databases.
                  </p>
                  {candidate.status !== 'PENDING' && (
                    <div className="mt-2 space-y-1 bg-black/20 p-2 rounded-lg border border-slate-900/60 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Aadhaar Verification:</span>
                        <span
                          className={
                            candidate.verificationLogs.some(
                              (l) => l.verificationType === 'AADHAAR' && l.verificationStatus === 'VERIFIED'
                            )
                              ? 'text-emerald-400 font-semibold'
                              : 'text-red-400 font-semibold'
                          }
                        >
                          {candidate.verificationLogs.some(
                            (l) => l.verificationType === 'AADHAAR' && l.verificationStatus === 'VERIFIED'
                          )
                            ? 'MATCH'
                            : 'FAILED'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">PAN Verification:</span>
                        <span
                          className={
                            candidate.verificationLogs.some(
                              (l) => l.verificationType === 'PAN' && l.verificationStatus === 'VERIFIED'
                            )
                              ? 'text-emerald-400 font-semibold'
                              : 'text-red-400 font-semibold'
                          }
                        >
                          {candidate.verificationLogs.some(
                            (l) => l.verificationType === 'PAN' && l.verificationStatus === 'VERIFIED'
                          )
                            ? 'MATCH'
                            : 'FAILED'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Point 4: Report Generated */}
              <div className="relative">
                <div
                  className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full font-bold text-xs ${
                    candidate.status !== 'PENDING'
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border border-slate-800 text-slate-600'
                  }`}
                >
                  {candidate.status !== 'PENDING' ? '✓' : '4'}
                </div>
                <div>
                  <h4 className={`font-bold ${candidate.status !== 'PENDING' ? 'text-white' : 'text-slate-500'}`}>
                    Audit Report PDF Ready
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Official candidate report compiled and ready for PDF generation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
