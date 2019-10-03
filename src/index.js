import { derivablePrototype } from "./derivable";
import { mutablePrototype } from "./mutable";
import { Atom, atom } from "./atom";
import { Lens, lens } from "./lens";
import { Derivation, derive } from "./derivation";
import global from "./global";
import { setDebugMode } from "./util";

export { isDerivable, isAtom, isLens, isDerivation } from "./types";
export { unpack, struct } from "./unpack.js";
export {
  transact,
  transaction,
  ticker,
  atomic,
  atomically
} from "./transactions";

export { atom, lens, derive, setDebugMode };

// Private API
export { Reactor as __Reactor } from "./reactors";
export { captureDereferences as __captureDereferences } from "./parents";

Object.assign(Derivation.prototype, derivablePrototype);
Object.assign(Lens.prototype, derivablePrototype, mutablePrototype);
Object.assign(Atom.prototype, derivablePrototype, mutablePrototype);

if (global.__DERIVABLE_INIT_FLAG__) {
  console.warn(
    "Multiple instances of derivable have been initialized on the same page"
  );
}
global.__DERIVABLE_INIT_FLAG__ = true;
