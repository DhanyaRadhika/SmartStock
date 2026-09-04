const { randomBytes, scryptSync } = require("crypto");
const pw =
  process.argv[2] ||
  randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16);
const N = 16384,
  r = 8,
  p = 1;
const salt = randomBytes(16);
const hash = scryptSync(pw, salt, 64, { N, r, p, maxmem: 128 * N * r + 1024 });
console.log("PASSWORD:" + pw);
console.log(
  "HASH:" +
    `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`,
);
