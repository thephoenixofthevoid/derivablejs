import { setEquals, equals, nextId } from "./util";
import {
  maybeTrack,
  inTransaction,
  mark,
  processReactors
} from "./transactions";
import { maybeCaptureParent } from "./parents";
import { ATOM } from "./types";
import { UNCHANGED, CHANGED } from "./states";
import global from "./global";

const devtoolsHook = global.__DERIVABLE_DEVTOOLS_HOOK__;

export class Atom {
  constructor(value, meta = null) {
    this._id = nextId();
    this._type = ATOM;
    this._activeChildren = [];
    this._value = value;
    this._state = UNCHANGED;
    this._equals = null;
    this._meta = meta;
  }

  _clone() {
    return setEquals(new Atom(this._value), this._equals);
  }

  set(value) {
    maybeTrack(this);

    const oldValue = this._value;
    this._value = value;

    if (inTransaction()) return;
    if (equals(this, value, oldValue)) return;

    try {
      this._state = CHANGED;
      const reactors = [];
      mark(this, reactors);
      processReactors(reactors);
    } finally {
      this._state = UNCHANGED;
    }
  }

  get() {
    if (typeof devtoolsHook === "function") {
      devtoolsHook("captureAtom", this);
    }
    maybeCaptureParent(this);
    return this._value;
  }
}
