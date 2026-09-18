import axios from "axios";
import { clearAccessToken, getAccessToken } from "../auth/tokenStorage.js";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";
    const isAuthAttempt =
      requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

    if (status === 401 && !isAuthAttempt) {
      clearAccessToken();
      const onLoginPage =
        window.location.pathname === "/login" || window.location.pathname === "/register";
      if (!onLoginPage) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}
