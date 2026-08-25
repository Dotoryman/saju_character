export type NativeShareResult = "image" | "link" | "unsupported";

function wasCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function canShareImageFiles(): boolean {
  if (!navigator.share || !navigator.canShare) return false;
  try {
    const probe = new File([new Uint8Array(0)], "sajusaju-share.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export async function nativeShareLink(url: string, text: string): Promise<NativeShareResult> {
  if (!navigator.share) return "unsupported";
  await navigator.share({ title: "나의 사주 캐릭터", text, url });
  return "link";
}

export async function nativeShareImage(file: File, url: string, text: string): Promise<NativeShareResult> {
  if (!navigator.share) return "unsupported";

  const shareTitle = "나의 사주 캐릭터";
  const imageAndLink: ShareData = {
    title: shareTitle,
    text,
    url,
    files: [file],
  };
  const imageOnly: ShareData = {
    title: shareTitle,
    text,
    files: [file],
  };

  const imageCandidates = [imageAndLink, imageOnly];
  for (const shareData of imageCandidates) {
    let supported = false;
    try {
      supported = navigator.canShare?.(shareData) ?? false;
    } catch {
      supported = false;
    }
    if (!supported) continue;

    try {
      await navigator.share(shareData);
      return "image";
    } catch (error) {
      if (wasCancelled(error)) throw error;
      // Some Android browsers report support, then reject a file payload at
      // runtime. Try the next smaller payload before falling back to a link.
    }
  }

  return nativeShareLink(url, text);
}

export async function nativeSaveImage(file: File): Promise<boolean> {
  if (!navigator.share || !navigator.canShare?.({ files: [file] })) return false;
  await navigator.share({ title: "나의 사주 캐릭터 이미지", files: [file] });
  return true;
}
