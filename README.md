# ClearLend

Privacy-preserving lending on Midnight.

ClearLend lets borrowers prove loan eligibility with zero-knowledge proofs without revealing income or debt to the lender or the public. An auditor can request borrower-authorized disclosure for exactly one loan when compliance requires it, while every other loan stays private.

Live app: https://clear-lend-proof.lovable.app

## What this demo shows

- Borrowers submit a loan request and generate a proof locally.
- Lenders verify the proof before approving a loan.
- Auditors can request one authorized disclosure for compliance review.
- The disclosure event is logged on-chain, but the disclosed values are not.

## Tech Stack

- Frontend: React 19, TanStack Start, Tailwind CSS
- Wallet integration: Lace via the Midnight DApp connector API
- Contract language: Compact
- Chain access: Midnight.js
- Proof flow: local proof server + compiled prover assets

## Repository Layout

```text
contract/                   Compact contract source and generated artifacts
public/keys, public/zkir    Prover keys and ZK IR served to the browser
scripts/                    Utility scripts for generated assets
src/                        Frontend application
```

## Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop
- Google Chrome with the Lace wallet extension installed

## Quick Start

1. Install dependencies:

```sh
npm install
```

2. Build the Compact compiler image:

```sh
docker build -t clearlend-compact contract
```

3. Compile the contract:

```sh
npm run compact
```

4. Copy the generated prover assets into `public/`:

```sh
npm run compact:copy-assets
```

5. Start the local proof server:

```sh
npm run proof-server
```

6. Start the app:

```sh
npm run dev
```

The app runs at http://localhost:8080.

## Environment Setup

Copy `.env.example` to `.env` and configure the values you want to use:

```ini
VITE_NETWORK_ID=preprod
VITE_CLEARLEND_CONTRACT_ADDRESS=
```

- `VITE_NETWORK_ID` selects the Midnight network. The project defaults to `preprod`.
- `VITE_CLEARLEND_CONTRACT_ADDRESS` is optional. Leave it empty to auto-deploy a fresh contract instance on first wallet connect. If you want a shared fixed deployment, paste the deployed address here.

## Recommended Setup Flow

If you are preparing the project for GitHub and want a clean demo state, use this sequence:

1. Make sure `npm run compact` completes successfully.
2. Run `npm run compact:copy-assets` so the browser can load the current ZK assets.
3. Confirm `.env` points at the intended network.
4. Launch `npm run proof-server`.
5. Open the app with `npm run dev`.
6. Connect Lace and verify the Borrower, Lender, and Auditor views all load correctly.

## Available Scripts

- `npm run dev` - start the development server
- `npm run build` - build the production app
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint
- `npm run format` - format the codebase with Prettier
- `npm run compact` - compile the Compact contract
- `npm run compact:copy-assets` - copy generated prover assets into `public/`
- `npm run proof-server` - run the local Midnight proof server in Docker

## Contract Workflow

When you change the contract source in `contract/src/clearlend.compact`:

1. Rebuild the compiler image if needed.
2. Run `npm run compact`.
3. Run `npm run compact:copy-assets`.
4. Re-test the borrower, lender, and auditor flows in the browser.

The generated contract bindings and proof assets live under `contract/src/managed/clearlend/` and are used by the frontend at runtime.

## How the App Works

1. Borrower submits a loan request with private income and debt data.
2. The app generates a zero-knowledge proof locally and submits the transaction.
3. Lender checks that the proof is valid before approving the loan.
4. Auditor can request one authorized disclosure and verify the decrypted values against the on-chain commitment.

## Troubleshooting

- If proof generation fails, make sure the proof server is running on port 6300.
- If the browser cannot load ZK assets, rerun `npm run compact:copy-assets`.
- If wallet connection fails, confirm Lace is installed, unlocked, and pointed at the same network as `.env`.
- If the app deploys a new contract every time, set `VITE_CLEARLEND_CONTRACT_ADDRESS` to a fixed deployed address.
- If Docker commands fail on Windows, confirm Docker Desktop is running and using Linux containers.

## Demo Notes

- The app is a working demo, but some blockchain and proof operations are mocked in this build.
- The first wallet connection can auto-deploy a new contract instance if no contract address is configured.
- The live deployment is hosted at the URL above, but local setup is recommended if you plan to edit or verify the project before pushing.

## License

Copyright (c) 2026 Rose. All rights reserved.

This project is provided for evaluation and demo purposes only. No part of this
repository may be copied, modified, redistributed, or reproduced without the
owner's written permission.
