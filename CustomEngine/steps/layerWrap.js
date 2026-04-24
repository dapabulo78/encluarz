'use strict';

/**
 * Layer Wrap
 *
 * Encodes the entire script as an XOR-obfuscated byte array.
 * At runtime, the bytes are decoded back and executed via load/loadstring.
 * Each call generates a unique random key, so each layer looks different.
 */

function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randHex(n) { return Math.floor(Math.random() * (16 ** n)).toString(16).padStart(n, '0'); }

function xorEncode(str, key) {
    const bytes = new Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i) ^ ((key + i) % 256);
    }
    return bytes;
}

/**
 * Wrap `code` string in a XOR-decode + load() shell.
 * @param {string} code  Lua source to encode
 * @param {number} [forceKey]  Optional key (random if omitted)
 * @returns {string} new Lua source that decodes and runs the original
 */
function wrapLayer(code, forceKey) {
    const key   = forceKey !== undefined ? forceKey : rand(10, 245);
    const bytes = xorEncode(code, key);

    // Variable names that are deliberately confusable
    const bv = '_lb' + randHex(4);  // byte table
    const dv = '_ld' + randHex(4);  // decoded string
    const iv = '_li' + randHex(4);  // loop index
    const fv = '_lf' + randHex(4);  // load function

    // Split byte array into chunks to avoid single-line length limits
    const CHUNK = 200;
    const chunks = [];
    for (let i = 0; i < bytes.length; i += CHUNK) {
        chunks.push(bytes.slice(i, i + CHUNK).join(','));
    }

    // Build the byte-table declaration across multiple lines
    const tableLines = chunks.map(c => c).join(',\n');

    const wrapper =
`local ${bv}={${tableLines}}
local ${dv}=""
for ${iv}=1,#${bv} do
${dv}=${dv}..string.char(${bv}[${iv}]~((${key}+${iv}-1)%256))
end
local ${fv}=load or loadstring
assert(${fv},"load not available")
local _ok,_err=${fv}(${dv})
if not _ok then error(_err or "",0) end
_ok()`;

    return wrapper;
}

module.exports = { wrapLayer };
