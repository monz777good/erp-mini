const crypto = require("crypto");

const pin = process.argv[2];
if (!pin) {
  console.log("사용법: node scripts/hash-pin.cjs 123456");
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(String(pin)).digest("hex");
console.log(hash);