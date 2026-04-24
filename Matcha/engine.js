'use strict';

/**
 * Matcha Obfuscator Engine Adapter
 * 
 * Wraps XonistReal/matchaobfusc into the standard interface used by server.js:
 *   { ok: boolean, result?: string, error?: string }
 * 
 * SETUP: Clone https://github.com/XonistReal/matchaobfusc into this folder
 *   so that the following files exist next to this engine.js:
 *     - obfuscator.js
 *     - transforms.js
 *     - codegen.js
 *     - (etc.)
 */

let _obfuscate = null;

function loadMatcha() {
    if (_obfuscate) return _obfuscate;

    // Try the standard export patterns matchaobfusc might use
    let mod;
    try {
        mod = require('./matchaobfusc/obfuscator');
    } catch (e) {
        throw new Error('[Matcha] Failed to load obfuscator.js: ' + e.message +
            '\n→ Make sure you cloned https://github.com/XonistReal/matchaobfusc into the Matcha/ folder.');
    }

    // Handle: module.exports = function(code, opts) { ... }
    if (typeof mod === 'function') {
        _obfuscate = mod;
        return _obfuscate;
    }

    // Handle: module.exports = { obfuscate: function(...) { ... } }
    if (mod && typeof mod.obfuscate === 'function') {
        _obfuscate = mod.obfuscate.bind(mod);
        return _obfuscate;
    }

    // Handle: module.exports = { default: function(...) { ... } }
    if (mod && typeof mod.default === 'function') {
        _obfuscate = mod.default;
        return _obfuscate;
    }

    throw new Error('[Matcha] obfuscator.js loaded but no obfuscate function found. ' +
        'Expected: module.exports = function(code) or module.exports = { obfuscate }');
}

/**
 * Obfuscate a Lua source string using Matcha.
 *
 * Options are forwarded to Matcha as-is. Matcha may not support all of them
 * (variableRename, stringEncode, etc.) — unsupported keys are simply ignored.
 *
 * @param {string} code
 * @param {object} [opts]
 * @returns {{ ok: boolean, result?: string, error?: string }}
 */
function obfuscate(code, opts = {}) {
    try {
        const fn = loadMatcha();
        const result = fn(code, opts);

        // Matcha may return a string directly or an object with .code / .result
        if (typeof result === 'string') {
            return { ok: true, result };
        }
        if (result && typeof result.code === 'string') {
            return { ok: true, result: result.code };
        }
        if (result && typeof result.result === 'string') {
            return { ok: true, result: result.result };
        }
        if (result && typeof result.output === 'string') {
            return { ok: true, result: result.output };
        }

        // Promise-based API
        if (result && typeof result.then === 'function') {
            throw new Error('[Matcha] obfuscator.js returns a Promise. ' +
                'Update the /api/obfuscate-custom handler in server.js to use await.');
        }

        return { ok: false, error: '[Matcha] Unexpected return type from obfuscator: ' + typeof result };

    } catch (err) {
        return { ok: false, error: err.message || String(err) };
    }
}

module.exports = { obfuscate };
