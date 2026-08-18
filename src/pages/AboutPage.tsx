import packageInfo from "../../package.json";

export function AboutPage() {
  return (
    <article className="about-page about-credits">
      <dl>
        <div><dt>만든이</dt><dd>남도령</dd></div>
        <div><dt>버전</dt><dd>v{packageInfo.version}</dd></div>
      </dl>
    </article>
  );
}

