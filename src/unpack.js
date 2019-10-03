import { isDerivable } from "./types";
import { Derivation } from "./derivation";

/**
 * dereferences a thing if it is dereferencable, otherwise just returns it.
 */

export function unpack(thing) {
  if (isDerivable(thing)) {
    return thing.get();
  } else {
    return thing;
  }
}

function deepUnpack(thing) {
  if (isDerivable(thing)) {
    return thing.get();
  }
  if (Array.isArray(thing)) {
    return thing.map(deepUnpack);
  }
  if (thing.constructor === Object) {
    const result = {};
    for (const key in thing) {
      result[key] = deepUnpack(thing[key]);
    }
    return result;
  }

  return thing;
}

export function struct(arg) {
  if (arg.constructor === Object || Array.isArray(arg)) {
    return new Derivation(() => deepUnpack(arg));
  } else {
    throw new Error("`struct` expects plain Object or Array");
  }
}
