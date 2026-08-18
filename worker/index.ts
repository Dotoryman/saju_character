import { z } from "zod";
import { getArchetype } from "../src/data/archetypes";
import { getCharacterResults } from "../src/data/characterMappings";
import { maskBirthDate, maskNickname } from "../src/domain/privacy/mask";
import { calculateDayPillar } from "../src/domain/saju/calculateDayPillar";
import type { ResultViewModel } from "../src/shared/result";

const createResultSchema = z.object({
  nickname: z.string().trim().min(1, "닉네임을 입력해 주세요.").max(20, "닉네임은 20자 이하로 입력해 주세요."),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 생년월일을 입력해 주세요."),
});

interface ResultRow {
  public_id: string;
  nickname: string;
  birth_date: string;
  cycle_index: number;
  created_at: string;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function toViewModel(row: ResultRow): ResultViewModel {
  const archetype = getArchetype(row.cycle_index);
  return {
    resultId: row.public_id,
    ganji: archetype.ganji,
    ganjiKr: archetype.ganjiKr,
    element: archetype.element,
    archetype: {
      name: archetype.archetypeName,
      animal: archetype.animalName,
      description: archetype.description,
    },
    characters: getCharacterResults(row.cycle_index, archetype.animalName),
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

  await env.DB.prepare(
    `INSERT INTO results (public_id, nickname, birth_date, cycle_index, is_public, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
  )
    .bind(publicId, parsed.data.nickname, parsed.data.birthDate, pillar.cycleIndex, createdAt, createdAt)
    .run();

  return json(
    toViewModel({
      public_id: publicId,
      nickname: parsed.data.nickname,
      birth_date: parsed.data.birthDate,
      cycle_index: pillar.cycleIndex,
      created_at: createdAt,
    }),
    { status: 201 },
  );
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
  return json(toViewModel(row));
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
    items: page.map(toViewModel),
    nextCursor: hasNext ? page.at(-1)?.created_at ?? null : null,
  });
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/api/health" && request.method === "GET") {
    return json({ ok: true, environment: env.ENVIRONMENT });
  }
  if (pathname === "/api/results" && request.method === "POST") {
    return createResult(request, env);
  }
  if (pathname === "/api/feed" && request.method === "GET") {
    return getFeed(url, env);
  }
  const resultMatch = /^\/api\/results\/([A-Za-z0-9]+)$/.exec(pathname);
  if (resultMatch?.[1] && request.method === "GET") {
    return getResult(resultMatch[1], env);
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

