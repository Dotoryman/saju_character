import { z } from "zod";
import { getArchetype } from "../src/data/archetypes";
import { getCharacterResults, THEMES } from "../src/data/characterMappings";
import { CHARACTER_IMAGE_SOURCES } from "../src/data/characterImageSources.generated";
import { ANIMAL_IMAGE_SOURCES } from "../src/data/animalImageSources.generated";
import { maskBirthDate, maskNickname } from "../src/domain/privacy/mask";
import { calculateDayPillar } from "../src/domain/saju/calculateDayPillar";
import type { ResultViewModel } from "../src/shared/result";
import {
  clearSessionCookie,
  constantTimeEqual,
  createSession,
  deleteSession,
  getAuthUser,
  hashPassword,
  isSameOrigin,
  sessionCookie,
  sha256,
  verifyPassword,
  type AuthUser,
} from "./auth";

type AppEnv = Env & {
  ADMIN_SETUP_TOKEN?: string;
  TURNSTILE_SECRET_KEY?: string;
};

const createResultSchema = z.object({
  nickname: z.string().trim().min(1, "닉네임을 입력해 주세요.").max(20, "닉네임은 20자 이하로 입력해 주세요."),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 생년월일을 입력해 주세요."),
});

const createChangeRequestSchema = z.object({
  resultUrl: z.string().trim().max(500, "결과 주소가 너무 깁니다.").optional().default(""),
  requestText: z.string().trim().min(5, "수정 요청 내용을 5자 이상 입력해 주세요.").max(1000, "수정 요청은 1000자 이하로 입력해 주세요."),
});

const credentialsSchema = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_]{4,20}$/, "아이디는 영문, 숫자, 밑줄 4~20자로 입력해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상 입력해 주세요.").max(72, "비밀번호는 72자 이하로 입력해 주세요."),
});

const signupSchema = credentialsSchema.extend({
  nickname: z.string().trim().min(1, "닉네임을 입력해 주세요.").max(20, "닉네임은 20자 이하로 입력해 주세요."),
  turnstileToken: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_]{4,20}$/, "아이디를 확인해 주세요."),
  password: z.string().min(5, "비밀번호를 확인해 주세요.").max(72),
  turnstileToken: z.string().optional(),
}).superRefine((input, context) => {
  if (input.username.toLowerCase() !== "dotoryman" && input.password.length < 8) {
    context.addIssue({ code: "custom", path: ["password"], message: "비밀번호는 8자 이상 입력해 주세요." });
  }
});
const bootstrapSchema = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_]{4,20}$/),
  nickname: z.string().trim().min(1).max(20),
  password: z.string().min(5).max(72),
});
const changePasswordSchema = z.object({
  currentPassword: z.string().min(5, "현재 비밀번호를 확인해 주세요.").max(72),
  newPassword: z.string().min(8, "새 비밀번호는 8자 이상 입력해 주세요.").max(72),
});

const updateRequestSchema = z.object({
  status: z.enum(["pending", "reviewed", "completed", "rejected"]),
  adminNote: z.string().trim().max(2000).optional().default(""),
});

const updateContentSchema = z.object({
  characterName: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(3000),
  enabled: z.boolean(),
});

const updateArchetypeSchema = z.object({
  animalName: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(3000),
});

interface ResultRow {
  public_id: string;
  nickname: string;
  birth_date: string;
  cycle_index: number;
  created_at: string;
}

interface UserCredentialRow {
  id: number;
  username: string;
  nickname: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  role: "member" | "admin";
  status: "active" | "disabled";
  force_password_change: number;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function withCookie(response: Response, cookie: string): Response {
  const headers = new Headers(response.headers);
  headers.append("set-cookie", cookie);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function publicUser(user: AuthUser) {
  return {
    username: user.username,
    nickname: user.nickname,
    role: user.role,
    forcePasswordChange: user.forcePasswordChange,
  };
}

async function requireUser(request: Request, env: AppEnv): Promise<AuthUser | Response> {
  const user = await getAuthUser(request, env.DB);
  return user ?? json({ error: "로그인이 필요합니다." }, { status: 401 });
}

async function requireAdmin(request: Request, env: AppEnv): Promise<AuthUser | Response> {
  const user = await getAuthUser(request, env.DB);
  if (!user) return json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (user.role !== "admin") return json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  return user;
}

async function verifyTurnstile(token: string | undefined, request: Request, env: AppEnv): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  if (!response.ok) return false;
  const result = await response.json<{ success?: boolean }>();
  return result.success === true;
}

async function allowAuthAttempt(action: "login" | "signup", request: Request, env: AppEnv): Promise<boolean> {
  const client = request.headers.get("CF-Connecting-IP") ?? request.headers.get("user-agent") ?? "unknown";
  const clientHash = await sha256(client);
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / 900_000) * 900_000).toISOString();
  await env.DB.prepare(
    `INSERT INTO auth_attempts (action, client_hash, window_start, attempts) VALUES (?, ?, ?, 1)
     ON CONFLICT(action, client_hash, window_start) DO UPDATE SET attempts = attempts + 1`,
  ).bind(action, clientHash, windowStart).run();
  const row = await env.DB.prepare(
    "SELECT attempts FROM auth_attempts WHERE action = ? AND client_hash = ? AND window_start = ?",
  ).bind(action, clientHash, windowStart).first<{ attempts: number }>();
  return (row?.attempts ?? 1) <= (action === "login" ? 12 : 5);
}

async function audit(env: AppEnv, adminId: number, action: string, targetType: string, targetId: string, detail?: string) {
  await env.DB.prepare(
    "INSERT INTO admin_audit_logs (admin_user_id, action, target_type, target_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(adminId, action, targetType, targetId, detail ?? null, new Date().toISOString()).run();
}

async function getCharacterImage(pathname: string, env: Env): Promise<Response> {
  const match = /^\/media\/characters\/([^/]+)\/([^/]+)$/.exec(pathname);
  if (!match?.[1] || !match[2]) return new Response("Not found", { status: 404 });

  const theme = decodeURIComponent(match[1]);
  const characterName = decodeURIComponent(match[2]);
  const mappingKey = `${theme}|${characterName}`;
  const sourceUrl = CHARACTER_IMAGE_SOURCES[mappingKey];
  if (!sourceUrl) return new Response("Not found", { status: 404 });

  const objectKey = `characters/${theme}/${characterName}.jpg`;
  const cached = await env.ASSETS_BUCKET.get(objectKey);
  if (cached) {
    const headers = new Headers();
    cached.writeHttpMetadata(headers);
    headers.set("cache-control", "public, max-age=2592000, immutable");
    headers.set("x-content-type-options", "nosniff");
    return new Response(cached.body, { headers });
  }

  const upstream = await fetch(sourceUrl, { headers: { accept: "image/avif,image/webp,image/*" } });
  if (!upstream.ok) return new Response("Image unavailable", { status: 502 });
  const bytes = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  await env.ASSETS_BUCKET.put(objectKey, bytes, {
    httpMetadata: { contentType },
    customMetadata: { source: "AniList", sourceUrl },
  });
  return new Response(bytes, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=2592000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}

async function getAnimalImage(pathname: string, env: Env): Promise<Response> {
  const match = /^\/media\/animals\/([^/]+)$/.exec(pathname);
  if (!match?.[1]) return new Response("Not found", { status: 404 });

  const animalName = decodeURIComponent(match[1]);
  const sourceUrl = ANIMAL_IMAGE_SOURCES[animalName];
  if (!sourceUrl) return new Response("Not found", { status: 404 });

  const objectKey = `animals/${animalName}.jpg`;
  const cached = await env.ASSETS_BUCKET.get(objectKey);
  if (cached) {
    const headers = new Headers();
    cached.writeHttpMetadata(headers);
    headers.set("cache-control", "public, max-age=2592000, immutable");
    headers.set("x-content-type-options", "nosniff");
    return new Response(cached.body, { headers });
  }

  const upstream = await fetch(sourceUrl, {
    headers: {
      accept: "image/avif,image/webp,image/*",
      "user-agent": "SAJUSAJU/0.4.2 (https://sajusaju.cloud)",
    },
  });
  if (!upstream.ok) return new Response("Image unavailable", { status: 502 });
  const bytes = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  await env.ASSETS_BUCKET.put(objectKey, bytes, {
    httpMetadata: { contentType },
    customMetadata: { source: "Wikipedia/Wikimedia", sourceUrl },
  });
  return new Response(bytes, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=2592000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}

interface ContentOverrideRow {
  theme_slug: string;
  character_name: string | null;
  tagline: string | null;
  description: string | null;
  image_key: string | null;
  enabled: number;
}

async function getUploadedImage(pathname: string, env: AppEnv): Promise<Response> {
  const encodedKey = pathname.slice("/media/uploads/".length);
  if (!encodedKey || encodedKey.includes("..")) return new Response("Not found", { status: 404 });
  const object = await env.ASSETS_BUCKET.get(`uploads/${decodeURIComponent(encodedKey)}`);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=2592000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}

async function getManagedCharacters(cycleIndex: number, env: AppEnv) {
  const base = getCharacterResults(cycleIndex);
  const { results } = await env.DB.prepare(
    "SELECT theme_slug, character_name, tagline, description, image_key, enabled FROM content_overrides WHERE cycle_index = ?",
  ).bind(cycleIndex).all<ContentOverrideRow>();
  const overrides = new Map(results.map((item) => [item.theme_slug, item]));
  return base.flatMap((character) => {
    const override = overrides.get(character.theme);
    if (override?.enabled === 0) return [];
    if (!override) return [character];
    return [{
      ...character,
      characterName: override.character_name || character.characterName,
      tagline: override.tagline || character.tagline,
      description: override.description || character.description,
      imageKey: override.image_key || character.imageKey,
    }];
  });
}

async function toViewModel(row: ResultRow, env: AppEnv): Promise<ResultViewModel> {
  const archetype = getArchetype(row.cycle_index);
  const override = await env.DB.prepare(
    "SELECT animal_name, description, image_key FROM archetype_overrides WHERE cycle_index = ?",
  ).bind(row.cycle_index).first<{ animal_name: string | null; description: string | null; image_key: string | null }>();
  const animalName = override?.animal_name || archetype.animalName;
  return {
    resultId: row.public_id,
    ganji: archetype.ganji,
    ganjiKr: archetype.ganjiKr,
    element: archetype.element,
    archetype: {
      name: archetype.archetypeName,
      animal: animalName,
      description: override?.description || archetype.description,
      imageKey: override?.image_key || `/media/animals/${encodeURIComponent(animalName)}`,
    },
    characters: await getManagedCharacters(row.cycle_index, env),
    user: {
      displayNickname: maskNickname(row.nickname),
      displayBirthDate: maskBirthDate(row.birth_date),
    },
    createdAt: row.created_at,
  };
}

async function createResult(request: Request, env: Env): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = createResultSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.birthDate > today || parsed.data.birthDate < "1900-01-01") {
    return json({ error: "1900년 이후의 올바른 생년월일을 입력해 주세요." }, { status: 400 });
  }

  let pillar;
  try {
    pillar = calculateDayPillar(parsed.data.birthDate);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "날짜 계산에 실패했습니다." }, { status: 400 });
  }

  const publicId = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  const createdAt = new Date().toISOString();

  const authUser = await getAuthUser(request, env.DB);
  const shouldSave = authUser ? 1 : 0;
  await env.DB.prepare(
    `INSERT INTO results (public_id, nickname, birth_date, cycle_index, is_public, created_at, updated_at, user_id, is_saved, profile_label)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
  )
    .bind(publicId, parsed.data.nickname, parsed.data.birthDate, pillar.cycleIndex, createdAt, createdAt, authUser?.id ?? null, shouldSave, authUser ? parsed.data.nickname : null)
    .run();

  return json(
    await toViewModel({
      public_id: publicId,
      nickname: parsed.data.nickname,
      birth_date: parsed.data.birthDate,
      cycle_index: pillar.cycleIndex,
      created_at: createdAt,
    }, env),
    { status: 201 },
  );
}

async function createCharacterChangeRequest(request: Request, env: Env): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = createChangeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  }

  if (parsed.data.resultUrl && !/^https?:\/\//i.test(parsed.data.resultUrl)) {
    return json({ error: "결과 주소는 http:// 또는 https://로 시작해야 합니다." }, { status: 400 });
  }

  const requestId = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  const createdAt = new Date().toISOString();
  const authUser = await getAuthUser(request, env.DB);
  await env.DB.prepare(
    `INSERT INTO character_change_requests (request_id, result_url, request_text, status, created_at, updated_at, user_id)
     VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
  )
    .bind(requestId, parsed.data.resultUrl || null, parsed.data.requestText, createdAt, createdAt, authUser?.id ?? null)
    .run();

  return json({ ok: true, requestId }, { status: 201 });
}

async function getResult(publicId: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT public_id, nickname, birth_date, cycle_index, created_at
     FROM results WHERE public_id = ? AND is_public = 1 LIMIT 1`,
  )
    .bind(publicId)
    .first<ResultRow>();

  if (!row) return json({ error: "결과를 찾을 수 없습니다." }, { status: 404 });

  await env.DB.prepare("UPDATE results SET view_count = view_count + 1 WHERE public_id = ?")
    .bind(publicId)
    .run();
  return json(await toViewModel(row, env));
}

async function getResultPage(request: Request, publicId: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT public_id, nickname, birth_date, cycle_index, created_at
     FROM results WHERE public_id = ? AND is_public = 1 LIMIT 1`,
  )
    .bind(publicId)
    .first<ResultRow>();

  const assetRequest = new Request(new URL("/", request.url), request);
  const page = await env.ASSETS.fetch(assetRequest);
  if (!row || !page.ok) return page;

  const result = await toViewModel(row, env);
  const title = `${result.ganjiKr}일주 · ${result.archetype.animal} | SAJUSAJU`;
  const description = `${result.archetype.name}. 네 작품 속 닮은 캐릭터를 확인해 보세요.`;
  const image = new URL(result.archetype.imageKey ?? "/assets/brand/og-preview.jpg", request.url).href;
  const canonicalUrl = new URL(request.url).href;

  const rewriter = new HTMLRewriter()
    .on("title", { element(element) { element.setInnerContent(title); } })
    .on('meta[name="description"]', { element(element) { element.setAttribute("content", description); } })
    .on('meta[property="og:title"]', { element(element) { element.setAttribute("content", title); } })
    .on('meta[property="og:description"]', { element(element) { element.setAttribute("content", description); } })
    .on('meta[property="og:url"]', { element(element) { element.setAttribute("content", canonicalUrl); } })
    .on('meta[property="og:image"]', { element(element) { element.setAttribute("content", image); } })
    .on('meta[property="og:image:alt"]', { element(element) { element.setAttribute("content", `${result.ganjiKr}일주 대표 동물 ${result.archetype.animal}`); } })
    .on('meta[name="twitter:title"]', { element(element) { element.setAttribute("content", title); } })
    .on('meta[name="twitter:description"]', { element(element) { element.setAttribute("content", description); } })
    .on('meta[name="twitter:image"]', { element(element) { element.setAttribute("content", image); } });

  const headers = new Headers(page.headers);
  headers.set("cache-control", "public, max-age=300");
  return rewriter.transform(new Response(page.body, { status: page.status, headers }));
}

async function getFeed(url: URL, env: Env): Promise<Response> {
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 12, 1), 20);
  const cursor = url.searchParams.get("cursor");
  const query = cursor
    ? `SELECT public_id, nickname, birth_date, cycle_index, created_at FROM results
       WHERE is_public = 1 AND created_at < ? ORDER BY created_at DESC LIMIT ?`
    : `SELECT public_id, nickname, birth_date, cycle_index, created_at FROM results
       WHERE is_public = 1 ORDER BY created_at DESC LIMIT ?`;
  const statement = cursor
    ? env.DB.prepare(query).bind(cursor, limit + 1)
    : env.DB.prepare(query).bind(limit + 1);
  const { results } = await statement.all<ResultRow>();
  const hasNext = results.length > limit;
  const page = results.slice(0, limit);

  return json({
    items: await Promise.all(page.map((row) => toViewModel(row, env))),
    nextCursor: hasNext ? page.at(-1)?.created_at ?? null : null,
  });
}

async function signup(request: Request, env: AppEnv): Promise<Response> {
  if (!await allowAuthAttempt("signup", request, env)) return json({ error: "가입 시도가 너무 많습니다. 15분 후 다시 시도해 주세요." }, { status: 429 });
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  if (!await verifyTurnstile(parsed.data.turnstileToken, request, env)) {
    return json({ error: "사람인지 확인하지 못했습니다. 다시 시도해 주세요." }, { status: 400 });
  }
  const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ? LIMIT 1").bind(parsed.data.username).first();
  if (exists) return json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
  const password = await hashPassword(parsed.data.password);
  const now = new Date().toISOString();
  const inserted = await env.DB.prepare(
    `INSERT INTO users (username, nickname, password_hash, password_salt, password_iterations, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'member', 'active', ?, ?)`,
  ).bind(parsed.data.username, parsed.data.nickname, password.hash, password.salt, password.iterations, now, now).run();
  const userId = Number(inserted.meta.last_row_id);
  const session = await createSession(env.DB, userId);
  return withCookie(json({ user: { username: parsed.data.username, nickname: parsed.data.nickname, role: "member", forcePasswordChange: false } }, { status: 201 }), sessionCookie(session.token, session.expiresAt));
}

async function login(request: Request, env: AppEnv): Promise<Response> {
  if (!await allowAuthAttempt("login", request, env)) return json({ error: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요." }, { status: 429 });
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  if (!await verifyTurnstile(parsed.data.turnstileToken, request, env)) {
    return json({ error: "사람인지 확인하지 못했습니다. 다시 시도해 주세요." }, { status: 400 });
  }
  const row = await env.DB.prepare(
    `SELECT id, username, nickname, password_hash, password_salt, password_iterations, role, status, force_password_change
     FROM users WHERE username = ? LIMIT 1`,
  ).bind(parsed.data.username).first<UserCredentialRow>();
  const valid = row && await verifyPassword(parsed.data.password, row.password_hash, row.password_salt, row.password_iterations);
  if (!valid || row.status !== "active") return json({ error: "아이디 또는 비밀번호를 확인해 주세요." }, { status: 401 });
  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?").bind(now, now, row.id).run();
  const session = await createSession(env.DB, row.id);
  const user: AuthUser = {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    role: row.role,
    status: row.status,
    forcePasswordChange: row.force_password_change === 1,
  };
  return withCookie(json({ user: publicUser(user) }), sessionCookie(session.token, session.expiresAt));
}

async function bootstrapAdmin(request: Request, env: AppEnv): Promise<Response> {
  const token = request.headers.get("x-admin-setup-token");
  if (!env.ADMIN_SETUP_TOKEN || !token || !constantTimeEqual(await sha256(token), await sha256(env.ADMIN_SETUP_TOKEN))) {
    return json({ error: "초기 관리자 등록 권한이 없습니다." }, { status: 403 });
  }
  const parsed = bootstrapSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const password = await hashPassword(parsed.data.password);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO users (username, nickname, password_hash, password_salt, password_iterations, role, status, force_password_change, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'admin', 'active', 1, ?, ?)
     ON CONFLICT(username) DO UPDATE SET nickname = excluded.nickname, password_hash = excluded.password_hash,
       password_salt = excluded.password_salt, password_iterations = excluded.password_iterations,
       role = 'admin', status = 'active', force_password_change = 1, updated_at = excluded.updated_at`,
  ).bind(parsed.data.username, parsed.data.nickname, password.hash, password.salt, password.iterations, now, now).run();
  return json({ ok: true }, { status: 201 });
}

async function trackVisitor(request: Request, env: AppEnv): Promise<Response> {
  const cookie = request.headers.get("cookie") ?? "";
  const existing = /(?:^|;\s*)saju_visitor=([^;]+)/.exec(cookie)?.[1];
  const visitorId = existing ? decodeURIComponent(existing) : crypto.randomUUID();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const createdAt = new Date().toISOString();
  await env.DB.prepare("INSERT OR IGNORE INTO daily_visitors (visit_date, visitor_hash, created_at) VALUES (?, ?, ?)")
    .bind(date, await sha256(visitorId), createdAt).run();
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM daily_visitors WHERE visit_date = ?").bind(date).first<{ count: number }>();
  const response = json({ count: count?.count ?? 0 });
  if (existing) return response;
  return withCookie(response, `saju_visitor=${encodeURIComponent(visitorId)}; Path=/; Secure; SameSite=Lax; Max-Age=31536000`);
}

async function getSavedResults(request: Request, env: AppEnv): Promise<Response> {
  const auth = await requireUser(request, env);
  if (auth instanceof Response) return auth;
  const { results } = await env.DB.prepare(
    "SELECT public_id, nickname, birth_date, cycle_index, created_at FROM results WHERE user_id = ? AND is_saved = 1 ORDER BY created_at DESC LIMIT 50",
  ).bind(auth.id).all<ResultRow>();
  return json({ items: await Promise.all(results.map((row) => toViewModel(row, env))) });
}

async function changePassword(request: Request, env: AppEnv): Promise<Response> {
  const auth = await requireUser(request, env);
  if (auth instanceof Response) return auth;
  const parsed = changePasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const row = await env.DB.prepare(
    "SELECT password_hash, password_salt, password_iterations FROM users WHERE id = ?",
  ).bind(auth.id).first<{ password_hash: string; password_salt: string; password_iterations: number }>();
  if (!row || !await verifyPassword(parsed.data.currentPassword, row.password_hash, row.password_salt, row.password_iterations)) {
    return json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  const password = await hashPassword(parsed.data.newPassword);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, force_password_change = 0, updated_at = ? WHERE id = ?")
      .bind(password.hash, password.salt, password.iterations, now, auth.id),
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(auth.id),
  ]);
  return withCookie(json({ ok: true }), clearSessionCookie());
}

async function adminSummary(request: Request, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [users, requests, visitors] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS count FROM users"),
    env.DB.prepare("SELECT COUNT(*) AS count FROM character_change_requests WHERE status IN ('pending', 'reviewed')"),
    env.DB.prepare("SELECT COUNT(*) AS count FROM daily_visitors WHERE visit_date = ?").bind(today),
  ]);
  return json({
    users: (users?.results[0] as { count: number } | undefined)?.count ?? 0,
    openRequests: (requests?.results[0] as { count: number } | undefined)?.count ?? 0,
    todayVisitors: (visitors?.results[0] as { count: number } | undefined)?.count ?? 0,
  });
}

async function adminUsers(request: Request, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.username, u.nickname, u.role, u.status, u.created_at, u.last_login_at,
      COUNT(r.id) AS saved_count FROM users u LEFT JOIN results r ON r.user_id = u.id AND r.is_saved = 1
      GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200`,
  ).all();
  return json({ items: results });
}

async function adminRequests(request: Request, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const { results } = await env.DB.prepare(
    `SELECT c.request_id, c.result_url, c.request_text, c.status, c.admin_note, c.created_at, c.updated_at,
      u.nickname AS requester_nickname, a.nickname AS handler_nickname
     FROM character_change_requests c
     LEFT JOIN users u ON u.id = c.user_id LEFT JOIN users a ON a.id = c.handled_by
     ORDER BY CASE c.status WHEN 'pending' THEN 0 WHEN 'reviewed' THEN 1 ELSE 2 END, c.created_at DESC LIMIT 300`,
  ).all();
  return json({ items: results });
}

async function updateAdminRequest(request: Request, requestId: string, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const parsed = updateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const now = new Date().toISOString();
  const update = await env.DB.prepare(
    "UPDATE character_change_requests SET status = ?, admin_note = ?, handled_by = ?, handled_at = ?, updated_at = ? WHERE request_id = ?",
  ).bind(parsed.data.status, parsed.data.adminNote || null, admin.id, now, now, requestId).run();
  if (!update.meta.changes) return json({ error: "수정 요청을 찾을 수 없습니다." }, { status: 404 });
  await audit(env, admin.id, "update", "change_request", requestId, parsed.data.status);
  return json({ ok: true });
}

async function adminContent(request: Request, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const { results } = await env.DB.prepare(
    "SELECT cycle_index, theme_slug, character_name, tagline, description, image_key, enabled FROM content_overrides",
  ).all<ContentOverrideRow & { cycle_index: number }>();
  const overrides = new Map(results.map((item) => [`${item.cycle_index}|${item.theme_slug}`, item]));
  const items = Array.from({ length: 60 }, (_, cycleIndex) => getCharacterResults(cycleIndex).map((base) => {
    const override = overrides.get(`${cycleIndex}|${base.theme}`);
    return {
      cycleIndex,
      ganjiKr: getArchetype(cycleIndex).ganjiKr,
      theme: base.theme,
      themeName: base.themeName,
      characterName: override?.character_name || base.characterName,
      tagline: override?.tagline || base.tagline,
      description: override?.description || base.description,
      imageKey: override?.image_key || base.imageKey,
      enabled: override ? override.enabled === 1 : true,
      overridden: Boolean(override),
    };
  })).flat();
  return json({ items });
}

async function updateAdminContent(request: Request, cycleIndex: number, themeSlug: string, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  if (!Number.isInteger(cycleIndex) || cycleIndex < 0 || cycleIndex > 59 || !THEMES.some((theme) => theme.slug === themeSlug)) {
    return json({ error: "캐릭터 위치가 올바르지 않습니다." }, { status: 400 });
  }
  const parsed = updateContentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO content_overrides (cycle_index, theme_slug, character_name, tagline, description, enabled, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(cycle_index, theme_slug) DO UPDATE SET character_name = excluded.character_name,
       tagline = excluded.tagline, description = excluded.description, enabled = excluded.enabled,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
  ).bind(cycleIndex, themeSlug, parsed.data.characterName, parsed.data.tagline, parsed.data.description, parsed.data.enabled ? 1 : 0, admin.id, now).run();
  await audit(env, admin.id, "update", "character", `${cycleIndex}|${themeSlug}`, parsed.data.characterName);
  return json({ ok: true });
}

async function uploadAdminImage(request: Request, cycleIndex: number, themeSlug: string, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const contentType = request.headers.get("content-type") ?? "";
  if (!request.body || !contentType.startsWith("image/") || contentLength < 1 || contentLength > 5_000_000) {
    return json({ error: "5MB 이하의 이미지 파일을 선택해 주세요." }, { status: 400 });
  }
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const objectKey = `uploads/characters/${cycleIndex}/${themeSlug}-${crypto.randomUUID()}.${extension}`;
  await env.ASSETS_BUCKET.put(objectKey, request.body, { httpMetadata: { contentType } });
  const imageKey = `/media/uploads/${objectKey.slice("uploads/".length)}`;
  const now = new Date().toISOString();
  const base = getCharacterResults(cycleIndex).find((item) => item.theme === themeSlug);
  if (!base) return json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 });
  await env.DB.prepare(
    `INSERT INTO content_overrides (cycle_index, theme_slug, character_name, tagline, description, image_key, enabled, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(cycle_index, theme_slug) DO UPDATE SET image_key = excluded.image_key, enabled = 1,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
  ).bind(cycleIndex, themeSlug, base.characterName, base.tagline, base.description, imageKey, admin.id, now).run();
  await audit(env, admin.id, "upload", "character_image", `${cycleIndex}|${themeSlug}`, objectKey);
  return json({ ok: true, imageKey });
}

async function adminArchetypes(request: Request, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const { results } = await env.DB.prepare(
    "SELECT cycle_index, animal_name, description, image_key FROM archetype_overrides",
  ).all<{ cycle_index: number; animal_name: string | null; description: string | null; image_key: string | null }>();
  const overrides = new Map(results.map((item) => [item.cycle_index, item]));
  const items = Array.from({ length: 60 }, (_, cycleIndex) => {
    const base = getArchetype(cycleIndex);
    const override = overrides.get(cycleIndex);
    const animalName = override?.animal_name || base.animalName;
    return {
      cycleIndex,
      ganjiKr: base.ganjiKr,
      animalName,
      description: override?.description || base.description,
      imageKey: override?.image_key || `/media/animals/${encodeURIComponent(animalName)}`,
      overridden: Boolean(override),
    };
  });
  return json({ items });
}

async function updateAdminArchetype(request: Request, cycleIndex: number, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  if (!Number.isInteger(cycleIndex) || cycleIndex < 0 || cycleIndex > 59) return json({ error: "일주가 올바르지 않습니다." }, { status: 400 });
  const parsed = updateArchetypeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO archetype_overrides (cycle_index, animal_name, description, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(cycle_index) DO UPDATE SET animal_name = excluded.animal_name, description = excluded.description,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
  ).bind(cycleIndex, parsed.data.animalName, parsed.data.description, admin.id, now).run();
  await audit(env, admin.id, "update", "archetype", String(cycleIndex), parsed.data.animalName);
  return json({ ok: true });
}

async function uploadAdminArchetypeImage(request: Request, cycleIndex: number, env: AppEnv): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const contentType = request.headers.get("content-type") ?? "";
  if (!request.body || !contentType.startsWith("image/") || contentLength < 1 || contentLength > 5_000_000) return json({ error: "5MB 이하의 이미지 파일을 선택해 주세요." }, { status: 400 });
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const objectKey = `uploads/animals/${cycleIndex}-${crypto.randomUUID()}.${extension}`;
  await env.ASSETS_BUCKET.put(objectKey, request.body, { httpMetadata: { contentType } });
  const imageKey = `/media/uploads/${objectKey.slice("uploads/".length)}`;
  const base = getArchetype(cycleIndex);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO archetype_overrides (cycle_index, animal_name, description, image_key, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(cycle_index) DO UPDATE SET image_key = excluded.image_key, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
  ).bind(cycleIndex, base.animalName, base.description, imageKey, admin.id, now).run();
  await audit(env, admin.id, "upload", "archetype_image", String(cycleIndex), objectKey);
  return json({ ok: true, imageKey });
}

async function route(request: Request, env: AppEnv): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.startsWith("/media/characters/") && request.method === "GET") {
    return getCharacterImage(pathname, env);
  }
  if (pathname.startsWith("/media/animals/") && request.method === "GET") {
    return getAnimalImage(pathname, env);
  }
  if (pathname.startsWith("/media/uploads/") && request.method === "GET") {
    return getUploadedImage(pathname, env);
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !isSameOrigin(request)) {
    return json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const resultPageMatch = /^\/result\/([A-Za-z0-9]+)$/.exec(pathname);
  if (resultPageMatch?.[1] && request.method === "GET") {
    return getResultPage(request, resultPageMatch[1], env);
  }

  if (pathname === "/api/health" && request.method === "GET") {
    return json({ ok: true, environment: env.ENVIRONMENT });
  }
  if (pathname === "/api/auth/signup" && request.method === "POST") return signup(request, env);
  if (pathname === "/api/auth/login" && request.method === "POST") return login(request, env);
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    await deleteSession(request, env.DB);
    return withCookie(json({ ok: true }), clearSessionCookie());
  }
  if (pathname === "/api/auth/me" && request.method === "GET") {
    const user = await getAuthUser(request, env.DB);
    return json({ user: user ? publicUser(user) : null });
  }
  if (pathname === "/api/admin/bootstrap" && request.method === "POST") return bootstrapAdmin(request, env);
  if (pathname === "/api/visitors/today" && (request.method === "GET" || request.method === "POST")) return trackVisitor(request, env);
  if (pathname === "/api/me/results" && request.method === "GET") return getSavedResults(request, env);
  if (pathname === "/api/me/password" && request.method === "PATCH") return changePassword(request, env);
  if (pathname === "/api/admin/summary" && request.method === "GET") return adminSummary(request, env);
  if (pathname === "/api/admin/users" && request.method === "GET") return adminUsers(request, env);
  if (pathname === "/api/admin/change-requests" && request.method === "GET") return adminRequests(request, env);
  if (pathname === "/api/admin/content" && request.method === "GET") return adminContent(request, env);
  if (pathname === "/api/admin/archetypes" && request.method === "GET") return adminArchetypes(request, env);
  const adminRequestMatch = /^\/api\/admin\/change-requests\/([A-Za-z0-9]+)$/.exec(pathname);
  if (adminRequestMatch?.[1] && request.method === "PATCH") return updateAdminRequest(request, adminRequestMatch[1], env);
  const adminContentMatch = /^\/api\/admin\/content\/(\d+)\/([a-z-]+)$/.exec(pathname);
  if (adminContentMatch?.[1] && adminContentMatch[2] && request.method === "PATCH") {
    return updateAdminContent(request, Number(adminContentMatch[1]), adminContentMatch[2], env);
  }
  const adminImageMatch = /^\/api\/admin\/content\/(\d+)\/([a-z-]+)\/image$/.exec(pathname);
  if (adminImageMatch?.[1] && adminImageMatch[2] && request.method === "PUT") {
    return uploadAdminImage(request, Number(adminImageMatch[1]), adminImageMatch[2], env);
  }
  const adminArchetypeMatch = /^\/api\/admin\/archetypes\/(\d+)$/.exec(pathname);
  if (adminArchetypeMatch?.[1] && request.method === "PATCH") return updateAdminArchetype(request, Number(adminArchetypeMatch[1]), env);
  const adminArchetypeImageMatch = /^\/api\/admin\/archetypes\/(\d+)\/image$/.exec(pathname);
  if (adminArchetypeImageMatch?.[1] && request.method === "PUT") return uploadAdminArchetypeImage(request, Number(adminArchetypeImageMatch[1]), env);
  if (pathname === "/api/results" && request.method === "POST") {
    return createResult(request, env);
  }
  if (pathname === "/api/character-change-requests" && request.method === "POST") {
    return createCharacterChangeRequest(request, env);
  }
  if (pathname === "/api/feed" && request.method === "GET") {
    return getFeed(url, env);
  }
  const resultMatch = /^\/api\/results\/([A-Za-z0-9]+)$/.exec(pathname);
  if (resultMatch?.[1] && request.method === "GET") {
    return getResult(resultMatch[1], env);
  }
  const shareMatch = /^\/api\/results\/([A-Za-z0-9]+)\/share$/.exec(pathname);
  if (shareMatch?.[1] && request.method === "POST") {
    const update = await env.DB.prepare(
      "UPDATE results SET share_count = share_count + 1 WHERE public_id = ? AND is_public = 1",
    ).bind(shareMatch[1]).run();
    if (!update.meta.changes) return json({ error: "결과를 찾을 수 없습니다." }, { status: 404 });
    return json({ ok: true });
  }

  return json({ error: "API 경로를 찾을 수 없습니다." }, { status: 404 });
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      console.error(JSON.stringify({
        event: "request_failed",
        path: new URL(request.url).pathname,
        message: error instanceof Error ? error.message : "Unknown error",
      }));
      return json({ error: "잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
