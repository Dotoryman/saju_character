export async function nativeShareImage(file: File, url: string, text: string): Promise<boolean> {
  const shareData: ShareData = {
    title: "나의 사주 캐릭터",
    text,
    url,
    files: [file],
  };

  if (!navigator.share || !navigator.canShare?.({ files: [file] })) return false;
  await navigator.share(shareData);
  return true;
}
