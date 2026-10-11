export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    let message = "Something went wrong.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string") message = body.message;
    } catch {
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export interface AuthResponse {
  message: string;
  data: { id: string; username: string; email: string };
}

export async function apiSignup(username: string, email: string, password: string) {
  return request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function apiLogin(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiLogout() {
  return request<{ message: string }>("/api/auth/logout", { method: "POST" });
}

export async function apiGetMe() {
  return request<AuthResponse>("/api/auth/me");
}

export interface RoomResponse {
  message: string;
  data: { roomId: string; roomCode: string };
}

export async function apiCreateRoom() {
  return request<RoomResponse>("/api/rooms/create", { method: "POST" });
}

export async function apiJoinRoom(code: string) {
  return request<RoomResponse>("/api/rooms/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}
