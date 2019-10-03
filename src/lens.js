import { setEquals } from "./util";
import { LENS } from "./types";
import { Derivation } from "./derivation";
import { atomically } from "./transactions";

export class Lens extends Derivation {
  constructor(descriptor, meta) {
    super(descriptor.get, meta);
    this._descriptor = descriptor;
    this._type = LENS;
  }

  _clone() {
    return setEquals(new Lens(this._descriptor), this._equals);
  }

  set(value) {
    atomically(() => {
      this._descriptor.set(value);
    });
  }
}
