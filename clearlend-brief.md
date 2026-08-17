# ClearLend — Claude Code Handoff Brief
### Midnight Network Integration for Brainwave 2026 Midnight Track

---

## 1. Project Summary

**ClearLend** is a privacy-preserving lending platform. Borrowers prove loan
eligibility (collateral ratio above a required threshold) using a zero-knowledge
proof, without revealing income or debt to the lender or the public. A
designated **Auditor** role can request selective disclosure of exactly one
loan's underlying figures for compliance review — every other loan on the
platform stays sealed.

This directly demonstrates Midnight's core thesis: **"prove compliance while
keeping private records confidential"** (their own docs language) — private by
default, selectively disclosable when authorized.

The UI (Lovable export) is fully built and functional with mocked data. This
brief is for wiring in real Midnight blockchain logic behind three existing
stub functions, without touching the UI/UX.

---

## 2. Current State (what already exists)

- Frontend: React app (Lovable export), three role views — Borrower / Lender / Auditor
- All UI flows work end-to-end with mocked data:
  - Borrower submits loan request → mock proof-generation delay → mock approval
  - Lender sees masked private fields ("🔒 Private"), can Approve a verified request
  - Auditor looks up one Loan ID → reveals disclosed income/debt/ratio for that
    loan only → logs the disclosure event (not the values)
- Three stub functions currently return mocked data after a delay:
  - `submitLoanProof()`
  - `approveLoan()`
  - `requestDisclosure()`
- There is also a `verifyProof()` stub used by the Lender view to check proof status

**Task: replace the internals of these four functions with real Midnight
integration, without changing their function signatures or the UI that calls them.**

---

## 3. What Needs to Be Built

### 3.1 Toolchain setup
- Install Midnight toolchain + Compact compiler (see
  https://docs.midnight.network/getting-started/installation)
- Set up local proof server (required for ZK proof generation)
- Install Lace wallet (beta) browser extension for signing
- Confirm Node/TypeScript environment compatibility with the existing React app

### 3.2 Compact smart contract

**Contract name:** `ClearLend`

**Public (on-chain, visible) state:**
- `loanId` — unique identifier
- `borrowerAddress` — wallet address (already pseudonymous)
- `amountRequested` — public loan amount
- `proofVerified` — boolean, set true once ZK proof validates
- `approvalStatus` — enum: Pending / Approved / Rejected
- `disclosureLog` — append-only list of `{ loanId, auditorId, timestamp }` —
  **never contains disclosed values, only the fact that a disclosure occurred**

**Private/witness data (never written to public ledger):**
- `annualIncome`
- `existingDebt`
- Derived: `collateralRatio = annualIncome / (existingDebt + amountRequested)` or
  similar formula — confirm exact formula logic, current mock doesn't need to
  match a real underwriting formula, just needs to be consistent

**Circuits (entry points) needed:**

1. **`submitLoanRequest`**
   - Public inputs: `amountRequested`
   - Private inputs (witnessed, not published): `annualIncome`, `existingDebt`
   - Logic: prove `collateralRatio >= REQUIRED_THRESHOLD` (pick a constant,
     e.g. 1.5x) without revealing the two private values
   - Output: writes public loan record with `proofVerified = true` if the
     proof is valid, `false`/rejected otherwise

2. **`approveLoan`**
   - Public input: `loanId`
   - Logic: lender-callable; only succeeds if `proofVerified == true`; updates
     `approvalStatus` to Approved
   - This is a simple state-transition circuit, no new ZK logic needed beyond
     checking the existing verified flag

3. **`requestDisclosure`**
   - Public input: `loanId`, requesting auditor's identity
   - Private input: the borrower's original `annualIncome` / `existingDebt`
     (retrieved from the borrower's local witness data — this requires the
     borrower's wallet/client to cooperate, i.e. this is a **borrower-authorized
     disclosure**, not an auditor unilaterally pulling private state)
   - Logic: this is the trickiest circuit — see Section 4 (Open Design Question)
     for two implementation approaches
   - Output: a disclosure record appended to `disclosureLog` (event only, no
     values), and returns the disclosed values to the *auditor's client only*
     (not written to public state)

### 3.3 Frontend integration (Midnight.js)

Replace stub internals only — keep exact function names/signatures so the
existing UI components don't need changes:

- `submitLoanProof(amountRequested, annualIncome, existingDebt)` →
  calls Midnight.js to invoke the `submitLoanRequest` circuit, sends the
  transaction, returns the result the UI already expects (loan id + verified
  boolean)
- `verifyProof(loanId)` → reads on-chain public state for that loan's
  `proofVerified` field
- `approveLoan(loanId)` → invokes the `approveLoan` circuit via Midnight.js
- `requestDisclosure(loanId, auditorId)` → invokes the `requestDisclosure`
  circuit, returns disclosed values to display in the Auditor UI

Also needed:
- Wallet connect flow: replace the mocked "Connect Lace Wallet" button with
  real Lace wallet connection via Midnight.js
- Environment config for pointing at Preview or PreProd network (not local
  Devnet) for the final deployed version, per hackathon requirement

---

## 4. Open Design Question — flag this to Claude Code explicitly

The `requestDisclosure` circuit is the one piece that doesn't have an obvious
default implementation, because "borrower-authorized disclosure" implies the
borrower needs to actively participate (sign/authorize) rather than the
auditor unilaterally decrypting something.

Two realistic approaches for a hackathon timeline:

**Option A (simpler, recommended given 7-day constraint):**
Borrower pre-authorizes disclosure at loan submission time by encrypting their
private values to the Auditor's public key as part of the same transaction,
gated behind a circuit condition (e.g. only decryptable if a valid
`requestDisclosure` call references that loan). This avoids needing the
borrower to be "online"/available when the auditor requests disclosure later,
which is much easier to demo reliably.

**Option B (more realistic to a real product, harder to build in time):**
True on-demand flow where the auditor's request triggers a notification the
borrower must approve live, at which point the borrower's client submits the
disclosure. Closer to "true" selective disclosure but adds a second live
participant to any demo and meaningfully more circuit + frontend complexity.

**Recommendation: go with Option A.** It still demonstrates the real ZK/selective
disclosure mechanism Midnight is built for, and keeps the demo self-contained
(judges clicking through alone don't need two live actors).

---

## 5. Deployment Requirements (per hackathon rules)

- Must deploy the smart contract to **Midnight Preview or PreProd** (not just
  local Devnet) — confirm exact steps in Midnight docs under Tutorials/Guides,
  as this step wasn't covered in the base Getting Started flow
- Must include clear documentation and setup instructions in the final repo
- Must provide a working demonstration — since judges self-navigate the live
  link, the deployed frontend must point at the Preview/PreProd contract, not
  local Devnet, by submission time

---

## 6. Suggested Build Order (for the 7-day window)

1. Toolchain install + Hello World Compact contract (confirms environment works)
2. Write and test `submitLoanRequest` circuit locally on Devnet — this is the
   core ZK mechanic and the riskiest part to get right
3. Write `approveLoan` (simple, low risk)
4. Write `requestDisclosure` using Option A above
5. Wire Midnight.js into the four frontend functions, test full loop on Devnet
6. Deploy to Preview/PreProd, re-point frontend, re-test full loop
7. Write README/setup docs
8. Buffer day for the inevitable SDK/version issues (flagged earlier — this
   ecosystem's tooling is still young and version mismatches are common)

---

## 7. What NOT to touch

- UI component structure, styling, role-switcher, layout — all finished and
  working, do not regenerate or restructure
- Function names/signatures for the four stub functions — keep them exact so
  no UI changes are needed
