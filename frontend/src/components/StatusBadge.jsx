import React from 'react';

const statusStyles = {
    done: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    running: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    pending: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    failed: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
};

export function StatusBadge({ status }) {
    const normalizedStatus = String(status || 'pending').toLowerCase();
    const className = statusStyles[normalizedStatus] || statusStyles.pending;

    return (
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${className}`}>
            {normalizedStatus === 'running' && (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                </svg>
            )}
            <span>{normalizedStatus}</span>
        </span>
    );
}

export default StatusBadge;