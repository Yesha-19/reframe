export type VideoValidationResult =
  | { valid: true; format: string }
  | { valid: false; error: string };

export async function validateVideoMagicBytes(
  file: File
): Promise<VideoValidationResult> {
  const HEADER_SIZE = 12;

  if (file.size < HEADER_SIZE) {
    return { valid: false, error: "File is too small to be a valid video." };
  }

  const bytes = new Uint8Array(await file.slice(0, HEADER_SIZE).arrayBuffer());

  if (ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12).trim().toLowerCase();
    if (brand.startsWith("m4a")) {
      return { valid: false, error: "Audio-only M4A files are not supported." };
    }
    return { valid: true, format: brandToName(brand) };
  }

  if (matchesAt(bytes, 0, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { valid: true, format: "WebM / MKV" };
  }

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "AVI ") {
    return { valid: true, format: "AVI" };
  }

  if (["moov","mdat","wide","free","skip","pnot"].includes(ascii(bytes, 4, 8))) {
    return { valid: true, format: "QuickTime / MP4 (legacy)" };
  }

  if (bytes[0] === 0x47) {
    return { valid: true, format: "MPEG-2 TS" };
  }

  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 &&
      (bytes[3] === 0xb3 || bytes[3] === 0xba)) {
    return { valid: true, format: "MPEG-1/2 Video" };
  }

  return {
    valid: false,
    error:
      "This file does not appear to be a supported video format. " +
      "Please upload an MP4, MOV, WebM, or AVI file.",
  };
}
