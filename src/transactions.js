import { equals } from "./util.js";
import { DERIVATION, LENS, REACTOR } from "./types";
import { UNKNOWN, UNCHANGED, CHANGED } from "./types";

export function mark(node, reactors) {
  node._activeChildren.forEach(child => {
    switch (child._type) {
      case DERIVATION:
      case LENS:
        if (child._state !== UNKNOWN) {
          child._state = UNKNOWN;
          mark(child, reactors);
        }
        break;
      case REACTOR:
        reactors.push(child);
        break;
    }
  });
}

export function processReactors(reactors) {
  for (const r of reactors) {
    if (r._reacting)
      throw Error(
        "Synchronous cyclical reactions disallowed. " + "Use setImmediate."
      );
    r._maybeReact();
  }
}

const TransactionAbortion = {};
function initiateAbortion() {
  throw TransactionAbortion;
}

class TransactionContext {
  constructor(parent) {
    this.parent = parent;
    this.id2originalValue = {};
    this.modifiedAtoms = [];
  }

  preserveOriginalValue(atom) {
    if (atom._id in this.id2originalValue) return;
    this.modifiedAtoms.push(atom);
    this.id2originalValue[atom._id] = atom._value;
  }

  undo() {
    this.modifiedAtoms.forEach(atom => {
      atom._value = this.id2originalValue[atom._id];
      atom._state = UNCHANGED;
      mark(atom, []);
    });
  }
}

export function maybeTrack(atom) {
  if (currentCtx) currentCtx.preserveOriginalValue(atom);
}

let currentCtx = null;

export function inTransaction() {
  return currentCtx !== null;
}

export function transact(f) {
  beginTransaction();
  try {
    f(initiateAbortion);
  } catch (e) {
    abortTransaction();
    if (e !== TransactionAbortion) {
      throw e;
    }
    return;
  }
  commitTransaction();
}

export function atomically(f) {
  if (!inTransaction()) {
    transact(f);
  } else {
    f();
  }
}

export function transaction(f) {
  return (...args) => {
    let result;
    transact(() => {
      result = f(...args);
    });
    return result;
  };
}

export function atomic(f) {
  return (...args) => {
    let result;
    atomically(() => {
      result = f(...args);
    });
    return result;
  };
}

function beginTransaction() {
  currentCtx = new TransactionContext(currentCtx);
}

function commitTransaction() {
  const ctx = currentCtx;
  currentCtx = ctx.parent;

  if (currentCtx !== null) return;

  const reactors = [];
  ctx.modifiedAtoms.forEach(a => {
    if (equals(a, a._value, ctx.id2originalValue[a._id])) {
      a._state = UNCHANGED;
    } else {
      a._state = CHANGED;
      mark(a, reactors);
    }
  });
  processReactors(reactors);
  ctx.modifiedAtoms.forEach(a => {
    a._state = UNCHANGED;
  });
}

function abortTransaction() {
  currentCtx.undo();
  currentCtx = currentCtx.parent;
}

let _tickerRefCount = 0;

function tick() {
  commitTransaction();
  beginTransaction();
}

function reset() {
  abortTransaction();
  beginTransaction();
}

export function ticker() {
  if (_tickerRefCount++ === 0) beginTransaction();
  const _ = { tick, reset, release };
  function release() {
    _.release = _.tick = _.reset = () => {
      throw new Error("trying to use after ticker release");
    };
    if (--_tickerRefCount === 0) commitTransaction();
  }
  return _;
}
