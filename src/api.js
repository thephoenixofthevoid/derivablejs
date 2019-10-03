import { setEquals, equals, some } from "./util";
import { makeReactor } from "./reactors";
import { isDerivable } from "./types";
import { Derivation } from "./derivation.js";
import { unpack } from "./unpack";

export const derivablePrototype = {
  derive(f) {
    if (typeof f !== "function") {
      throw Error("derive requires function");
    }
    return new Derivation(() => f(this.get()));
  },

  maybeDerive(f) {
    if (typeof f !== "function") {
      throw Error("maybeDerive requires function");
    }
    return new Derivation(() => {
      const arg = this.get();
      return some(arg) ? f(arg) : null;
    });
  },

  orDefault(def) {
    if (!some(def)) {
      throw Error("orDefault requires non-null value");
    }
    return this.derive(value => (some(value) ? value : def));
  },

  react(f, opts) {
    makeReactor(this, f, opts);
  },

  maybeReact(f, opts) {
    let maybeWhen = this.derive(Boolean);
    if (opts && "when" in opts && opts.when !== true) {
      let when = opts.when;
      if (typeof when === "function" || when === false) {
        when = new Derivation(when);
      } else if (!isDerivable(when)) {
        throw new Error("when condition must be bool, function, or derivable");
      }
      maybeWhen = maybeWhen.derive(d => d && when.get());
    }
    makeReactor(this, f, Object.assign({}, opts, { when: maybeWhen }));
  },

  is(other) {
    return new Derivation(() => equals(this, this.get(), unpack(other)));
  },

  withEquality(_equals) {
    if (_equals) {
      if (typeof _equals !== "function") {
        throw new Error("equals must be function");
      }
    } else {
      _equals = null;
    }

    return setEquals(this._clone(), _equals);
  }
};

export const mutablePrototype = {
  update(f, a, b, c, d) {
    switch (arguments.length) {
      case 0:
        throw Error("update method accepts at least 1 argument");
      case 1:
        return this.set(f(this.get()));
      case 2:
        return this.set(f(this.get(), a));
      case 3:
        return this.set(f(this.get(), a, b));
      case 4:
        return this.set(f(this.get(), a, b, c));
      case 5:
        return this.set(f(this.get(), a, b, c, d));
      default:
        throw Error("update method accepts only 5 arguments");
    }
  }
};
