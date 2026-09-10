const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

// Vercel can proxy the API from the same origin. The localhost default is limited to development.
export const API_BASE_URL = configuredApiUrl ?? (import.meta.env.DEV ? "http://localhost:3000" : "");
export const apiUrl = (path) => `${API_BASE_URL}${path}`;
