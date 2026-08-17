/*
 * ClearLend contract access layer.
 *
 * Joins (or deploys, first run) the ClearLend contract on the configured
 * Midnight network and exposes typed circuit calls plus plain-JS ledger
 * reads for the UI.
 */

import * as ClearLend from "../../../contract/src/index";
import {
  CompiledClearLendContract,
  createClearLendPrivateState,
  type ClearLendPrivateState,
} from "../../../contract/src/index";
import type { ContractAddress } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import {
  deployContract,
  findDeployedContract,
  type FoundContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { buildProviders, getWalletSession, type WalletSession } from "./providers";

export const CLEARLEND_PRIVATE_STATE_KEY = "clearLendPrivateState";
export type ClearLendPrivateStateId = typeof CLEARLEND_PRIVATE_STATE_KEY;

export type ClearLendContractType = ClearLend.Contract<ClearLendPrivateState>;
export type ClearLendCircuitKeys = Exclude<
  keyof ClearLendContractType["impureCircuits"],
  number | symbol
>;
export type ClearLendProviders = MidnightProviders<
  ClearLendCircuitKeys,
  ClearLendPrivateStateId,
  ClearLendPrivateState
>;
export type DeployedClearLendContract = FoundContract<ClearLendContractType>;

const CONTRACT_ADDRESS_STORAGE_KEY = "clearlend/contract-address";

export interface ClearLendContext {
  readonly providers: ClearLendProviders;
  readonly deployed: DeployedClearLendContract;
  readonly address: ContractAddress;
  readonly session: WalletSession;
}

let contextPromise: Promise<ClearLendContext> | undefined;

const configuredAddress = (): string | undefined => {
  const fromEnv = import.meta.env["VITE_CLEARLEND_CONTRACT_ADDRESS"] as string | undefined;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();
  const fromStorage = window.localStorage.getItem(CONTRACT_ADDRESS_STORAGE_KEY);
  return fromStorage ?? undefined;
};

const initialize = async (): Promise<ClearLendContext> => {
  const session = await getWalletSession();
  const providers = await buildProviders<
    ClearLendCircuitKeys,
    ClearLendPrivateStateId,
    ClearLendPrivateState
  >();

  const address = configuredAddress();
  let deployed: DeployedClearLendContract;

  if (address) {
    providers.privateStateProvider.setContractAddress(address);
    const existing = await providers.privateStateProvider.get(CLEARLEND_PRIVATE_STATE_KEY);
    deployed = await findDeployedContract<ClearLendContractType>(providers, {
      contractAddress: address,
      compiledContract: CompiledClearLendContract,
      privateStateId: CLEARLEND_PRIVATE_STATE_KEY,
      initialPrivateState: existing ?? createClearLendPrivateState(),
    });
  } else {
    // First run against this network: deploy a fresh contract instance and
    // remember its address locally. For the hackathon deployment the address
    // is then pinned via VITE_CLEARLEND_CONTRACT_ADDRESS.
    deployed = await deployContract(providers, {
      compiledContract: CompiledClearLendContract,
      privateStateId: CLEARLEND_PRIVATE_STATE_KEY,
      initialPrivateState: createClearLendPrivateState(),
    });
    const newAddress = deployed.deployTxData.public.contractAddress;
    window.localStorage.setItem(CONTRACT_ADDRESS_STORAGE_KEY, newAddress);
    console.info(
      `[ClearLend] Deployed new contract at ${newAddress} — set VITE_CLEARLEND_CONTRACT_ADDRESS to pin it.`,
    );
  }

  const contractAddress = deployed.deployTxData.public.contractAddress;
  providers.privateStateProvider.setContractAddress(contractAddress);

  return { providers, deployed, address: contractAddress, session };
};

/** Get (and cache) the connected wallet + joined contract context. */
export const getClearLendContext = (): Promise<ClearLendContext> => {
  if (!contextPromise) {
    contextPromise = initialize().catch((error: unknown) => {
      contextPromise = undefined;
      throw error;
    });
  }
  return contextPromise;
};

/* ------------------------------------------------------------------ */
/* Ledger reads                                                        */
/* ------------------------------------------------------------------ */

export type OnChainLoan = {
  readonly id: bigint;
  readonly amount: bigint;
  readonly borrowerHex: string;
  readonly verified: boolean;
  readonly status: "Pending" | "Approved" | "Rejected";
  readonly commitment: Uint8Array;
  readonly auditPackage: string;
};

export type OnChainDisclosure = {
  readonly id: bigint;
  readonly loanId: bigint;
  readonly auditorHex: string;
};

const toHexString = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const statusFromEnum = (value: ClearLend.LoanStatus): OnChainLoan["status"] => {
  switch (value) {
    case ClearLend.LoanStatus.APPROVED:
      return "Approved";
    case ClearLend.LoanStatus.REJECTED:
      return "Rejected";
    default:
      return "Pending";
  }
};

export const readLedger = async (): Promise<{
  loans: OnChainLoan[];
  disclosures: OnChainDisclosure[];
}> => {
  const { providers, address } = await getClearLendContext();
  const contractState = await providers.publicDataProvider.queryContractState(address);
  if (!contractState) return { loans: [], disclosures: [] };

  const ledger = ClearLend.ledger(contractState.data);
  const loans: OnChainLoan[] = [];
  for (let i = 0n; i < ledger.loanCount; i++) {
    if (!ledger.amounts.member(i)) continue;
    loans.push({
      id: i,
      amount: ledger.amounts.lookup(i),
      borrowerHex: toHexString(ledger.borrowers.lookup(i)),
      verified: ledger.verified.lookup(i),
      status: statusFromEnum(ledger.statuses.lookup(i)),
      commitment: ledger.commitments.lookup(i),
      auditPackage: ledger.auditPackages.lookup(i),
    });
  }

  const disclosures: OnChainDisclosure[] = [];
  for (let i = 0n; i < ledger.disclosureCount; i++) {
    if (!ledger.disclosureLoanIds.member(i)) continue;
    disclosures.push({
      id: i,
      loanId: ledger.disclosureLoanIds.lookup(i),
      auditorHex: toHexString(ledger.disclosureAuditors.lookup(i)),
    });
  }

  return { loans, disclosures };
};

/* ------------------------------------------------------------------ */
/* Private state helpers                                               */
/* ------------------------------------------------------------------ */

export const getPrivateState = async (): Promise<ClearLendPrivateState> => {
  const { providers } = await getClearLendContext();
  const state = await providers.privateStateProvider.get(CLEARLEND_PRIVATE_STATE_KEY);
  return state ?? createClearLendPrivateState();
};

export const setPrivateState = async (state: ClearLendPrivateState): Promise<void> => {
  const { providers } = await getClearLendContext();
  await providers.privateStateProvider.set(CLEARLEND_PRIVATE_STATE_KEY, state);
};

/** Verify decrypted audit values against the on-chain ZK commitment. */
export const verifyCommitment = (
  income: bigint,
  debt: bigint,
  nonce: Uint8Array,
  onChainCommitment: Uint8Array,
): boolean => {
  const computed = ClearLend.pureCircuits.commitmentHash(income, debt, nonce);
  return toHexString(computed) === toHexString(onChainCommitment);
};
