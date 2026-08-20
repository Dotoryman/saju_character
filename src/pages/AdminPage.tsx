import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { fetchAdminContent, fetchAdminRequests, fetchAdminSummary, fetchAdminUsers, updateAdminContent, updateAdminRequest, uploadAdminContentImage, type AdminContentRow, type AdminSummary, type AdminUserRow, type ChangeRequestRow } from "../lib/api";

type Tab = "requests" | "content" | "users";

export function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("requests");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [requests, setRequests] = useState<ChangeRequestRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [content, setContent] = useState<AdminContentRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  async function refresh() {
    const [nextSummary, nextRequests, nextUsers, nextContent] = await Promise.all([fetchAdminSummary(), fetchAdminRequests(), fetchAdminUsers(), fetchAdminContent()]);
    setSummary(nextSummary); setRequests(nextRequests); setUsers(nextUsers); setContent(nextContent);
  }

  useEffect(() => { if (user?.role === "admin") void refresh().catch((caught) => setStatus(caught instanceof Error ? caught.message : "관리자 데이터를 불러오지 못했습니다.")); }, [user]);

  const filteredContent = useMemo(() => content.filter((item) => `${item.ganjiKr} ${item.themeName} ${item.characterName}`.toLowerCase().includes(query.toLowerCase())), [content, query]);

  if (loading) return <div className="state-page">권한을 확인하는 중…</div>;
  if (user?.role !== "admin") return <Navigate replace to="/" />;

  async function saveRequest(item: ChangeRequestRow, nextStatus: ChangeRequestRow["status"], note: string) {
    await updateAdminRequest(item.request_id, { status: nextStatus, adminNote: note });
    setStatus("수정 요청 상태를 저장했습니다.");
    await refresh();
  }

  async function saveContent(item: AdminContentRow) {
    await updateAdminContent(item); setStatus(`${item.ganjiKr} · ${item.characterName} 정보를 저장했습니다.`); await refresh();
  }

  return (
    <article className="dashboard-page admin-page">
      <header className="dashboard-heading"><p className="eyebrow">ADMIN CONSOLE</p><h1>SAJUSAJU 관리자</h1><p>수정 요청, 회원, 캐릭터 이미지와 설명을 한곳에서 관리합니다.</p></header>
      <section className="summary-grid"><article><span>오늘 방문자</span><strong>{summary?.todayVisitors ?? "—"}</strong></article><article><span>가입자</span><strong>{summary?.users ?? "—"}</strong></article><article><span>처리할 요청</span><strong>{summary?.openRequests ?? "—"}</strong></article><article><span>전체 캐릭터</span><strong>{content.length || "—"}</strong></article></section>
      <nav className="admin-tabs" aria-label="관리자 메뉴"><button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>수정요청함</button><button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>캐릭터·이미지</button><button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>가입자 목록</button></nav>
      <p className="admin-status" aria-live="polite">{status}</p>
      {tab === "requests" && <section className="request-inbox">{requests.map((item) => <RequestMessage key={item.request_id} item={item} onSave={saveRequest} />)}{!requests.length && <div className="empty-state"><h2>도착한 수정 요청이 없습니다.</h2></div>}</section>}
      {tab === "users" && <section className="admin-table-wrap"><table><thead><tr><th>아이디</th><th>닉네임</th><th>권한</th><th>저장 사주</th><th>가입일</th><th>최근 로그인</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>{item.username}</td><td>{item.nickname}</td><td>{item.role === "admin" ? "관리자" : "회원"}</td><td>{item.saved_count}</td><td>{formatDate(item.created_at)}</td><td>{item.last_login_at ? formatDate(item.last_login_at) : "—"}</td></tr>)}</tbody></table></section>}
      {tab === "content" && <section><input className="admin-search" placeholder="일주·작품·캐릭터 검색" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="admin-content-grid">{filteredContent.map((item) => <ContentEditor item={item} key={`${item.cycleIndex}-${item.theme}`} onSave={saveContent} onUpload={async (file) => { await uploadAdminContentImage(item, file); setStatus("새 이미지를 저장했습니다."); await refresh(); }} />)}</div></section>}
    </article>
  );
}

function RequestMessage({ item, onSave }: { item: ChangeRequestRow; onSave: (item: ChangeRequestRow, status: ChangeRequestRow["status"], note: string) => Promise<void> }) {
  const [note, setNote] = useState(item.admin_note ?? "");
  const [nextStatus, setNextStatus] = useState(item.status);
  return <article className={`inbox-message status-${item.status}`}><header><div><span>{item.requester_nickname || "비회원"}</span><strong>{statusLabel(item.status)}</strong></div><time>{formatDate(item.created_at)}</time></header><p>{item.request_text}</p>{item.result_url && <a href={item.result_url} rel="noreferrer" target="_blank">결과 페이지 열기 ↗</a>}<label><span>관리자 메모</span><textarea value={note} onChange={(event) => setNote(event.target.value)} /></label><div className="inbox-actions"><select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as ChangeRequestRow["status"])}><option value="pending">새 요청</option><option value="reviewed">처리 중</option><option value="completed">완료</option><option value="rejected">반려</option></select><button className="button primary" type="button" onClick={() => void onSave(item, nextStatus, note)}>저장</button></div></article>;
}

function ContentEditor({ item, onSave, onUpload }: { item: AdminContentRow; onSave: (item: AdminContentRow) => Promise<void>; onUpload: (file: File) => Promise<void> }) {
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item]);
  return <article className={`content-editor ${draft.enabled ? "" : "disabled"}`}><div className="content-editor-image">{draft.imageKey && <img alt={draft.characterName} src={draft.imageKey} />}<label className="image-upload">이미지 교체<input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file); }} /></label></div><div className="content-editor-fields"><p><strong>{draft.ganjiKr}일주</strong><span>{draft.themeName}</span></p><label><span>캐릭터명</span><input value={draft.characterName} onChange={(event) => setDraft({ ...draft, characterName: event.target.value })} /></label><label><span>한 줄 설명</span><input value={draft.tagline} onChange={(event) => setDraft({ ...draft, tagline: event.target.value })} /></label><label><span>캐릭터 설명</span><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><div className="content-editor-actions"><label><input checked={draft.enabled} type="checkbox" onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} /> 공개</label><button className="button primary" type="button" onClick={() => void onSave(draft)}>저장</button></div></div></article>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function statusLabel(value: ChangeRequestRow["status"]) { return ({ pending: "새 요청", reviewed: "처리 중", completed: "완료", rejected: "반려" })[value]; }
