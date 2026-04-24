'use strict';

// Standard Lua 5.x keywords
const LUA_KEYWORDS = new Set([
    'and','break','do','else','elseif','end','false','for',
    'function','goto','if','in','local','nil','not','or',
    'repeat','return','then','true','until','while'
]);

// Luau-specific keywords (kept separate so callers can distinguish)
const LUAU_KEYWORDS = new Set([
    'type','export','continue'
]);

// Combined set used for tokenisation
const ALL_KEYWORDS = new Set([...LUA_KEYWORDS, ...LUAU_KEYWORDS]);

class Token {
    constructor(type, value, isLongStr = false) {
        this.type = type;
        this.value = value;
        this.isLongStr = isLongStr;
    }
}

function tokenize(source) {
    const tokens = [];
    let i = 0;
    const len = source.length;

    const peek = (off = 0) => (i + off < len ? source[i + off] : null);

    while (i < len) {
        const ch = source[i];

        // ----- COMMENTS -----
        if (ch === '-' && peek(1) === '-') {
            let j = i + 2;
            let eqCount = 0;
            if (source[j] === '[') {
                j++;
                while (j < len && source[j] === '=') { eqCount++; j++; }
                if (source[j] === '[') {
                    const close = ']' + '='.repeat(eqCount) + ']';
                    const end = source.indexOf(close, j + 1);
                    if (end !== -1) {
                        tokens.push(new Token('comment', source.slice(i, end + close.length)));
                        i = end + close.length;
                        continue;
                    }
                }
            }
            // Short comment
            const start = i;
            while (i < len && source[i] !== '\n') i++;
            tokens.push(new Token('comment', source.slice(start, i)));
            continue;
        }

        // ----- LONG STRINGS [=*[ ]=*] -----
        if (ch === '[' && (peek(1) === '[' || peek(1) === '=')) {
            let j = i + 1;
            let eqCount = 0;
            while (j < len && source[j] === '=') { eqCount++; j++; }
            if (source[j] === '[') {
                const close = ']' + '='.repeat(eqCount) + ']';
                const end = source.indexOf(close, j + 1);
                if (end !== -1) {
                    tokens.push(new Token('string', source.slice(i, end + close.length), true));
                    i = end + close.length;
                    continue;
                }
            }
        }

        // ----- QUOTED STRINGS (with \z whitespace-skip support) -----
        if (ch === '"' || ch === "'") {
            const q = ch;
            const start = i++;
            while (i < len) {
                if (source[i] === '\\') {
                    i++;
                    // \z: skip following whitespace (Lua 5.2+ / Luau)
                    if (i < len && source[i] === 'z') {
                        i++;
                        while (i < len && /\s/.test(source[i])) i++;
                    } else {
                        i++;
                    }
                } else if (source[i] === q) {
                    i++;
                    break;
                } else {
                    i++;
                }
            }
            tokens.push(new Token('string', source.slice(start, i)));
            continue;
        }

        // ----- LUAU INTERPOLATED STRINGS  `...{expr}...` -----
        if (ch === '`') {
            const start = i++;
            while (i < len) {
                if (source[i] === '\\') { i += 2; continue; }
                if (source[i] === '`') { i++; break; }
                i++;
            }
            tokens.push(new Token('interp_string', source.slice(start, i)));
            continue;
        }

        // ----- WHITESPACE -----
        if (/\s/.test(ch)) {
            const start = i;
            while (i < len && /\s/.test(source[i])) i++;
            tokens.push(new Token('whitespace', source.slice(start, i)));
            continue;
        }

        // ----- NUMBERS (hex, binary 0b, float, scientific, _ separators) -----
        if (/[0-9]/.test(ch) || (ch === '.' && peek(1) && /[0-9]/.test(peek(1)))) {
            const start = i;
            if (ch === '0' && (peek(1) === 'x' || peek(1) === 'X')) {
                // Hexadecimal (+ optional hex-float 0x1.8p+1)
                i += 2;
                while (i < len && /[0-9a-fA-F_]/.test(source[i])) i++;
                if (i < len && source[i] === '.') {
                    i++;
                    while (i < len && /[0-9a-fA-F_]/.test(source[i])) i++;
                }
                if (i < len && (source[i] === 'p' || source[i] === 'P')) {
                    i++;
                    if (i < len && (source[i] === '+' || source[i] === '-')) i++;
                    while (i < len && /[0-9_]/.test(source[i])) i++;
                }
            } else if (ch === '0' && (peek(1) === 'b' || peek(1) === 'B')) {
                // Luau binary literal 0b1010
                i += 2;
                while (i < len && /[01_]/.test(source[i])) i++;
            } else {
                // Decimal (Luau allows _ separators e.g. 1_000_000)
                while (i < len && /[0-9_]/.test(source[i])) i++;
                if (i < len && source[i] === '.') {
                    i++;
                    while (i < len && /[0-9_]/.test(source[i])) i++;
                }
                if (i < len && (source[i] === 'e' || source[i] === 'E')) {
                    i++;
                    if (i < len && (source[i] === '+' || source[i] === '-')) i++;
                    while (i < len && /[0-9_]/.test(source[i])) i++;
                }
            }
            tokens.push(new Token('number', source.slice(start, i)));
            continue;
        }

        // ----- IDENTIFIERS / KEYWORDS -----
        if (/[a-zA-Z_]/.test(ch)) {
            const start = i;
            while (i < len && /[a-zA-Z0-9_]/.test(source[i])) i++;
            const word = source.slice(start, i);
            let type = 'ident';
            if (LUA_KEYWORDS.has(word))       type = 'keyword';
            else if (LUAU_KEYWORDS.has(word)) type = 'keyword_luau';
            tokens.push(new Token(type, word));
            continue;
        }

        // ----- OPERATORS — longest-match (3 → 2 → 1 char) -----
        const three = source.slice(i, i + 3);
        if (three === '...') { tokens.push(new Token('op', three)); i += 3; continue; }

        const two = source.slice(i, i + 2);
        const TWO_OPS = new Set([
            // Standard Lua
            '..','==','~=','<=','>=','::',
            // Floor-division / bitwise shift
            '//','<<','>>',
            // Luau compound assignment
            '+=','-=','*=','/=','%=','^=','..=',
            // Luau compound bitwise
            '&=','|=',
            // Luau type-annotation arrow
            '->',
            // Not-equal alias (Luau also accepts !=)
            '!=',
        ]);
        if (TWO_OPS.has(two)) { tokens.push(new Token('op', two)); i += 2; continue; }

        // Single-char — includes Luau bitwise &  |  ~  ^  #  @
        tokens.push(new Token('op', ch));
        i++;
    }

    return tokens;
}

function detokenize(tokens) {
    return tokens.map(t => t.value).join('');
}

module.exports = { tokenize, detokenize, LUA_KEYWORDS, LUAU_KEYWORDS, ALL_KEYWORDS, Token };
