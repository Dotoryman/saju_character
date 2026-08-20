import type { ResultViewModel } from "../shared/result";

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

export async function submitCharacterChangeRequest(input: { resultUrl: string; requestText: string }): Promise<{ ok: true; requestId: string }> {
  const response = await fetch("/api/character-change-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<{ ok: true; requestId: string }>(response);
}
