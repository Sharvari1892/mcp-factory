import axios from 'axios';

let accessToken = null;

export function setAccessToken(token) {
    accessToken = token;
}

export function getAccessToken() {
    return accessToken;
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true  // sends cookies — needed for refresh token
});

// Request interceptor — attach token to every request
api.interceptors.request.use(config => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// Response interceptor — catch 401, refresh token, retry
api.interceptors.response.use(
    response => response,  // success — pass through
    async error => {
        const original = error.config;

        // If 401 and not already retrying — attempt refresh
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            try {
                const res = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                const newToken = res.data.accessToken;
                setAccessToken(newToken);
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);  // retry the original request
            } catch {
                setAccessToken(null);
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
