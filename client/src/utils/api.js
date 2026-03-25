const API_URL = import.meta.env.VITE_SERVER_URL || '';

function getToken() {
  return localStorage.getItem('nexuschat-token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export async function register(username, email, password, avatar) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, avatar }),
  });
}

export async function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function guestLogin() {
  return request('/api/auth/guest-login', {
    method: 'POST',
  });
}

export async function getMe() {
  return request('/api/auth/me');
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/upload', {
    method: 'POST',
    body: formData,
  });
}

export function getFileUrl(path) {
  if (path?.startsWith('http')) return path;
  return `${API_URL}${path}`;
}


export async function fetchAdminUsers() {
  return request('/api/admin/users');
}

export async function deleteAdminUser(id) {
  return request(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
}
