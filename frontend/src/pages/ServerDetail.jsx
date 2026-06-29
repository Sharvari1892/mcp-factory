import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CodeBlock from '../components/CodeBlock';
import StatusBadge from '../components/StatusBadge';
import { downloadServer, getServer } from '../api/servers.api';

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

function extractToolCount(server) {
    if (!server) {
        return 'Unknown';
    }

    const candidates = [server.tool_count, server.toolCount, server.tools_generated, server.toolsGenerated, server.logs];

    for (const candidate of candidates) {
        if (typeof candidate === 'number') {
            return candidate;
        }

        if (typeof candidate === 'string') {
            const match = candidate.match(/\d+/);
            if (match) {
                return Number(match[0]);
            }
        }
    }

    return 'Unknown';
}

export function ServerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [server, setServer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadServer() {
            try {
                const data = await getServer(id);
                if (mounted) {
                    setServer(data);
                }
            } catch {
                if (mounted) {
                    setError('Server not found');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadServer();

        return () => {
            mounted = false;
        };
    }, [id]);

    const endpointUrl = useMemo(() => {
        if (!server?.id) {
            return '';
        }

        return `mcp.factory.dev/${server.id}`;
    }, [server]);

    const configSnippet = useMemo(() => {
        if (!server?.name || !endpointUrl) {
            return '';
        }

        return JSON.stringify(
            {
                mcpServers: {
                    [server.name]: {
                        url: endpointUrl
                    }
                }
            },
            null,
            2
        );
    }, [endpointUrl, server]);

    async function handleDownload() {
        try {
            setDownloading(true);
            const data = await downloadServer(id);
            window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
        } catch {
            alert('Download failed');
        } finally {
            setDownloading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-500" />
            </div>
        );
    }

    if (error || !server) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
                <p className="mb-4 text-lg font-semibold text-rose-300">{error || 'Server not found'}</p>
                <Link
                    to="/dashboard"
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 border-b border-slate-900 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
                    >
                        ← Back to Dashboard
                    </button>
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white">{server.name}</h1>
                        <p className="mt-2 text-sm text-slate-400">Generated MCP server detail view</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <StatusBadge status={server.status} />
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {downloading ? 'Opening...' : 'Download Server'}
                    </button>
                </div>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
                    <div className="mt-3">
                        <StatusBadge status={server.status} />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</p>
                    <p className="mt-3 text-base font-semibold text-white">{formatCreatedAt(server.created_at)}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tools generated</p>
                    <p className="mt-3 text-base font-semibold text-white">{extractToolCount(server)}</p>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-white">MCP endpoint</h2>
                    <CodeBlock code={endpointUrl} language="text" />
                </div>

                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-white">claude_desktop_config.json</h2>
                    <CodeBlock code={configSnippet} language="json" />
                </div>
            </section>
        </div>
    );
}

export default ServerDetail;