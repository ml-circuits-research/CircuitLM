import { one } from '../../generic.mjs';
import { validateGraph } from '../../graph.mjs';
export default (a, vm) => validateGraph(one(a, 'program'), vm).program;
