import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // Required so the browser sends HttpOnly cookies (access_token / refresh_token)
  // cross-origin and on every request automatically.
  withCredentials: true,
});

// No manual token injection needed — the browser automatically sends the
// HttpOnly access_token cookie on every request. Tokens are never readable
// by JavaScript, eliminating the XSS session-theft vector.
api.interceptors.request.use((config) => config);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to silently refresh using the HttpOnly refresh_token cookie
        await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        // Retry the original request — new access_token cookie is now set
        return api(originalRequest);
      } catch {
        // Refresh failed — force logout
        // Dispatch a custom event so AuthContext can clear its in-memory state
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
