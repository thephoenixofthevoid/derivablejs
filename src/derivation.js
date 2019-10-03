import { isDebug, setEquals, equals, removeFromArray, unique } from "./util";
import { maybeCaptureParent, withCapturing } from "./parents";
import { DERIVATION } from "./types";
import { CHANGED, UNCHANGED, UNKNOWN, DISCONNECTED } from "./states";

export class Derivation {
  constructor(deriver, meta = null) {
    this._deriver = deriver;
    this._parents = null;
    this._type = DERIVATION;
    this._value = unique;
    this._equals = null;
    this._activeChildren = [];
    this._state = DISCONNECTED;
    this._meta = meta;

    if (isDebug()) {
      this.stack = Error().stack;
    }
  }

  _clone() {
    return setEquals(new Derivation(this._deriver), this._equals);
  }

  _forceEval() {
    let newVal = null;

    const newNumParents = withCapturing(this, this._parents, () => {
      newVal = this._deriver();
    }).offset;

    this._state = equals(this, newVal, this._value) ? UNCHANGED : CHANGED;

    for (let i = newNumParents, len = this._parents.length; i < len; i++) {
      const oldParent = this._parents[i];
      detach(oldParent, this);
      this._parents[i] = null;
    }

    this._parents.length = newNumParents;
    this._value = newVal;
  }

  _update() {
    if (this._state === DISCONNECTED) {
      this._parents = [];
      // this._state === DISCONNECTED
      return this._forceEval();
      // this._state === CHANGED ?
    }

    if (this._state === UNKNOWN) {
      for (const parent of this._parents) {
        if (parent._state === UNKNOWN) parent._update();
        if (parent._state === CHANGED) {
          this._forceEval();
          break;
        }
      }
    }
    if (this._state === UNKNOWN) {
      this._state = UNCHANGED;
    }
  }

  get() {
    maybeCaptureParent(this);
    if (this._activeChildren.length > 0) {
      this._update();
    } else {
      withCapturing(void 0, [], () => {
        this._value = this._deriver();
      });
    }
    return this._value;
  }
}

export function detach(parent, child) {
  removeFromArray(parent._activeChildren, child);
  if (parent._activeChildren.length === 0 && parent._parents != null) {
    for (const p of parent._parents) detach(p, parent);
    parent._parents = null;
    parent._state = DISCONNECTED;
  }
}
