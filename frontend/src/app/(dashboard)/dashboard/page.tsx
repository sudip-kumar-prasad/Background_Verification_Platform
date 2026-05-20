'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Loader2,
  Calendar,
  Phone,
  Mail,
  User,
  CreditCard,
  MapPin,
  X,
} from 'lucide-react';
import API from '@/services/api';

const aadhaarRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const candidateSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  aadhaarNumber: z.string().regex(aadhaarRegex, 'Aadhaar must be exactly 12 digits'),
  panNumber: z.string().regex(panRegex, 'PAN must be format ABCDE1234F'),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  address: z.string().min(5, 'Address must be at least 5 characters'),
});

type CandidateForm = z.infer<typeof candidateSchema>;

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
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function DashboardPage() {
  // Candidate List State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 8, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Stats State
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    failed: 0,
    partial: 0,
    pending: 0,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Candidates
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/candidates', {
        params: {
          search,
          status: statusFilter,
          page,
          limit: 8,
        },
      });
      setCandidates(response.data.candidates);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  // Fetch Stats (We fetch all candidates once to calculate stats)
  const fetchStats = useCallback(async () => {
    try {
      const response = await API.get('/candidates', {
        params: { limit: 1000 }, // Get all
      });
      const all: Candidate[] = response.data.candidates;
      const computed = {
        total: all.length,
        verified: all.filter((c) => c.status === 'VERIFIED').length,
        failed: all.filter((c) => c.status === 'FAILED').length,
        partial: all.filter((c) => c.status === 'PARTIAL').length,
        pending: all.filter((c) => c.status === 'PENDING').length,
      };
      setStats(computed);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, candidates]); // Re-compute stats when candidates change

  // Create Candidate Form
  const {
    register: registerField,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
  });

  const onSubmit = async (data: CandidateForm) => {
    setIsSubmitting(true);
    setCreateError(null);
    try {
      await API.post('/candidates', data);
      setIsModalOpen(false);
      reset();
      fetchCandidates();
    } catch (error: any) {
      console.error(error);
      setCreateError(error.response?.data?.error || 'Failed to create candidate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            Partial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper Dashboard Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-slate-400">
            Monitor and run credential verification audits on candidates.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/15 hover:bg-blue-500 hover:shadow-blue-500/25 transition-all duration-200"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Candidate
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Total */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.total}</span>
            <span className="text-[10px] text-slate-500">Candidates</span>
          </div>
        </div>

        {/* Card 2: Verified */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified</span>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.verified}</span>
            <span className="text-[10px] text-slate-500">
              {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% success rate
            </span>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.pending}</span>
            <span className="text-[10px] text-slate-500">Awaiting checks</span>
          </div>
        </div>

        {/* Card 4: Partial */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Partial</span>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.partial}</span>
            <span className="text-[10px] text-slate-500">Partial verification</span>
          </div>
        </div>

        {/* Card 5: Failed */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed</span>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.failed}</span>
            <span className="text-[10px] text-slate-500">Flagged failed</span>
          </div>
        </div>
      </div>

      {/* Main Database Table Container */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 backdrop-blur-xl">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search candidate by name, email, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-900 bg-slate-950/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-900 bg-[#090d16] px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="FAILED">Failed</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Users className="h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-white">No candidates found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Try refining your search query or status filter, or create a new candidate.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-4">Candidate</th>
                  <th className="py-4 px-4">Contact Info</th>
                  <th className="py-4 px-4">IDs Masked</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Created On</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-950/20 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white text-sm">{candidate.fullName}</div>
                      <div className="text-[10px] text-slate-500">ID: {candidate.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-4 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-slate-500" />
                        <span>{candidate.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>{candidate.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 space-y-0.5">
                      <div>Aadhaar: <span className="font-mono text-slate-400">{candidate.aadhaarNumber}</span></div>
                      <div>PAN: <span className="font-mono text-slate-400">{candidate.panNumber}</span></div>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(candidate.status)}</td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-950/40 px-3 py-1.5 text-[11px] font-semibold text-white group-hover:border-blue-500/30 group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-all"
                      >
                        Details
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-slate-900 pt-4">
                <span className="text-[11px] text-slate-500">
                  Showing Page {meta.page} of {meta.totalPages} ({meta.total} candidates)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-900 bg-slate-950/40 px-3 py-1.5 text-xs text-white hover:border-slate-800 disabled:opacity-30 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                    disabled={page === meta.totalPages}
                    className="rounded-lg border border-slate-900 bg-slate-950/40 px-3 py-1.5 text-xs text-white hover:border-slate-800 disabled:opacity-30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Candidate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1223] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create Candidate Profile</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Candidate full name"
                    className={`w-full rounded-xl border bg-slate-950/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-blue-500 ${
                      errors.fullName ? 'border-red-500/50' : 'border-slate-900'
                    }`}
                    {...registerField('fullName')}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-[10px] text-red-400">{errors.fullName.message}</p>
                )}
              </div>

              {/* Grid Email / Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      className={`w-full rounded-xl border bg-slate-950/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-blue-500 ${
                        errors.email ? 'border-red-500/50' : 'border-slate-900'
                      }`}
                      {...registerField('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="9876543210"
                      className={`w-full rounded-xl border bg-slate-950/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-blue-500 ${
                        errors.phone ? 'border-red-500/50' : 'border-slate-900'
                      }`}
                      {...registerField('phone')}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Grid Aadhaar / PAN */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Aadhaar Number (12 Digits)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <CreditCard className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="123456789012"
                      className={`w-full rounded-xl border bg-slate-950/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-blue-500 ${
                        errors.aadhaarNumber ? 'border-red-500/50' : 'border-slate-900'
                      }`}
                      {...registerField('aadhaarNumber')}
                    />
                  </div>
                  {errors.aadhaarNumber && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.aadhaarNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    PAN Card Number
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <CreditCard className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      className={`w-full rounded-xl border bg-slate-950/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-blue-500 ${
                        errors.panNumber ? 'border-red-500/50' : 'border-slate-900'
                      }`}
                      {...registerField('panNumber')}
                    />
                  </div>
                  {errors.panNumber && (
                    <p className="mt-1 text-[10px] text-red-400">{errors.panNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type="date"
                    className={`w-full rounded-xl border bg-slate-950/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-blue-500 cursor-pointer ${
                      errors.dob ? 'border-red-500/50' : 'border-slate-900'
                    }`}
                    {...registerField('dob')}
                  />
                </div>
                {errors.dob && (
                  <p className="mt-1 text-[10px] text-red-400">{errors.dob.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Permanent Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-start pl-3 pt-3">
                    <MapPin className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Candidate permanent street address details..."
                    className={`w-full rounded-xl border bg-slate-950/50 py-2.5 pr-4 pl-9 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-blue-500 ${
                      errors.address ? 'border-red-500/50' : 'border-slate-900'
                    }`}
                    {...registerField('address')}
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-[10px] text-red-400">{errors.address.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  'Create Profile'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
