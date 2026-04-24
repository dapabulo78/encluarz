'use strict';

const { renameVariables }   = require('./steps/varRename');
const { encodeStrings }     = require('./steps/stringEncode');
const { insertJunkCode }    = require('./steps/junkCode');
const { flattenControlFlow }= require('./steps/controlFlow');
const { addAntiTamper }     = require('./steps/antiTamper');
const { wrapLayer }         = require('./steps/layerWrap');

/**
 * @typedef {Object} ObfuscateOptions
 * @property {boolean} [variableRename=true]
 * @property {boolean} [stringEncode=true]
 * @property {boolean} [junkCode=true]
 * @property {boolean} [controlFlow=true]
 * @property {boolean} [antiTamper=true]
 * @property {number}  [layers=2]          Number of XOR wrapper layers (1-5)
 * @property {number}  [junkDensity=0.35]  0.0 – 1.0 density of junk insertions
 */

const DEFAULTS = {
    variableRename: true,
    stringEncode:   true,
    junkCode:       true,
    controlFlow:    true,
    antiTamper:     true,
    layers:         2,
    junkDensity:    0.35,
};

/**
 * Obfuscate a Lua source string.
 * @param {string} code
 * @param {ObfuscateOptions} [opts]
 * @returns {{ ok: boolean, result?: string, error?: string }}
 */
function obfuscate(code, opts = {}) {
    const o = { ...DEFAULTS, ...opts };
    o.layers = Math.min(Math.max(o.layers, 1), 5);

    try {
        let out = code;

        // ── PHASE 1: SOURCE-LEVEL TRANSFORMS ──────────────────────────
        // Order matters:
        //   1. Rename vars first (before strings are scrambled)
        //   2. Encode strings
        //   3. Insert junk (after strings are safe)
        //   4. Flatten control flow
        //   5. Anti-tamper header

        if (o.variableRename) {
            out = renameVariables(out);
        }

        if (o.stringEncode) {
            out = encodeStrings(out);
        }

        if (o.junkCode) {
            out = insertJunkCode(out, o.junkDensity);
        }

        if (o.controlFlow) {
            out = flattenControlFlow(out);
        }

        if (o.antiTamper) {
            out = addAntiTamper(out);
        }

        // ── PHASE 2: BYTECODE WRAP LAYERS ─────────────────────────────
        for (let i = 0; i < o.layers; i++) {
            out = wrapLayer(out);
        }

        return { ok: true, result: out };

    } catch (err) {
        return { ok: false, error: err.message || String(err) };
    }
}

module.exports = { obfuscate };
