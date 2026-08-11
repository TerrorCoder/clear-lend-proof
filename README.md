# Clear Lend

Build a full-stack-looking web app called "ClearLend" — a privacy-preserving lending 

platform. This is a blockchain project (Midnight Network), so the 

UI should look professional and trustworthy (fintech aesthetic), but ALL blockchain logic 

must be mocked/stubbed for now — I will wire up real blockchain calls separately.

CONCEPT: 

ClearLend lets borrowers get loan approvals by proving their financial eligibility 

(e.g. "collateral ratio above required threshold") WITHOUT revealing their actual 

financial data to the lender or the public. Approved loans are recorded, but the 

underlying numbers stay private — except a designated "Auditor" role can request 

disclosure of ONE specific loan's details for compliance review, without seeing 

any other loan on the platform.

There are three user views/roles, accessible via a role switcher in the header 

(Borrower / Lender / Auditor) for demo purposes:

1. BORROWER VIEW

   - A dashboard where a borrower connects a wallet (button labeled "Connect Lace Wallet" 

     — just a mocked button/modal for now, no real wallet integration)

   - A form to request a loan: loan amount requested, and private inputs for income 

     and existing debt (these should visually indicate they're "private" / shielded, 

     e.g. with a lock icon and a note like "This value never leaves your device unencrypted")

   - A "Generate Proof & Submit" button that simulates a proof-generation loading state 

     (2-3 seconds, with a message like "Generating zero-knowledge proof...") then shows 

     a success state: "Loan approved — eligibility proven without revealing your financials"

   - A list of the borrower's past loan requests with status badges (Pending / Approved / Rejected)

2. LENDER VIEW

   - A table/list of incoming loan requests showing ONLY: requester's wallet address 

     (truncated, e.g. 0x7f3a...9c2d), loan amount requested, proof status (Verified / Not Verified), 

     and approval status — explicitly NOT showing income or debt (show a "🔒 Private" 

     label where that data would be)

   - An "Approve" button that becomes enabled only when proof status is "Verified"

   - A summary stats bar at top: Total loans issued, Total value, Average approval time

3. AUDITOR VIEW

   - A search/lookup interface: input a specific Loan ID

   - A "Request Disclosure" button that simulates a loading state ("Requesting selective 

     disclosure from borrower's proof...") then reveals a detail card showing that ONE 

     loan's underlying income/debt figures — with a clear banner: "This is a single, 

     borrower-authorized disclosure. All other loan data on the platform remains private."

   - Below it, a log/table of past disclosure requests (Loan ID, Auditor, Timestamp) — 

     this log itself should NOT show the disclosed values, just that a disclosure happened

GENERAL:

   - Landing page explaining the concept in plain language before you get to the 

     role-based dashboards: headline about proving compliance without sacrificing privacy, 

     3 short feature cards (Zero-Knowledge Proofs, Selective Disclosure, Instant Verification)

   - Clean, modern fintech design — dark navy/charcoal base with a single accent color 

     (electric blue or teal), generous whitespace, clear typography

   - All blockchain/proof-related actions should call clearly-named placeholder functions 

     like submitLoanProof(), verifyProof(), requestDisclosure(), approveLoan() — stub 

     them to return mock data after a short delay, so they're easy to find and replace later

   - Use React with a clean component structure, not one giant file

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://clear-lend-proof.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/40308e1d-912c-4481-b28b-5730f5ac1e04).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
