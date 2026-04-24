'use strict';

const { tokenize, detokenize } = require('../tokenizer');

function randomKey() { return Math.floor(Math.random() * 180) + 20; }

function xorBytes(str, key) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) ^ ((key + i) % 256));
    }
    return bytes;
}

// Parse escape sequences in a Lua quoted string into raw string
function parseQuoted(raw) {
    const inner = raw.slice(1, -1); // strip quotes
    let result = '';
    let i = 0;
    while (i < inner.length) {
        if (inner[i] === '\\') {
            i++;
            switch (inner[i]) {
                case 'n':  result += '\n'; i++; break;
                case 't':  result += '\t'; i++; break;
                case 'r':  result += '\r'; i++; break;
                case 'a':  result += '\x07'; i++; break;
                case 'b':  result += '\x08'; i++; break;
                case 'f':  result += '\x0C'; i++; break;
                case 'v':  result += '\x0B'; i++; break;
                case '\\': result += '\\'; i++; break;
                case '"':  result += '"'; i++; break;
                case "'":  result += "'"; i++; break;
                case '\n': result += '\n'; i++; break;
                case 'x': {
                    const hex = inner.slice(i+1, i+3);
                    result += String.fromCharCode(parseInt(hex, 16));
                    i += 3; break;
                }
                case 'z': {
                    i++;
                    while (i < inner.length && /\s/.test(inner[i])) i++;
                    break;
                }
                default: {
                    // decimal escape
                    let num = '';
                    while (i < inner.length && /[0-9]/.test(inner[i]) && num.length < 3) {
                        num += inner[i++];
                    }
                    if (num.length) { result += String.fromCharCode(parseInt(num, 10)); }
                    else { result += inner[i++]; }
                    break;
                }
            }
        } else {
            result += inner[i++];
        }
    }
    return result;
}

function encodeStrings(code) {
    const tokens = tokenize(code);
    const key = randomKey();

    // Generate unique decoder var name
    const dv = '_sd' + Math.floor(Math.random() * 0xFFFF).toString(16);
    const kv = '_sk' + Math.floor(Math.random() * 0xFFFF).toString(16);

    const decoderSnippet =
        `local ${kv}=${key};` +
        `local ${dv}=function(b)` +
        `local s=""` +
        `for _i=1,#b do s=s..string.char(b[_i]~((${kv}+_i-1)%256))end ` +
        `return s end;`;

    let hasEncoded = false;
    const result = tokens.map(tok => {
        if (tok.type === 'string' && !tok.isLongStr) {
            try {
                const raw = tok.value;
                const str = parseQuoted(raw);
                // Skip empty strings or very short ones that aren't worth encoding
                if (str.length === 0) return tok;
                const bytes = xorBytes(str, key);
                hasEncoded = true;
                return { type: 'op', value: `${dv}({${bytes.join(',')}})` };
            } catch (e) {
                return tok; // fallback: keep original
            }
        }
        return tok;
    });

    const out = detokenize(result);
    return hasEncoded ? decoderSnippet + out : out;
}

module.exports = { encodeStrings };
