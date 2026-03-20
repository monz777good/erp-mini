import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import fs from "fs";
import xlsx from "xlsx";

const PEPPER = process.env.PIN_PEPPER || "";

if (!PEPPER) {
  console.error("❌ PIN_PEPPER 없음 (.env 확인)");
  process.exit(1);
}

// 엑셀 파일 경로
const FILE_PATH = "./scripts/사원명단_최종.xlsx";

// PIN 생성 (랜덤 4자리)
function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// PIN 해시
function hashPin(pin) {
  return crypto
    .createHash("sha256")
    .update(`${pin}:${PEPPER}`)
    .digest("hex");
}

// 엑셀 읽기
const workbook = xlsx.readFile(FILE_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

// SQL 생성
let sql = "";
let pinList = [];

data.forEach((row, i) => {
  const name = String(row["이름"] || "").trim();
  const phone = String(row["전화번호"] || "").replace(/\D/g, "");

  if (!name || !phone) return;

  const pin = generatePin();
  const hashed = hashPin(pin);

  const id = `sales_${String(i + 1).padStart(3, "0")}`;

  sql += `
INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('${id}', '${name}', '${phone}', 'SALES', '${hashed}', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";
`;

  pinList.push(`${name} / ${phone} / PIN: ${pin}`);
});

// 파일 저장
fs.writeFileSync("./scripts/sales_users.sql", sql);
fs.writeFileSync("./scripts/pin_list.txt", pinList.join("\n"));

console.log("✅ SQL 생성 완료: scripts/sales_users.sql");
console.log("✅ PIN 목록: scripts/pin_list.txt");