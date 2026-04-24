'use strict';

// Matcha adalah browser code — semua file-nya assign ke window.*
// Kita shim global.window = global supaya bisa jalan di Node.js
if (typeof window === 'undefined') {
    global.window = global;
}

let _loaded = false;

function loadMatcha() {
    if (_loaded) return;

    // 1. luaparse — npm package, assign ke global
    global.luaparse = require('luaparse');

    // 2. Load codegen.js  → sets window.LuaCodeGen
    require('./codegen');

    // 3. Load transforms.js → sets window.LuaTransforms
    require('./transforms');

    // 4. Load obfuscator.js → sets window.LuaObfuscator
    require('./obfuscator');

    if (!global.LuaObfuscator || typeof global.LuaObfuscator.obfuscate !== 'function') {
        throw new Error('[Matcha] LuaObfuscator.obfuscate tidak ditemukan setelah load.');
    }

    _loaded = true;
}

/**
 * Obfuscate Lua/LuaU code menggunakan Matcha.
 * Options mapping:
 *   variableRename → renameVars
 *   stringEncode   → encryptStrings
 *   controlFlow    → flattenFlow
 *   junkCode       → deadCode
 */
function obfuscate(code, opts = {}) {
    try {
        loadMatcha();

        const matchaOpts = {
            renameVars:     opts.variableRename !== false,
            encryptStrings: opts.stringEncode   !== false,
            flattenFlow:    opts.controlFlow    !== false,
            deadCode:       opts.junkCode       !== false,
            encodeConsts:   true,
        };

        const result = global.LuaObfuscator.obfuscate(code, matchaOpts);
        return { ok: true, result: result.code };

    } catch (err) {
        return { ok: false, error: err.message || String(err) };
    }
}

module.exports = { obfuscate };
