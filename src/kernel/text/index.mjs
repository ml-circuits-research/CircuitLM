import { one } from '../../generic.mjs';
export default a => String(one(a, 'text', '')).indexOf(String(one(a, 'part', '')));
