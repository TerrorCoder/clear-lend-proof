/**
 * ClearLend — mocked Midnight Network layer.
 *
 * Every function here is a STUB. Replace the bodies with real Midnight
 * Compact contract calls / Lace wallet calls. Signatures are intended to stay
 * stable so the UI does not need to change.
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
  /** Shielded values — in production these never leave the borrower's device. */
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const BORROWER_WALLET = "0x7f3a41b8c0e5d2a19c2d";

export const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export const MOCK_LOANS: Loan[] = [
  {
    id: "LN-1042",
    wallet: "0x7f3a41b8c0e5d2a19c2d",
    amount: 25000,
    status: "Approved",
    proofStatus: "Verified",
    createdAt: "2026-07-14T10:22:00Z",
    privateIncome: 148000,
    privateDebt: 32000,
    collateralRatio: 1.84,
  },
  {
    id: "LN-1043",
    wallet: "0x91cc7d0e44ab77f5e10b",
    amount: 8000,
    status: "Pending",
    proofStatus: "Verified",
    createdAt: "2026-07-29T08:05:00Z",
    privateIncome: 62000,
    privateDebt: 11400,
    collateralRatio: 1.42,
  },
  {
    id: "LN-1044",
    wallet: "0x7f3a41b8c0e5d2a19c2d",
    amount: 12500,
    status: "Rejected",
    proofStatus: "Not Verified",
    createdAt: "2026-08-02T16:41:00Z",
    privateIncome: 41000,
    privateDebt: 38500,
    collateralRatio: 0.87,
  },
  {
    id: "LN-1045",
    wallet: "0xa4be09f371c2dd88ff41",
    amount: 46000,
    status: "Pending",
    proofStatus: "Not Verified",
    createdAt: "2026-08-08T12:12:00Z",
    privateIncome: 210000,
    privateDebt: 74000,
    collateralRatio: 1.21,
  },
  {
    id: "LN-1046",
    wallet: "0x2d17ba5590fe4c31a7c8",
    amount: 18000,
    status: "Approved",
    proofStatus: "Verified",
    createdAt: "2026-08-10T09:30:00Z",
    privateIncome: 96000,
    privateDebt: 15200,
    collateralRatio: 2.06,
  },
];

export const MOCK_DISCLOSURES: DisclosureRecord[] = [
  {
    id: "DR-018",
    loanId: "LN-1042",
    auditor: "auditor.midnight.compliance",
    timestamp: "2026-07-20T11:04:00Z",
  },
  {
    id: "DR-019",
    loanId: "LN-1046",
    auditor: "auditor.midnight.compliance",
    timestamp: "2026-08-10T15:48:00Z",
  },
];

/** STUB: connect the Lace wallet via the Midnight DApp connector API. */
export async function connectLaceWallet(): Promise<{ address: string; network: string }> {
  await delay(1200);
  return { address: BORROWER_WALLET, network: "Midnight Testnet-02" };
}

/**
 * STUB: generate a ZK proof of eligibility locally and submit only the proof
 * plus public loan amount to the contract.
 */
export async function submitLoanProof(input: {
  amount: number;
  income: number;
  debt: number;
}): Promise<Loan> {
  await delay(2600);
  const ratio = input.debt > 0 ? input.income / input.debt : 99;
  return {
    id: `LN-${Math.floor(1050 + Math.random() * 900)}`,
    wallet: BORROWER_WALLET,
    amount: input.amount,
    status: ratio >= 1.25 ? "Approved" : "Rejected",
    proofStatus: "Verified",
    createdAt: new Date().toISOString(),
    privateIncome: input.income,
    privateDebt: input.debt,
    collateralRatio: Number(ratio.toFixed(2)),
  };
}

/** STUB: verify a submitted proof on-chain. */
export async function verifyProof(loanId: string): Promise<{ loanId: string; proofStatus: ProofStatus }> {
  await delay(1600);
  return { loanId, proofStatus: "Verified" };
}

/** STUB: lender approves a loan whose proof has already been verified. */
export async function approveLoan(loanId: string): Promise<{ loanId: string; status: LoanStatus }> {
  await delay(1200);
  return { loanId, status: "Approved" };
}

/** STUB: auditor requests a borrower-authorized selective disclosure. */
export async function requestDisclosure(
  loanId: string,
): Promise<{ loan: Loan; record: DisclosureRecord }> {
  await delay(2400);
  const loan = MOCK_LOANS.find((l) => l.id.toLowerCase() === loanId.trim().toLowerCase());
  if (!loan) {
    throw new Error(`No loan found for ID "${loanId}"`);
  }
  return {
    loan,
    record: {
      id: `DR-${Math.floor(20 + Math.random() * 80)}`,
      loanId: loan.id,
      auditor: "auditor.midnight.compliance",
      timestamp: new Date().toISOString(),
    },
  };
}
