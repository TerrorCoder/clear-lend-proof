/*
 * ClearLend private state + witness functions.
 *
 * The witnesses feed the borrower's private financials into circuit
 * execution. They are resolved locally at proof time and never leave the
 * borrower's device — only the ZK proof (and the values it commits to)
 * reaches the network.
 */

import type { Ledger } from "./managed/clearlend/contract/index.js";
import type { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

/** Secrets for one loan, stored JSON-serializable so they survive persistence. */
export type LoanSecret = {
  /** Annual income in whole dollars (stringified bigint). */
  readonly income: string;
  /** Existing debt in whole dollars (stringified bigint). */
  readonly debt: string;
  /** 32-byte commitment nonce, hex encoded. */
  readonly nonceHex: string;
};

export type ClearLendPrivateState = {
  /** Financials staged for the next `submitLoanRequest` call. */
  readonly pending: LoanSecret | null;
  /** Financials of loans this borrower has already submitted, keyed by on-chain loan id. */
  readonly loans: Record<string, LoanSecret>;
};

export const createClearLendPrivateState = (): ClearLendPrivateState => ({
  pending: null,
  loans: {},
});

export const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

export const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const requirePending = (state: ClearLendPrivateState): LoanSecret => {
  if (!state.pending) {
    throw new Error(
      "No pending loan financials in local private state — stage income/debt before submitting.",
    );
  }
  return state.pending;
};

export const witnesses = {
  pendingLoanFinancials: ({
    privateState,
  }: WitnessContext<Ledger, ClearLendPrivateState>): [ClearLendPrivateState, [bigint, bigint]] => {
    const pending = requirePending(privateState);
    return [privateState, [BigInt(pending.income), BigInt(pending.debt)]];
  },

  pendingLoanNonce: ({
    privateState,
  }: WitnessContext<Ledger, ClearLendPrivateState>): [ClearLendPrivateState, Uint8Array] => {
    const pending = requirePending(privateState);
    return [privateState, hexToBytes(pending.nonceHex)];
  },
};

export type ClearLendWitnesses = typeof witnesses;
