import { useEffect, useRef, useState } from 'react';

export function CodeBlock({ code, language }) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(code || '');
            setCopied(true);

            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = window.setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch {
            setCopied(false);
        }
    }

    const languageLabel = (language || 'text').toUpperCase();

    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-slate-950/30">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{languageLabel}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>

            <pre className="overflow-x-auto px-4 py-4 font-mono text-sm leading-6 text-emerald-300 whitespace-pre-wrap">
                <code className="block">
                    {code || ''}
                </code>
            </pre>
        </div>
    );
}

export default CodeBlock;