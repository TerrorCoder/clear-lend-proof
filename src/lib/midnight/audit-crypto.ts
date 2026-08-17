/*
 * Borrower-authorized selective disclosure ("Option A").
 *
 * At submission time the borrower's client seals {income, debt, nonce} to the
 * auditor's X25519 public key (NaCl box with an ephemeral sender key). The
 * ciphertext is stored on-chain as an opaque string next to a ZK-proven
 * commitment over the very same values. The auditor decrypts locally and
 * verifies against the commitment — a borrower who encrypts different values
 * than they proved is caught by the commitment mismatch.
 *
 * DEMO NOTE: the auditor keypair is derived from a fixed seed committed to
 * this repo so judges can run the whole flow solo. In production the secret
 * half would live only with the compliance auditor.
 */

import nacl from "tweetnacl";
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from "tweetnacl-util";
import { bytesToHex, hexToBytes, type LoanSecret } from "../../../contract/src/witnesses";

export const AUDITOR_ID = "auditor.midnight.compliance";

// Fixed demo seed (32 bytes) — see DEMO NOTE above.
const AUDITOR_SEED = new Uint8Array(Array.from({ length: 32 }, (_, i) => (i * 7 + 13) % 256));

const auditorKeyPair = nacl.box.keyPair.fromSecretKey(AUDITOR_SEED);

export type AuditPackage = {
  /** Ephemeral sender public key, base64. */
  epk: string;
  /** NaCl box nonce, base64. */
  n: string;
  /** Ciphertext of the JSON-encoded LoanSecret, base64. */
  ct: string;
};

/** Encrypt a borrower's loan secrets to the auditor's public key. */
export const sealAuditPackage = (secret: LoanSecret): string => {
  const ephemeral = nacl.box.keyPair();
  const boxNonce = nacl.randomBytes(nacl.box.nonceLength);
  const message = decodeUTF8(JSON.stringify(secret));
  const ciphertext = nacl.box(message, boxNonce, auditorKeyPair.publicKey, ephemeral.secretKey);
  const pkg: AuditPackage = {
    epk: encodeBase64(ephemeral.publicKey),
    n: encodeBase64(boxNonce),
    ct: encodeBase64(ciphertext),
  };
  return JSON.stringify(pkg);
};

/** Decrypt an on-chain audit package using the auditor's secret key. */
export const openAuditPackage = (sealed: string): LoanSecret => {
  const pkg = JSON.parse(sealed) as AuditPackage;
  const message = nacl.box.open(
    decodeBase64(pkg.ct),
    decodeBase64(pkg.n),
    decodeBase64(pkg.epk),
    auditorKeyPair.secretKey,
  );
  if (!message) {
    throw new Error("Failed to decrypt audit package — not sealed to this auditor.");
  }
  return JSON.parse(encodeUTF8(message)) as LoanSecret;
};

/** 32-byte identity for an arbitrary string (wallet key, auditor name). */
export const identityBytes = (value: string): Uint8Array =>
  nacl.hash(decodeUTF8(value)).slice(0, 32);

/** Random 32-byte commitment nonce, hex encoded. */
export const randomNonceHex = (): string => bytesToHex(nacl.randomBytes(32));

export { bytesToHex, hexToBytes };
