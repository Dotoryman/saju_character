import { useState } from "react";
import { ChangeRequestModal } from "../features/changeRequest/ChangeRequestModal";
import packageInfo from "../../package.json";

export function AboutPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article className="about-page">
      <header className="about-intro">
        <p className="eyebrow">ABOUT SAJUSAJU</p>
        <dl className="about-meta">
          <div><dt>만든이</dt><dd>남도령</dd></div>
          <div><dt>현재 버전</dt><dd>v{packageInfo.version}</dd></div>
        </dl>
      </header>

      <section className="request-card">
        <p className="eyebrow">COMMENT</p>
        <h1>본인 캐릭터가<br />마음에 안드시면 말씀해주세요.<br /><em>바꿔드릴게요.</em></h1>
        <button className="button primary" type="button" onClick={() => setIsOpen(true)}>수정 요청하기</button>
      </section>

      <section className="rights-notice" aria-labelledby="rights-title">
        <p className="eyebrow">RIGHTS &amp; NOTICE</p>
        <h2 id="rights-title">비공식 팬 콘텐츠 안내</h2>
        <p>SAJUSAJU는 각 작품의 제작사·배급사·권리자와 제휴하거나 공식 승인을 받은 서비스가 아닙니다. 작품명과 캐릭터명 및 관련 이미지는 각 권리자에게 권리가 있으며, 본 서비스에서는 캐릭터를 식별하고 비평적·문화적 맥락의 결과를 전달하기 위해 사용합니다.</p>
        <p>권리 침해 우려가 있거나 이미지·표기 수정을 원하시는 권리자는 수정 요청을 보내주세요. 확인 후 신속히 검토하겠습니다.</p>
      </section>

      <ChangeRequestModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </article>
  );
}

