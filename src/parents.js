import { addToArray } from "./util";

const parentsStack = [];
let child = null;

export function startCapturingParents(_child, parents) {
  parentsStack.push({ parents, offset: 0, child: _child });
  child = _child;
}
export function retrieveParentsFrame() {
  return parentsStack[parentsStack.length - 1];
}
export function stopCapturingParents() {
  parentsStack.pop();
  child =
    parentsStack.length === 0
      ? null
      : parentsStack[parentsStack.length - 1].child;
}

export function maybeCaptureParent(p) {
  if (child === null) return;

  const frame = parentsStack[parentsStack.length - 1];
  const idx = frame.parents.indexOf(p);

  if (idx === frame.offset) {
    // nothing to do, just skip over
    frame.offset++;
    return;
  }
  // look for this parent elsewhere
  if (idx === -1) {
    // not seen this parent yet, add it in the correct place
    // and push the one currently there to the end (likely that we'll be
    // getting rid of it)
    // sneaky hack for doing captureDereferences
    if (child !== void 0) {
      addToArray(p._activeChildren, child);
    }
    frame.parents.splice(frame.offset, 0, p);
    frame.offset++;
    return;
  }
  if (idx > frame.offset) {
    // seen this parent after current point in array, so swap positions
    // with current point's parent
    const tmp = frame.parents[idx];
    frame.parents[idx] = frame.parents[frame.offset];
    frame.parents[frame.offset] = tmp;
    frame.offset++;
  }
  // else seen this parent at previous point and so don't increment offset
}

export function captureDereferences(f) {
  const captured = [];
  startCapturingParents(void 0, captured);
  try {
    f();
  } finally {
    stopCapturingParents();
  }
  return captured;
}
