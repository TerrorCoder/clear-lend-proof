import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";

export * from "./managed/clearlend/contract/index.js";
export * from "./witnesses.js";

import * as Generated from "./managed/clearlend/contract/index.js";
import { witnesses, type ClearLendPrivateState } from "./witnesses.js";

export const CompiledClearLendContract = CompiledContract.make<
  Generated.Contract<ClearLendPrivateState>
>("ClearLend", Generated.Contract<ClearLendPrivateState>).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets("./managed/clearlend"),
);
