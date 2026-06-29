import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useServers from '../hooks/useServers';
import StatusBadge from '../components/StatusBadge';

function formatCreatedAt(value) {
    if (!value) {
        return 'Unknown';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
}

function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 animate-pulse">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center">
                        <div className="h-4 w-40 rounded bg-slate-800"></div>
                        <div className="h-5 w-24 rounded-full bg-slate-800"></div>
                        <div className="h-4 w-16 rounded bg-slate-800"></div>
                        <div className="h-4 w-28 rounded bg-slate-800"></div>
                        <div className="h-9 w-20 rounded-xl bg-slate-800"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-800 bg-slate-950/80 text-slate-500">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 6v6l4 2m5 4A9 9 0 11.5 12a9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white">No servers yet</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
                Generate your first MCP server to see it appear here with status, metadata, and download actions.
            </p>
            <div className="mt-8">
                <Link
                    to="/generate"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                    Generate your first server
                </Link>
            </div>
        </div>
    );
}

export function Dashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { servers, loading, error } = useServers();

    const totals = useMemo(() => {
        const totalServers = servers.length;
        const activeServers = servers.filter(server => {
            const status = String(server.status || '').toLowerCase();
            return status === 'running' || status === 'done';
        }).length;

        return {
            totalServers,
            activeServers,
            totalApiCalls: 0
        };
    }, [servers]);

    const handleViewServer = (id) => {
        navigate(`/servers/${id}`);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="sticky top-0 z-40 border-b border-slate-900/80 bg-slate-950/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">MCP Factory</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/generate"
                            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
                        >
                            New server
                        </Link>
                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <section className="mb-8 space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
                    <p className="max-w-2xl text-sm text-slate-400">
                        Monitor generated servers, inspect statuses, and jump directly into downloads or details.
                    </p>
                </section>

                <section className="mb-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-slate-950/20">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total servers</p>
                        <p className="mt-3 text-3xl font-bold text-white">{totals.totalServers}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-slate-950/20">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Active servers</p>
                        <p className="mt-3 text-3xl font-bold text-white">{totals.activeServers}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-slate-950/20">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total API calls</p>
                        <p className="mt-3 text-3xl font-bold text-white">{totals.totalApiCalls}</p>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-2xl shadow-slate-950/20">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Servers</h2>
                            <p className="text-sm text-slate-400">Your generated MCP servers and their current state.</p>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingSkeleton />
                    ) : error ? (
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
                            Failed to load servers. Please refresh and try again.
                        </div>
                    ) : servers.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-3">
                            <div className="hidden rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center md:gap-4">
                                <span>Server name</span>
                                <span>Status</span>
                                <span>Tools</span>
                                <span>Created</span>
                                <span className="text-right">Action</span>
                            </div>

                            {servers.map((server) => {
                                const toolCount = server.tool_count ?? server.toolCount ?? 0;

                                return (
                                    <div
                                        key={server.id}
                                        className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4 transition hover:border-slate-700 hover:bg-slate-950/80"
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center">
                                            <div>
                                                <p className="font-semibold text-white">{server.name}</p>
                                                <p className="mt-1 text-xs text-slate-500 font-mono break-all">{server.id}</p>
                                            </div>

                                            <div>
                                                <StatusBadge status={server.status} />
                                            </div>

                                            <div className="text-sm text-slate-300">
                                                {toolCount} tools
                                            </div>

                                            <div className="text-sm text-slate-300">
                                                {formatCreatedAt(server.created_at)}
                                            </div>

                                            <div className="md:text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewServer(server.id)}
                                                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-500/40 hover:bg-indigo-500/10"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Dashboard;