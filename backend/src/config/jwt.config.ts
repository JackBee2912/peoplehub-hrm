import { createPrivateKey, createPublicKey } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

export function loadRsaKeys() {
  const privateKeyPath = process.env.JWT_REFRESH_SECRET_PATH || join(__dirname, "../../config/jwtRS256.key");
  const publicKeyPath = process.env.JWT_ACCESS_SECRET_PATH || join(__dirname, "../../config/jwtRS256.pem");

  let privateKey: string;
  let publicKey: string;

  try {
    privateKey = readFileSync(privateKeyPath, "utf8");
    publicKey = readFileSync(publicKeyPath, "utf8");
  } catch {
    // Generate keys on the fly if files don't exist (development only)
    const { privateKey: priv, publicKey: pub } = generateRsaKeyPair();
    privateKey = priv;
    publicKey = pub;
  }

  return { privateKey, publicKey };
}

function generateRsaKeyPair() {
  const { privateKey, publicKey } = require("crypto").generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { privateKey, publicKey };
}
