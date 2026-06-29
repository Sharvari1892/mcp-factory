import React, { useEffect, useRef } from 'react';

function formatTime(timestamp) {
    if (!timestamp) {
        return '--:--:--';
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return '--:--:--';
    }

    return date.toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export function LogViewer({ logs }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [logs]);

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-slate-950/40">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                    <p className="text-sm font-semibold text-white">Generation log</p>
                    <p className="text-xs text-slate-500">Live updates from the worker</p>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    terminal
                </div>
            </div>

            <div className="max-h-[26rem] overflow-y-auto bg-slate-950 px-4 py-4 font-mono text-sm text-emerald-300">
                {logs.length === 0 ? (
                    <p className="text-slate-500">Waiting for logs...</p>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log, index) => (
                            <div
                                key={`${log.timestamp || 'log'}-${index}`}
                                className="animate-[slideUp_240ms_ease-out] rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-2"
                            >
                                <div className="flex gap-3">
                                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M16.704 5.3a1 1 0 010 1.4l-7.2 7.2a1 1 0 01-1.4 0l-3.6-3.6a1 1 0 111.4-1.4l2.9 2.9 6.5-6.5a1 1 0 011.4 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                                            {formatTime(log.timestamp)}
                                        </div>
                                        <p className="break-words text-emerald-200">{log.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default LogViewer;