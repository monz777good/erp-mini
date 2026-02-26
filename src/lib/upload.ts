import fs from "fs";
import path from "path";

export async function saveUploadToPublic(file: File, subDir: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = `${Date.now()}_${String(file.name ?? "file")}`.replace(/[^\w.\-가-힣]/g, "_");
  const baseDir = path.join(process.cwd(), "public", "uploads", subDir);
  fs.mkdirSync(baseDir, { recursive: true });

  const absPath = path.join(baseDir, safeName);
  fs.writeFileSync(absPath, buffer);

  const publicPath = `/uploads/${subDir}/${safeName}`;
  return { publicPath, absPath };
}
