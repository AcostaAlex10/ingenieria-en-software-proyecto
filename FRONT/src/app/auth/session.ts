// Manejo de la sesion en el navegador.
// Guardamos el token JWT y los datos publicos del usuario en localStorage para
// que la sesion sobreviva a recargas de pagina. (localStorage es simple y
// suficiente para este TP; en produccion se evaluarian cookies httpOnly.)

export interface UsuarioSesion {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
}

const TOKEN_KEY = "sgso_token";
const USER_KEY = "sgso_usuario";

export function setSession(token: string, usuario: UsuarioSesion): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsuario(): UsuarioSesion | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioSesion;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Hay sesion si tenemos un token guardado.
export function isAuthenticated(): boolean {
  return getToken() !== null;
}
