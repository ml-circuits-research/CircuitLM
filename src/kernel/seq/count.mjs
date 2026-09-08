import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => one(a, "items", []).length;
