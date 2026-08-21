import type { ResultViewModel } from "../shared/result";
import { optimizeAdminImage } from "./imageUpload";

interface ApiError {
  error?: string;
}

export interface FeedResponse {
  items: ResultViewModel[];
  nextCursor: string | null;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & ApiError;
  if (!response.ok) throw new Error(data.error ?? "요청을 처리하지 못했습니다.");
  return data;
}

export async function createResult(input: { nickname: string; birthDate: string }): Promise<ResultViewModel> {
  const response = await fetch("/api/results", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<ResultViewModel>(response);
}

export async function fetchResult(publicId: string): Promise<ResultViewModel> {
  return readJson<ResultViewModel>(await fetch(`/api/results/${encodeURIComponent(publicId)}`));
}

export async function fetchFeed(cursor?: string): Promise<FeedResponse> {
  const query = new URLSearchParams({ limit: "12" });
  if (cursor) query.set("cursor", cursor);
  return readJson<FeedResponse>(await fetch(`/api/feed?${query}`));
}

export async function trackShare(publicId: string): Promise<void> {
  const response = await fetch(`/api/results/${encodeURIComponent(publicId)}/share`, { method: "POST" });
  if (!response.ok) throw new Error("공유 횟수를 기록하지 못했습니다.");
}

export interface SessionUser {
  username: string;
  nickname: string;
  role: "member" | "admin";
  forcePasswordChange: boolean;
}

export interface AdminSummary { users: number; openRequests: number; todayVisitors: number }
export interface AdminUserRow { id: number; username: string; nickname: string; role: string; status: string; created_at: string; last_login_at: string | null; saved_count: number }
export interface ChangeRequestRow { request_id: string; result_url: string | null; request_text: string; status: "pending" | "reviewed" | "completed" | "rejected"; admin_note: string | null; created_at: string; updated_at: string; requester_nickname: string | null; handler_nickname: string | null }
export interface AdminContentRow { cycleIndex: number; ganjiKr: string; theme: string; themeName: string; characterName: string; tagline: string; description: string; imageKey?: string; enabled: boolean; overridden: boolean }
export interface AdminArchetypeRow { cycleIndex: number; ganjiKr: string; animalName: string; description: string; imageKey: string; overridden: boolean }

export async function submitCharacterChangeRequest(input: { resultUrl: string; requestText: string }): Promise<{ ok: true; requestId: string }> {
  const response = await fetch("/api/character-change-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<{ ok: true; requestId: string }>(response);
}

export async function fetchSession(): Promise<SessionUser | null> {
  return (await readJson<{ user: SessionUser | null }>(await fetch("/api/auth/me"))).user;
}

export async function signup(input: { username: string; nickname: string; password: string; turnstileToken?: string }): Promise<SessionUser> {
  const response = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
  return (await readJson<{ user: SessionUser }>(response)).user;
}

export async function login(input: { username: string; password: string; turnstileToken?: string }): Promise<SessionUser> {
  const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
  return (await readJson<{ user: SessionUser }>(response)).user;
}

export async function logout(): Promise<void> {
  await readJson<{ ok: true }>(await fetch("/api/auth/logout", { method: "POST" }));
}

export async function fetchSavedResults(): Promise<ResultViewModel[]> {
  return (await readJson<{ items: ResultViewModel[] }>(await fetch("/api/me/results"))).items;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  await readJson(await fetch("/api/me/password", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }));
}

export async function trackTodayVisitor(): Promise<number> {
  return (await readJson<{ count: number }>(await fetch("/api/visitors/today", { method: "POST" }))).count;
}

export async function fetchAdminSummary(): Promise<AdminSummary> {
  return readJson<AdminSummary>(await fetch("/api/admin/summary"));
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  return (await readJson<{ items: AdminUserRow[] }>(await fetch("/api/admin/users"))).items;
}

export async function fetchAdminRequests(): Promise<ChangeRequestRow[]> {
  return (await readJson<{ items: ChangeRequestRow[] }>(await fetch("/api/admin/change-requests"))).items;
}

export async function updateAdminRequest(requestId: string, input: { status: ChangeRequestRow["status"]; adminNote: string }): Promise<void> {
  await readJson(await fetch(`/api/admin/change-requests/${encodeURIComponent(requestId)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }));
}

export async function fetchAdminContent(): Promise<AdminContentRow[]> {
  return (await readJson<{ items: AdminContentRow[] }>(await fetch("/api/admin/content"))).items;
}

export async function updateAdminContent(item: AdminContentRow): Promise<void> {
  await readJson(await fetch(`/api/admin/content/${item.cycleIndex}/${encodeURIComponent(item.theme)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(item) }));
}

export async function uploadAdminContentImage(item: AdminContentRow, file: File): Promise<string> {
  const optimized = await optimizeAdminImage(file, "character");
  const response = await fetch(`/api/admin/content/${item.cycleIndex}/${encodeURIComponent(item.theme)}/image`, { method: "PUT", headers: { "content-type": optimized.type }, body: optimized });
  return (await readJson<{ imageKey: string }>(response)).imageKey;
}

export async function fetchAdminArchetypes(): Promise<AdminArchetypeRow[]> {
  return (await readJson<{ items: AdminArchetypeRow[] }>(await fetch("/api/admin/archetypes"))).items;
}

export async function updateAdminArchetype(item: AdminArchetypeRow): Promise<void> {
  await readJson(await fetch(`/api/admin/archetypes/${item.cycleIndex}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(item) }));
}

export async function uploadAdminArchetypeImage(item: AdminArchetypeRow, file: File): Promise<string> {
  const optimized = await optimizeAdminImage(file, "animal");
  const response = await fetch(`/api/admin/archetypes/${item.cycleIndex}/image`, { method: "PUT", headers: { "content-type": optimized.type }, body: optimized });
  return (await readJson<{ imageKey: string }>(response)).imageKey;
}
