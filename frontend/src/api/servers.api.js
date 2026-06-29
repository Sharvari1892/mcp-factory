import api from './axios';

export async function getServers() {
    const response = await api.get('/servers');
    return response.data;
}

export async function getServer(id) {
    const response = await api.get(`/servers/${id}`);
    return response.data;
}

export async function generateServer(specId, serverName) {
    const response = await api.post('/servers/generate', {
        specId,
        serverName
    });

    return response.data;
}

export async function downloadServer(id) {
    const response = await api.get(`/servers/${id}/download`);
    return response.data;
}

export async function uploadSpec(file, name) {
    const formData = new FormData();
    formData.append('spec', file);
    formData.append('name', name);

    const response = await api.post('/specs', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    return response.data;
}