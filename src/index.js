import { derivablePrototype, mutablePrototype } from "./api";
import { withCapturing } from "./parents";
import { Atom } from "./atom";
import { Lens } from "./lens";
import { Derivation } from "./derivation";
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

export function lens(descriptor, meta) {
  return new Lens(descriptor, meta);
}

export function atom(value, meta) {
  return new Atom(value, meta);
}

export function derive(f, meta) {
  if (typeof f !== "function") {
    throw Error("derive requires function");
  }
  return new Derivation(f, meta);
}

export { setDebugMode };

// Private API
export { Reactor as __Reactor } from "./reactors";

export function __captureDereferences(f) {
  return withCapturing(void 0, [], f).parents;
}

Object.assign(Derivation.prototype, derivablePrototype);
Object.assign(Lens.prototype, derivablePrototype, mutablePrototype);
Object.assign(Atom.prototype, derivablePrototype, mutablePrototype);

if (global.__DERIVABLE_INIT_FLAG__) {
  console.warn(
    "Multiple instances of derivable have been initialized on the same page"
  );
}
global.__DERIVABLE_INIT_FLAG__ = true;
