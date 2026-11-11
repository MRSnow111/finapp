import axios from 'axios';

// Все запросы идут через /api (proxy nginx в проде, vite proxy в dev)
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});
