import { addToArray } from "./util";

const parentsStack = [];

export function retrieveParentsFrame() {
  return parentsStack[parentsStack.length - 1];
}

export function withCapturing(child, parents, trackedCallback) {
  let frame;

  try {
    frame = { parents, offset: 0, child };
    parentsStack.push(frame);
    trackedCallback();
    frame = retrieveParentsFrame();
  } finally {
    parentsStack.pop();
  }

  return frame;
}

export function maybeCaptureParent(p) {
  if (!parentsStack.length) return null;
  const frame = retrieveParentsFrame();
  const { child, offset, parents } = frame;

  const idx = parents.indexOf(p);

  if (idx === -1) {
    // not seen this parent yet, add it in the correct place
    // and push the one currently there to the end (likely that we'll be
    // getting rid of it)
    // sneaky hack for doing captureDereferences
    if (child !== void 0) {
      addToArray(p._activeChildren, child);
    }
    parents.splice(offset, 0, p);
    frame.offset++;
    return;
  }

  if (idx > offset) {
    // seen this parent after current point in array, so swap positions
    // with current point's parent
    const tmp = parents[idx];
    parents[idx] = parents[offset];
    parents[offset] = tmp;
  }

  if (idx >= offset) {
    frame.offset++;
  }
}
