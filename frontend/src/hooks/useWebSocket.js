import { useState, useEffect, useRef } from 'react';

export function useWebSocket(jobId) {
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState('idle');
    const ws = useRef(null);

    useEffect(() => {
        if (!jobId) return;

        // Open WebSocket connection
        ws.current = new WebSocket(`ws://localhost:3000`);
        setStatus('connecting');

        ws.current.onopen = () => {
            setStatus('connected');
            // Subscribe to this job's log channel
            ws.current.send(JSON.stringify({
                type: 'subscribe',
                jobId
            }));
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'log') {
                setLogs(prev => [...prev, data]);
            }
            if (data.message === 'Job complete') {
                setStatus('done');
            }
        };

        ws.current.onerror = () => setStatus('error');
        ws.current.onclose = () => setStatus('closed');

        // Cleanup on unmount — close the connection
        return () => {
            ws.current?.close();
        };
    }, [jobId]);

    return { logs, status };
}
export default useWebSocket;
