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

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch con reintentos. Los hostings gratuitos (ej. Render) "duermen" el backend
 * tras un rato de inactividad; la primera peticion lo despierta y puede fallar
 * con un error de red o un 502/503/504 mientras arranca (~50s). En vez de cortar
 * con "Failed to fetch", reintentamos hasta que el backend responde.
 */
async function fetchConReintentos(
  url: string,
  options: RequestInit,
  maxIntentos = 20,
  esperaMs = 3000
): Promise<Response> {
  let ultimoError: unknown = null;
  for (let i = 0; i < maxIntentos; i++) {
    try {
      const res = await fetch(url, options);
      // Backend arrancando: reintentar.
      if ((res.status === 502 || res.status === 503 || res.status === 504) && i < maxIntentos - 1) {
        await esperar(esperaMs);
        continue;
      }
      return res;
    } catch (e) {
      // Error de red (incluye el CORS del backend dormido): reintentar.
      ultimoError = e;
      if (i < maxIntentos - 1) await esperar(esperaMs);
    }
  }
  throw ultimoError ?? new Error("No se pudo conectar con el servidor");
}

/**
 * Llama a POST /auth/login. Si las credenciales son invalidas, el backend
 * responde con un status de error y un { error } que convertimos en Error.
 */
export async function login(email: string, contrasena: string): Promise<LoginResponse> {
  const res = await fetchConReintentos(`${API_URL}/auth/login`, {
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
 * Authorization: Bearer <token> y reintenta si el backend esta arrancando.
 * Si el backend responde 401 (token vencido o invalido), limpia la sesion.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetchConReintentos(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
  }
  return res;
}
