import { isDebug, setEquals, equals, removeFromArray, unique } from "./util";
import { maybeCaptureParent, withCapturing } from "./parents";
import { DERIVATION } from "./types";
import { CHANGED, UNCHANGED, UNKNOWN, DISCONNECTED } from "./types";

export class Derivation {
  constructor(deriver, meta = null) {
    this._deriver = deriver;
    this._parents = [];
    this._type = DERIVATION;
    this._value = unique;
    this._equals = null;
    this._activeChildren = [];
    this._state = DISCONNECTED;
    this._meta = meta;
    this._compute = () => (this._value = this._deriver());

    if (isDebug()) {
      this.stack = Error().stack;
    }
  }

  _clone() {
    return setEquals(new Derivation(this._deriver), this._equals);
  }

  _forceEval() {
    const prev = this._value;
    const frame = withCapturing(this, this._parents, this._compute);
    while (this._parents.length > frame.offset)
      detach(this._parents.pop(), this);
    return (this._state = equals(this, this._value, prev)
      ? UNCHANGED
      : CHANGED);
  }

  _update() {
    if (this._state === DISCONNECTED) {
      return this._forceEval();
    }

    if (this._state === UNKNOWN) {
      for (const parent of this._parents) {
        if (parent._state === UNKNOWN) parent._update();
        if (parent._state === CHANGED) return this._forceEval();
      }
      return (this._state = UNCHANGED);
    }
  }

  get() {
    maybeCaptureParent(this);
    if (this._activeChildren.length > 0) {
      this._update();
    } else {
      withCapturing(void 0, [], this._compute);
    }
    return this._value;
  }
}

export function detach(parent, child) {
  removeFromArray(parent._activeChildren, child);
  if (parent._activeChildren.length === 0) {
    if (parent._parents) {
      while (parent._parents.length) {
        detach(parent._parents.pop(), parent);
      }
      parent._state = DISCONNECTED;
    }
  }
}
