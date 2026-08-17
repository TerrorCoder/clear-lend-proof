/**
 * ClearLend — Midnight Network integration layer.
 *
 * These functions were originally mocked stubs; they now perform real
 * Midnight operations (Lace wallet connection, ZK proof generation via the
 * proof server, on-chain circuit calls, indexer reads). Function signatures
 * are unchanged so the UI components did not need restructuring.
 *
 * All Midnight modules are imported dynamically: they rely on WASM and
 * `window`, so they must never be evaluated during SSR.
 */

export type LoanStatus = "Pending" | "Approved" | "Rejected";
export type ProofStatus = "Verified" | "Not Verified";

export interface Loan {
  id: string;
  wallet: string;
  amount: number;
  status: LoanStatus;
  proofStatus: ProofStatus;
  createdAt: string;
  /** Shielded values — never leave the borrower's device except via the
   * auditor-encrypted, commitment-bound audit package. Zero when unknown. */
  privateIncome: number;
  privateDebt: number;
  collateralRatio: number;
}

export interface DisclosureRecord {
  id: string;
  loanId: string;
  auditor: string;
  timestamp: string;
}

/** Display id ↔ on-chain sequential loan id. */
const LOAN_ID_BASE = 1000n;
const formatLoanId = (chainId: bigint): string => `LN-${(LOAN_ID_BASE + chainId).toString()}`;
const parseLoanId = (display: string): bigint | null => {
  const match = /^LN-(\d+)$/i.exec(display.trim());
  if (!match) return null;
  const value = BigInt(match[1]!);
  return value >= LOAN_ID_BASE ? value - LOAN_ID_BASE : null;
};

export const BORROWER_WALLET = "0x7f3a41b8c0e5d2a19c2d"; // legacy mock constant (unused once a wallet is connected)

export const truncateAddress = (address: string) =>
  address.length <= 12 ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const midnight = () => import("./midnight");

const ratioOf = (income: number, debt: number, amount: number): number =>
  debt + amount > 0 ? Number((income / (debt + amount)).toFixed(2)) : 99;

const toLoan = (
  onChain: {
    id: bigint;
    amount: bigint;
    borrowerHex: string;
    verified: boolean;
    status: LoanStatus;
  },
  privates?: { income: number; debt: number },
): Loan => ({
  id: formatLoanId(onChain.id),
  wallet: `0x${onChain.borrowerHex}`,
  amount: Number(onChain.amount),
  status: onChain.status,
  proofStatus: onChain.verified ? "Verified" : "Not Verified",
  createdAt: new Date().toISOString(),
  privateIncome: privates?.income ?? 0,
  privateDebt: privates?.debt ?? 0,
  collateralRatio: privates ? ratioOf(privates.income, privates.debt, Number(onChain.amount)) : 0,
});

/** Connect the Lace wallet via the Midnight DApp connector API. */
export async function connectLaceWallet(): Promise<{ address: string; network: string }> {
  const m = await midnight();
  const session = await m.getWalletSession();
  return {
    address: session.address,
    network: `Midnight ${session.networkId.charAt(0).toUpperCase()}${session.networkId.slice(1)}`,
  };
}

/**
 * Generate a ZK proof of eligibility locally and submit only the proof plus
 * the public loan amount to the ClearLend contract. Income and debt are
 * witness data: they feed the proof and the auditor-sealed package, nothing
 * else. A failing threshold means no proof can be generated — the request is
 * rejected locally and nothing reaches the chain.
 */
export async function submitLoanProof(input: {
  amount: number;
  income: number;
  debt: number;
}): Promise<Loan> {
  const m = await midnight();
  const ctx = await m.getClearLendContext();

  const secret = {
    income: BigInt(Math.round(input.income)).toString(),
    debt: BigInt(Math.round(input.debt)).toString(),
    nonceHex: m.randomNonceHex(),
  };

  // Stage witness data for the circuit call.
  const state = await m.getPrivateState();
  await m.setPrivateState({ ...state, pending: secret });

  const borrowerId = m.identityBytes(ctx.session.coinPublicKey);
  const auditPackage = m.sealAuditPackage(secret);

  try {
    await ctx.deployed.callTx.submitLoanRequest(
      BigInt(Math.round(input.amount)),
      borrowerId,
      auditPackage,
    );
  } catch (error) {
    // Threshold assert fails during local circuit execution → no proof, no tx.
    const message = error instanceof Error ? error.message : String(error);
    const cleared = await m.getPrivateState();
    await m.setPrivateState({ ...cleared, pending: null });
    if (/collateral|assert|threshold/i.test(message)) {
      return {
        id: `LN-X${Math.floor(1000 + Math.random() * 9000)}`,
        wallet: ctx.session.address,
        amount: input.amount,
        status: "Rejected",
        proofStatus: "Not Verified",
        createdAt: new Date().toISOString(),
        privateIncome: input.income,
        privateDebt: input.debt,
        collateralRatio: ratioOf(input.income, input.debt, input.amount),
      };
    }
    throw error;
  }

  // Resolve the id assigned on-chain: newest loan belonging to this borrower.
  const myHex = Array.from(borrowerId)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const { loans } = await m.readLedger();
  const mine = loans.filter((l) => l.borrowerHex === myHex);
  const newest = mine.reduce((a, b) => (b.id > a.id ? b : a), mine[0]!);

  // File the secrets under the assigned loan id for later disclosure.
  const afterState = await m.getPrivateState();
  await m.setPrivateState({
    ...afterState,
    pending: null,
    loans: { ...afterState.loans, [newest.id.toString()]: secret },
  });

  return toLoan(newest, { income: input.income, debt: input.debt });
}

/** Verify a submitted proof by reading the loan's on-chain public state. */
export async function verifyProof(
  loanId: string,
): Promise<{ loanId: string; proofStatus: ProofStatus }> {
  const m = await midnight();
  const chainId = parseLoanId(loanId);
  if (chainId === null) throw new Error(`Invalid loan ID "${loanId}"`);
  const { loans } = await m.readLedger();
  const loan = loans.find((l) => l.id === chainId);
  if (!loan) throw new Error(`No loan found for ID "${loanId}"`);
  return { loanId, proofStatus: loan.verified ? "Verified" : "Not Verified" };
}

/** Lender approves a loan whose proof has already been verified on-chain. */
export async function approveLoan(loanId: string): Promise<{ loanId: string; status: LoanStatus }> {
  const m = await midnight();
  const ctx = await m.getClearLendContext();
  const chainId = parseLoanId(loanId);
  if (chainId === null) throw new Error(`Invalid loan ID "${loanId}"`);
  await ctx.deployed.callTx.approveLoan(chainId);
  return { loanId, status: "Approved" };
}

/**
 * Auditor requests the borrower-pre-authorized selective disclosure for one
 * loan: logs the disclosure event on-chain (values are never on-chain),
 * decrypts the auditor-sealed package locally, and verifies the values
 * against the loan's ZK-proven commitment.
 */
export async function requestDisclosure(
  loanId: string,
): Promise<{ loan: Loan; record: DisclosureRecord }> {
  const m = await midnight();
  const ctx = await m.getClearLendContext();
  const chainId = parseLoanId(loanId);
  if (chainId === null) throw new Error(`No loan found for ID "${loanId}"`);

  const { loans } = await m.readLedger();
  const onChain = loans.find((l) => l.id === chainId);
  if (!onChain) throw new Error(`No loan found for ID "${loanId}"`);

  // On-chain: append { loanId, auditor } to the disclosure log — event only.
  await ctx.deployed.callTx.requestDisclosure(chainId, m.identityBytes(m.AUDITOR_ID));

  // Off-chain: decrypt the package sealed to the auditor and verify it
  // against the commitment proven at submission time.
  const secret = m.openAuditPackage(onChain.auditPackage);
  const income = BigInt(secret.income);
  const debt = BigInt(secret.debt);
  if (!m.verifyCommitment(income, debt, m.hexToBytes(secret.nonceHex), onChain.commitment)) {
    throw new Error("Disclosed values do not match the on-chain ZK commitment — audit failed.");
  }

  const { disclosures } = await m.readLedger();
  const latest = disclosures[disclosures.length - 1];

  return {
    loan: toLoan(onChain, { income: Number(income), debt: Number(debt) }),
    record: {
      id: `DR-${(latest?.id ?? 0n).toString().padStart(3, "0")}`,
      loanId: formatLoanId(chainId),
      auditor: m.AUDITOR_ID,
      timestamp: new Date().toISOString(),
    },
  };
}

/** All loans on the platform, from on-chain public state (privates masked). */
export async function listLoans(): Promise<Loan[]> {
  const m = await midnight();
  const { loans } = await m.readLedger();
  return loans.map((l) => toLoan(l)).reverse();
}

/** Loans submitted by the connected borrower wallet. */
export async function listMyLoans(): Promise<Loan[]> {
  const m = await midnight();
  const ctx = await m.getClearLendContext();
  const myHex = Array.from(m.identityBytes(ctx.session.coinPublicKey))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const { loans } = await m.readLedger();
  return loans
    .filter((l) => l.borrowerHex === myHex)
    .map((l) => toLoan(l))
    .reverse();
}

/** The on-chain disclosure log (events only — never values). */
export async function listDisclosures(): Promise<DisclosureRecord[]> {
  const m = await midnight();
  const { disclosures } = await m.readLedger();
  return disclosures
    .map((d) => ({
      id: `DR-${d.id.toString().padStart(3, "0")}`,
      loanId: formatLoanId(d.loanId),
      auditor: `auditor 0x${d.auditorHex.slice(0, 8)}…`,
      timestamp: new Date().toISOString(),
    }))
    .reverse();
}
