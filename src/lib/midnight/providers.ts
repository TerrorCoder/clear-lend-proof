/*
 * Midnight.js provider wiring for the browser.
 *
 * Connects to the Lace wallet via the DApp connector (window.midnight),
 * then assembles the providers midnight-js needs to build, prove, balance,
 * and submit transactions:
 *   - zkConfigProvider: fetches prover keys / zkir from this origin (public/)
 *   - proofProvider:    the proof server (from wallet config, or localhost:6300)
 *   - publicDataProvider: the network indexer (GraphQL)
 *   - walletProvider/midnightProvider: balance + submit through Lace
 *   - privateStateProvider: witness data, kept on-device (localStorage)
 */

import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { fromHex, toHex } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import {
  type Binding,
  type FinalizedTransaction,
  type Proof,
  type SignatureEnabled,
  Transaction,
  type TransactionId,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import type { MidnightProviders, UnboundTransaction } from "@midnight-ntwrk/midnight-js-types";
import type { PrivateStateId } from "@midnight-ntwrk/midnight-js-types";
import { setNetworkId, type NetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { localStoragePrivateStateProvider } from "./private-state-provider";

const COMPATIBLE_CONNECTOR_API_MAJOR = "4";

export const NETWORK_ID: string = (import.meta.env["VITE_NETWORK_ID"] as string) || "preprod";

export interface WalletSession {
  readonly connectedAPI: ConnectedAPI;
  /** Bech32m unshielded address — used for display. */
  readonly address: string;
  readonly coinPublicKey: string;
  readonly encryptionPublicKey: string;
  readonly networkId: string;
}

let walletSessionPromise: Promise<WalletSession> | undefined;

const findWallet = (): InitialAPI | undefined => {
  const injected = (window as unknown as { midnight?: Record<string, unknown> }).midnight;
  if (!injected) return undefined;
  return Object.values(injected).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === "object" &&
      "apiVersion" in wallet &&
      String((wallet as InitialAPI).apiVersion).split(".")[0] === COMPATIBLE_CONNECTOR_API_MAJOR,
  );
};

const waitForWallet = async (timeoutMs = 3000): Promise<InitialAPI> => {
  const start = Date.now();
  for (;;) {
    const wallet = findWallet();
    if (wallet) return wallet;
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        "Could not find the Midnight Lace wallet. Is the Lace (beta) browser extension installed and enabled?",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

// Candidate network ids to offer Lace, in order. The wallet is the source of
// truth: whichever id it accepts, we then adopt the network it *reports* via
// getConfiguration(). A network id Lace does not recognize crashes its
// authenticator mid-authorization ("Remote API with channel
// 'midnight-authenticator' shutdown"), so on that error we move to the next
// candidate rather than retrying the same one.
const candidateNetworkIds = (): string[] => [
  ...new Set([NETWORK_ID, "preview", "preprod", "undeployed"]),
];

const isStaleChannelError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /shutdown|no longer be used|channel|disconnected port/i.test(message);
};

const establishSession = async (): Promise<WalletSession> => {
  let lastError: unknown;
  for (const candidate of candidateNetworkIds()) {
    try {
      const initialAPI = await waitForWallet();
      const connectedAPI = await initialAPI.connect(candidate);
      const config = await connectedAPI.getConfiguration();
      // Adopt the wallet's actual network for everything downstream
      // (address formats, ledger serialization, endpoints).
      const walletNetworkId = config.networkId ?? candidate;
      setNetworkId(walletNetworkId as NetworkId);
      console.info(
        `[ClearLend] Connected to Lace on network "${walletNetworkId}" (requested "${candidate}").`,
      );
      const shielded = await connectedAPI.getShieldedAddresses();
      let address: string;
      try {
        address = (await connectedAPI.getUnshieldedAddress()).unshieldedAddress;
      } catch {
        address = shielded.shieldedCoinPublicKey;
      }
      return {
        connectedAPI,
        address,
        coinPublicKey: shielded.shieldedCoinPublicKey,
        encryptionPublicKey: shielded.shieldedEncryptionPublicKey,
        networkId: walletNetworkId,
      };
    } catch (error) {
      lastError = error;
      if (!isStaleChannelError(error)) throw error;
      console.warn(
        `[ClearLend] Lace rejected network id "${candidate}" (authenticator channel crashed) — trying the next candidate.`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error(
    `Lace could not connect on any known network id (tried: ${candidateNetworkIds().join(", ")}). ` +
      "Check which Midnight network your Lace wallet is on and set VITE_NETWORK_ID to match.",
  );
};

/** Connect to Lace (cached — subsequent calls reuse the authorized session). */
export const getWalletSession = (): Promise<WalletSession> => {
  if (!walletSessionPromise) {
    walletSessionPromise = establishSession().catch((error: unknown) => {
      walletSessionPromise = undefined;
      throw error;
    });
  }
  return walletSessionPromise;
};

export type ClearLendMidnightProviders<
  K extends string,
  PSI extends PrivateStateId,
  PS,
> = MidnightProviders<K, PSI, PS>;

export const buildProviders = async <K extends string, PSI extends PrivateStateId, PS>(): Promise<
  MidnightProviders<K, PSI, PS>
> => {
  const session = await getWalletSession();
  const { connectedAPI } = session;
  const config = await connectedAPI.getConfiguration();
  const zkConfigProvider = new FetchZkConfigProvider<K>(window.location.origin, fetch.bind(window));

  return {
    privateStateProvider: localStoragePrivateStateProvider<PSI, PS>(),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      config.proverServerUri ?? "http://localhost:6300",
      zkConfigProvider,
    ),
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    walletProvider: {
      getCoinPublicKey(): string {
        return session.coinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return session.encryptionPublicKey;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        void ttl;
        const serializedTx = toHex(tx.serialize());
        const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          "signature",
          "proof",
          "binding",
          fromHex(received.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const txIdentifiers = tx.identifiers();
        const txId = txIdentifiers[0];
        if (txId === undefined) {
          throw new Error("Submitted transaction produced no transaction id");
        }
        return txId;
      },
    },
  };
};
