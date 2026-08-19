//#region lib/types/index.js
/**
* Speech-generation settings plugin, node half. The empty apply exists so the
* plugin appears in the host cordis.yml / Loader; the browser half ships via
* exports["./client"].
*/
/** Host plugin body — no host-side behavior for this surface plugin. */
function apply() {}
//#endregion
export { apply };
