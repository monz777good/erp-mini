import fs from "fs";
import path from "path";

export type UploadResult = {
  publicPath: string;
  absPath: string;
};

export function saveUploadLocal(
  buffer: Buffer | Uint8Array,
  fileName: string,
  subDir: string = "biz"
): UploadResult {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  const baseDir = path.join(process.cwd(), "public", "uploads", subDir);
  fs.mkdirSync(baseDir, { recursive: true });

  const absPath = path.join(baseDir, safeName);

  // ✅ TS 확실히 통과: writeFileSync는 Uint8Array(ArrayBufferView) OK
  const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
  fs.writeFileSync(absPath, data);

  const publicPath = `/uploads/${subDir}/${safeName}`;
  return { publicPath, absPath };
}