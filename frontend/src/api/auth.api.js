import api from './axios';

/**
 * Register a new user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{ accessToken: string }>}
 */
export async function register(email, password) {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
}

/**
 * Login an existing user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{ accessToken: string }>}
 */
export async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
}

/**
 * Refresh the access token using HTTP-only cookies
 * @returns {Promise<{ accessToken: string }>}
 */
export async function refresh() {
    const response = await api.post('/auth/refresh');
    return response.data;
}
