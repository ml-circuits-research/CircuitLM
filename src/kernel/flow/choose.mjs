import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default (a, vm) => vm.run(one(a, one(a, "condition") ? "then" : "else"), one(a, "with", {}));
