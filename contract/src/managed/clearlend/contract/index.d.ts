import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum LoanStatus { PENDING = 0, APPROVED = 1, REJECTED = 2 }

export type Witnesses<PS> = {
  pendingLoanFinancials(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, [bigint,
                                                                                     bigint]];
  pendingLoanNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  submitLoanRequest(context: __compactRuntime.CircuitContext<PS>,
                    amount_0: bigint,
                    borrowerId_0: Uint8Array,
                    auditPackage_0: string): __compactRuntime.CircuitResults<PS, bigint>;
  approveLoan(context: __compactRuntime.CircuitContext<PS>, loanId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  requestDisclosure(context: __compactRuntime.CircuitContext<PS>,
                    loanId_0: bigint,
                    auditorId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  submitLoanRequest(context: __compactRuntime.CircuitContext<PS>,
                    amount_0: bigint,
                    borrowerId_0: Uint8Array,
                    auditPackage_0: string): __compactRuntime.CircuitResults<PS, bigint>;
  approveLoan(context: __compactRuntime.CircuitContext<PS>, loanId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  requestDisclosure(context: __compactRuntime.CircuitContext<PS>,
                    loanId_0: bigint,
                    auditorId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  commitmentHash(income_0: bigint, debt_0: bigint, nonce_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  submitLoanRequest(context: __compactRuntime.CircuitContext<PS>,
                    amount_0: bigint,
                    borrowerId_0: Uint8Array,
                    auditPackage_0: string): __compactRuntime.CircuitResults<PS, bigint>;
  approveLoan(context: __compactRuntime.CircuitContext<PS>, loanId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  requestDisclosure(context: __compactRuntime.CircuitContext<PS>,
                    loanId_0: bigint,
                    auditorId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  commitmentHash(context: __compactRuntime.CircuitContext<PS>,
                 income_0: bigint,
                 debt_0: bigint,
                 nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly loanCount: bigint;
  amounts: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  borrowers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  verified: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): boolean;
    [Symbol.iterator](): Iterator<[bigint, boolean]>
  };
  statuses: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): LoanStatus;
    [Symbol.iterator](): Iterator<[bigint, LoanStatus]>
  };
  commitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  auditPackages: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): string;
    [Symbol.iterator](): Iterator<[bigint, string]>
  };
  readonly disclosureCount: bigint;
  disclosureLoanIds: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  disclosureAuditors: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
