import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { generateServer, uploadSpec } from '../api/servers.api';
import { useAuth } from '../hooks/useAuth';
import useWebSocket from '../hooks/useWebSocket';
import LogViewer from '../components/LogViewer';

function getEndpointCountFromSpecText(text) {
    if (!text) {
        return null;
    }

    try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.paths && typeof parsed.paths === 'object') {
            return Object.keys(parsed.paths).length;
        }
    } catch {
        // fall through for YAML or invalid JSON
    }

    return null;
}

function StepIndicator({ step, current }) {
    const active = step === current;
    const completed = step < current;

    return (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${active ? 'border-indigo-500/40 bg-indigo-500/10' : completed ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/40'}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-indigo-500 text-white' : completed ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {step}
            </div>
            <div>
                <p className="text-sm font-semibold text-white">{step === 1 ? 'Upload' : step === 2 ? 'Configure' : 'Generate'}</p>
                <p className="text-xs text-slate-400">{step === 1 ? 'Name and upload spec' : step === 2 ? 'Review settings' : 'Watch logs live'}</p>
            </div>
        </div>
    );
}

function ProgressBar({ progress }) {
    return (
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
        </div>
    );
}

function LoadingSpinner() {
    return (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
    );
}

export function Generate() {
    const { loading: authLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [serverName, setServerName] = useState('');
    const [specFile, setSpecFile] = useState(null);
    const [specName, setSpecName] = useState('');
    const [specId, setSpecId] = useState('');
    const [jobId, setJobId] = useState('');
    const [serverId, setServerId] = useState('');
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [detectedEndpoints, setDetectedEndpoints] = useState(null);

    const { logs, status } = useWebSocket(jobId);

    const hasGenerationFailure = logs.some((log) =>
        String(log.message || '').toLowerCase().startsWith('job failed:')
    );

    useEffect(() => {
        if (!jobId) {
            return;
        }

        if (status === 'done') {
            setGenerating(false);
        }

        if (status === 'error') {
            setGenerating(false);
        }
    }, [jobId, status]);

    const progress = useMemo(() => {
        if (status === 'done') {
            return 100;
        }

        if (status === 'error' || hasGenerationFailure) {
            return Math.min(100, 20 + logs.length * 8);
        }

        if (step === 3) {
            const base = 20 + logs.length * 12;
            return Math.min(base, 95);
        }

        if (step === 2) {
            return 50;
        }

        return 15;
    }, [logs.length, status, step]);

    const handleFileChange = (file) => {
        setError(null);
        setSpecFile(file || null);

        if (file) {
            setSpecName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                const text = String(reader.result || '');
                setDetectedEndpoints(getEndpointCountFromSpecText(text));
            };
            reader.readAsText(file);
        } else {
            setDetectedEndpoints(null);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            handleFileChange(file);
        }
    };

    const handleNext = async () => {
        if (!serverName.trim() || !specFile) {
            setError('Provide a server name and spec file first.');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const data = await uploadSpec(specFile, serverName.trim());
            setSpecId(data.specId);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Spec upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleGenerate = async () => {
        if (!specId || !serverName.trim()) {
            setError('Missing spec or server name.');
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const data = await generateServer(specId, serverName.trim());
            setJobId(data.jobId);
            setServerId(data.serverId);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Server generation failed.');
            setGenerating(false);
        }
    };

    const renderContent = () => {
        if (step === 1) {
            return (
                <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/20">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="serverName">
                            Server name
                        </label>
                        <input
                            id="serverName"
                            type="text"
                            value={serverName}
                            onChange={(e) => setServerName(e.target.value)}
                            placeholder="my-mcp-server"
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500/50"
                        />
                    </div>

                    <div>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center transition hover:border-indigo-500/40 hover:bg-slate-950"
                        >
                            <input
                                type="file"
                                accept=".yaml,.yml,.json"
                                className="hidden"
                                id="specUpload"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            />
                            <label htmlFor="specUpload" className="cursor-pointer">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
                                    </svg>
                                </div>
                                <p className="text-lg font-semibold text-white">Drop your OpenAPI spec here</p>
                                <p className="mt-2 text-sm text-slate-400">or click to browse .yaml or .json files</p>
                            </label>

                            {specFile && (
                                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left">
                                    <p className="text-sm font-semibold text-white">{specFile.name}</p>
                                    <p className="text-xs text-slate-400">{Math.round(specFile.size / 1024)} KB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {uploading && <LoadingSpinner />}
                            Next
                        </button>
                    </div>
                </div>
            );
        }

        if (step === 2) {
            return (
                <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/20">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Server name</p>
                            <p className="mt-2 text-lg font-semibold text-white">{serverName}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Spec file</p>
                            <p className="mt-2 text-lg font-semibold text-white">{specName || specFile?.name || 'Unknown'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Detected endpoints</p>
                            <p className="mt-2 text-lg font-semibold text-white">{detectedEndpoints ?? 'Unknown'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Spec id</p>
                            <p className="mt-2 break-all text-sm font-mono text-slate-300">{specId}</p>
                        </div>
                    </div>

                    {error && <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}

                    <div className="flex items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {generating && <LoadingSpinner />}
                            Generate
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/20">
                <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-white">Generating server</p>
                            <p className="text-xs text-slate-400">Job {jobId || 'waiting...'}</p>
                        </div>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                            {status}
                        </span>
                    </div>
                    <ProgressBar progress={progress} />
                </div>

                <LogViewer logs={logs} />

                {status === 'done' && !hasGenerationFailure && (
                    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                        <p className="text-lg font-semibold text-emerald-200">Generation complete</p>
                        <p className="mt-1 text-sm text-emerald-100/80">Your server is ready for use.</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Link
                                to={`/servers/${serverId}`}
                                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                            >
                                View Server
                            </Link>
                        </div>
                    </div>
                )}

                {(status === 'error' || hasGenerationFailure) && (
                    <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5">
                        <p className="text-lg font-semibold text-rose-200">Generation failed</p>
                        <p className="mt-1 text-sm text-rose-100/80">Try generating again with the same spec or upload a different one.</p>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setJobId('');
                                    setServerId('');
                                    setStep(2);
                                }}
                                className="inline-flex items-center justify-center rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (authLoading) {
        return (
            <div className="min-h-[60vh] bg-slate-950 flex items-center justify-center text-slate-400">
                Loading...
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/80">Generate</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Create a new MCP server</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-400">
                        Upload a spec, review the detected endpoints, and watch the worker generate your server in real time.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <StepIndicator step={1} current={step} />
                    <StepIndicator step={2} current={step} />
                    <StepIndicator step={3} current={step} />
                </div>
            </section>

            {renderContent()}

            <div className="flex justify-between">
                <Link
                    to="/dashboard"
                    className="text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
                >
                    Back to dashboard
                </Link>
            </div>
        </div>
    );
}

export default Generate;