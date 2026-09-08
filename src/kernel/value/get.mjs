import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => get(one(a, "value"), one(a, "key"), one(a, "default", null));
