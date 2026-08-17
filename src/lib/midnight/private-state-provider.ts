/*
 * localStorage-backed private state provider.
 *
 * Keeps the borrower's witness data (income/debt/nonce per loan) on-device
 * and persistent across page reloads — required so a borrower can submit a
 * loan in one session and the demo can still prove/disclose later.
 * Adapted from the in-memory provider in midnightntwrk/example-bboard.
 */

import type {
  ContractAddress,
  SigningKey,
} from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import type {
  ExportPrivateStatesOptions,
  ExportSigningKeysOptions,
  ImportPrivateStatesOptions,
  ImportPrivateStatesResult,
  ImportSigningKeysOptions,
  ImportSigningKeysResult,
  PrivateStateExport,
  PrivateStateId,
  PrivateStateProvider,
  SigningKeyExport,
} from "@midnight-ntwrk/midnight-js-types";

const STATE_KEY = "clearlend/private-states";
const KEYS_KEY = "clearlend/signing-keys";

type StoredStates = Record<string, Record<string, unknown>>;
type StoredKeys = Record<string, SigningKey>;

const load = <T>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown): void => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const localStoragePrivateStateProvider = <
  PSI extends PrivateStateId,
  PS = unknown,
>(): PrivateStateProvider<PSI, PS> => {
  let contractAddress: ContractAddress | null = null;

  const requireContractAddress = (): ContractAddress => {
    if (contractAddress === null) {
      throw new Error("Contract address not set on private state provider.");
    }
    return contractAddress;
  };

  const readStates = (): StoredStates => load<StoredStates>(STATE_KEY, {});
  const readKeys = (): StoredKeys => load<StoredKeys>(KEYS_KEY, {});

  const scoped = (all: StoredStates, address: ContractAddress): Record<string, unknown> =>
    all[address] ?? {};

  return {
    setContractAddress(address: ContractAddress): void {
      contractAddress = address;
    },
    set(key: PSI, state: PS): Promise<void> {
      const address = requireContractAddress();
      const all = readStates();
      all[address] = { ...scoped(all, address), [key]: state };
      save(STATE_KEY, all);
      return Promise.resolve();
    },
    get(key: PSI): Promise<PS | null> {
      const address = requireContractAddress();
      const value = scoped(readStates(), address)[key];
      return Promise.resolve(value === undefined ? null : (value as PS));
    },
    remove(key: PSI): Promise<void> {
      const address = requireContractAddress();
      const all = readStates();
      const states = scoped(all, address);
      delete states[key];
      all[address] = states;
      save(STATE_KEY, all);
      return Promise.resolve();
    },
    clear(): Promise<void> {
      const address = requireContractAddress();
      const all = readStates();
      delete all[address];
      save(STATE_KEY, all);
      return Promise.resolve();
    },
    setSigningKey(address: ContractAddress, signingKey: SigningKey): Promise<void> {
      const keys = readKeys();
      keys[address] = signingKey;
      save(KEYS_KEY, keys);
      return Promise.resolve();
    },
    getSigningKey(address: ContractAddress): Promise<SigningKey | null> {
      return Promise.resolve(readKeys()[address] ?? null);
    },
    removeSigningKey(address: ContractAddress): Promise<void> {
      const keys = readKeys();
      delete keys[address];
      save(KEYS_KEY, keys);
      return Promise.resolve();
    },
    clearSigningKeys(): Promise<void> {
      save(KEYS_KEY, {});
      return Promise.resolve();
    },
    exportPrivateStates(options?: ExportPrivateStatesOptions): Promise<PrivateStateExport> {
      void options;
      const address = requireContractAddress();
      const states = scoped(readStates(), address);
      return Promise.resolve({
        format: "midnight-private-state-export",
        encryptedPayload: JSON.stringify({
          contractAddress: address,
          states: Object.fromEntries(
            Object.entries(states).map(([id, value]) => [id, JSON.stringify(value)]),
          ),
        }),
        salt: "clearlend-localstorage-private-state-provider",
      });
    },
    importPrivateStates(
      exportData: PrivateStateExport,
      options?: ImportPrivateStatesOptions,
    ): Promise<ImportPrivateStatesResult> {
      const address = requireContractAddress();
      const conflictStrategy = options?.conflictStrategy ?? "error";
      const payload = JSON.parse(exportData.encryptedPayload) as {
        states?: Record<string, string>;
      };
      const incoming = payload.states ?? {};
      const all = readStates();
      const states = scoped(all, address);
      let imported = 0;
      let skipped = 0;
      let overwritten = 0;

      for (const [stateId, serialized] of Object.entries(incoming)) {
        const exists = stateId in states;
        if (exists) {
          if (conflictStrategy === "skip") {
            skipped += 1;
            continue;
          }
          if (conflictStrategy === "error") {
            return Promise.reject(new Error(`Private state conflict for '${stateId}'`));
          }
          overwritten += 1;
        } else {
          imported += 1;
        }
        states[stateId] = JSON.parse(serialized);
      }

      all[address] = states;
      save(STATE_KEY, all);
      return Promise.resolve({ imported, skipped, overwritten });
    },
    exportSigningKeys(options?: ExportSigningKeysOptions): Promise<SigningKeyExport> {
      void options;
      return Promise.resolve({
        format: "midnight-signing-key-export",
        encryptedPayload: JSON.stringify({ keys: readKeys() }),
        salt: "clearlend-localstorage-signing-key-provider",
      });
    },
    importSigningKeys(
      exportData: SigningKeyExport,
      options?: ImportSigningKeysOptions,
    ): Promise<ImportSigningKeysResult> {
      const conflictStrategy = options?.conflictStrategy ?? "error";
      const payload = JSON.parse(exportData.encryptedPayload) as {
        keys?: Record<string, SigningKey>;
      };
      const incoming = payload.keys ?? {};
      const keys = readKeys();
      let imported = 0;
      let skipped = 0;
      let overwritten = 0;

      for (const [address, signingKey] of Object.entries(incoming)) {
        const exists = address in keys;
        if (exists) {
          if (conflictStrategy === "skip") {
            skipped += 1;
            continue;
          }
          if (conflictStrategy === "error") {
            return Promise.reject(new Error(`Signing key conflict for '${address}'`));
          }
          overwritten += 1;
        } else {
          imported += 1;
        }
        keys[address] = signingKey;
      }

      save(KEYS_KEY, keys);
      return Promise.resolve({ imported, skipped, overwritten });
    },
  };
};
