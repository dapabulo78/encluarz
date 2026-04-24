'use strict';

const { tokenize, detokenize } = require('../tokenizer');

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randHex(len) {
    let s = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < len; i++) s += chars[rand(0, 15)];
    return s;
}
function junkVar() { return '_j' + randHex(6); }

// Templates for dead/unreachable junk code that is syntactically valid Lua
const JUNK_TEMPLATES = [
    () => {
        const v = junkVar(); const n = rand(100, 9999);
        return `local ${v}=${n};if ${v}~=${n} then error("",0) end `;
    },
    () => {
        const v = junkVar();
        return `local ${v}=math.max(0,0);`;
    },
    () => {
        const v = junkVar(); const a = rand(1, 50); const b = rand(51, 100);
        return `local ${v}=(function() return ${a} end)();if ${v}>=${b} then error("",0) end `;
    },
    () => {
        const v = junkVar();
        return `local ${v}=type(nil)~="nil" and error("",0);`;
    },
    () => {
        const v1 = junkVar(); const v2 = junkVar(); const n = rand(0, 255);
        return `local ${v1}=${n};local ${v2}=${v1}*1;assert(${v2}==${n},"");`;
    },
    () => {
        const v = junkVar();
        return `local ${v}=select("#");`;
    },
    () => {
        const v = junkVar(); const n = rand(1, 9);
        return `local ${v}=string.len(string.rep("x",${n}));if ${v}~=${n} then error("",0) end `;
    },
    () => {
        const v = junkVar();
        return `do local ${v}={}; ${v}=nil end `;
    },
];

function getJunk() {
    return JUNK_TEMPLATES[rand(0, JUNK_TEMPLATES.length - 1)]();
}

// Insert junk code after statement-ending tokens
function insertJunkCode(code, density = 0.35) {
    const tokens = tokenize(code);
    const result = [];
    
    // Statement-ending indicators
    const STMT_END_KW = new Set(['end', 'until', 'break', 'return']);
    
    for (let i = 0; i < tokens.length; i++) {
        result.push(tokens[i]);

        if (tokens[i].type === 'whitespace' && tokens[i].value.includes('\n')) {
            // Check if previous meaningful token ends a statement
            let prev = null;
            for (let k = result.length - 2; k >= 0; k--) {
                if (result[k].type !== 'whitespace' && result[k].type !== 'comment') {
                    prev = result[k]; break;
                }
            }

            if (prev && Math.random() < density) {
                const isGoodSpot = (
                    (prev.type === 'keyword' && STMT_END_KW.has(prev.value)) ||
                    prev.value === ';' ||
                    prev.type === 'number' ||
                    (prev.type === 'string') ||
                    prev.value === ')' ||
                    prev.value === ']'
                );
                if (isGoodSpot) {
                    result.push({ type: 'op', value: getJunk() + '\n' });
                }
            }
        }
    }

    return detokenize(result);
}

module.exports = { insertJunkCode };
