//#region lib/types/index.js
/**
* SuperGrok login wizard plugin, node half. Pure UI plugin: the empty apply
* exists so the plugin appears in the host cordis.yml / Loader; the browser
* half ships via exports["./client"], discovered through the package.json
* dsh.client declaration. The OAuth session itself is owned by
* `dsh-grok-oauth`, composed independently on the host
* roster.
*/
/** Host plugin body — no host-side behavior for this surface plugin. */
function apply() {}
//#endregion
export { apply };
