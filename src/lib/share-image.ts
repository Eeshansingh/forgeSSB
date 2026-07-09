import { toPng } from "html-to-image";

export function formatShareDate(): string {
  return new Date()
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

export async function generateCardPng(node: HTMLElement): Promise<string> {
  await document.fonts.ready;
  return toPng(node, { pixelRatio: 2, cacheBust: true });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function shareOrDownloadDataUrl(dataUrl: string, filename: string, title: string): Promise<void> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title });
  } else {
    downloadDataUrl(dataUrl, filename);
  }
}

export const supportsNativeShare =
  typeof navigator !== "undefined" && typeof navigator.share === "function";
