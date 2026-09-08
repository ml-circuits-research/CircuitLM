import { one } from '../../generic.mjs';
export default a => String(one(a, 'text', '')).includes(String(one(a, 'part', '')));
