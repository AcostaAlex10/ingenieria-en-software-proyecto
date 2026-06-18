// Cliente minimo de la API REST del backend (sin librerias extra, usamos fetch).
import { getToken, clearSession, UsuarioSesion } from "./session";

// Base de la API. Se puede sobreescribir con la variable de entorno VITE_API_URL
// (ver FRONT/.env.example). Por defecto apunta al backend local.
const API_URL =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
  "http://localhost:3000/api";

export interface LoginResponse {
  token: string;
  usuario: UsuarioSesion;
}

/**
 * Llama a POST /auth/login. Si las credenciales son invalidas, el backend
 * responde con un status de error y un { error } que convertimos en Error.
 */
export async function login(email: string, contrasena: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contrasena }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "No se pudo iniciar sesion");
  }

  return res.json() as Promise<LoginResponse>;
}

/**
 * Wrapper de fetch para llamadas autenticadas: agrega automaticamente el header
 * Authorization: Bearer <token>. Si el backend responde 401 (token vencido o
 * invalido), limpia la sesion para forzar un nuevo login.
 * Lo usaran las pantallas que consumen la API protegida (RF01/RF02, etc.).
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
  }
  return res;
}
