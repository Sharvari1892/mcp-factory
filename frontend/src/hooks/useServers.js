import { useCallback, useEffect, useState } from 'react';
import { getServers } from '../api/servers.api';

export function useServers() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadServers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getServers();
            setServers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err);
            setServers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadServers();
    }, [loadServers]);

    return {
        servers,
        loading,
        error,
        refetch: loadServers
    };
}

export default useServers;