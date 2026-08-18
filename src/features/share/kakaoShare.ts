export interface KakaoShareInput {
  title: string;
  description: string;
  url: string;
}

interface KakaoSdk {
  isInitialized(): boolean;
  init(key: string): void;
  Share?: {
    sendDefault(input: unknown): void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

export function canUseKakaoShare(): boolean {
  return Boolean(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY && window.Kakao?.Share);
}

export function shareWithKakao(input: KakaoShareInput): boolean {
  const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
  const kakao = window.Kakao;
  if (!key || !kakao?.Share) return false;
  if (!kakao.isInitialized()) kakao.init(key);

  kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: input.title,
      description: input.description,
      imageUrl: `${window.location.origin}/og-placeholder.png`,
      link: { mobileWebUrl: input.url, webUrl: input.url },
    },
    buttons: [{ title: "결과 보기", link: { mobileWebUrl: input.url, webUrl: input.url } }],
  });
  return true;
}
