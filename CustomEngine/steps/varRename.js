'use strict';

const { tokenize, detokenize, ALL_KEYWORDS } = require('../tokenizer');

// Lua built-ins & Roblox globals that must never be renamed
const PROTECTED = new Set([
    '_G','_ENV','_VERSION','print','error','assert','pcall','xpcall','type',
    'tostring','tonumber','ipairs','pairs','next','select','rawget','rawset',
    'rawequal','rawlen','setmetatable','getmetatable','require','load',
    'loadstring','loadfile','dofile','collectgarbage','string','table','math',
    'io','os','coroutine','debug','package','bit','utf8','arg','unpack',
    // Roblox globals
    'game','script','workspace','wait','task','spawn','delay','tick','time',
    'warn','Instance','Enum','CFrame','Vector3','Vector2','Vector2int16',
    'Vector3int16','Color3','BrickColor','UDim','UDim2','TweenInfo',
    'NumberSequence','ColorSequence','Ray','Rect','Region3','Axes','Faces',
    'Random','DateTime','RaycastParams','OverlapParams','PathWaypointAction',
    'SharedTable','buffer','typeof','getfenv','setfenv',
    // Meta
    '__index','__newindex','__call','__tostring','__len','__concat',
    '__unm','__add','__sub','__mul','__div','__mod','__pow','__eq',
    '__lt','__le','__idiv','__band','__bor','__bxor','__bnot','__shl','__shr',
    '_','__','...','self',
]);

// confusable chars pool for maximum visual confusion (I, l, 1 look alike)
const POOL = 'lIiLlIiLlIiL';

let _counter = 0;

function resetCounter() { _counter = 0; }

function genName() {
    _counter++;
    let n = _counter;
    let name = '_';
    do {
        name += POOL[n % POOL.length];
        n = Math.floor(n / POOL.length);
    } while (n > 0);
    // add random confusable suffix
    for (let k = 0; k < 5; k++) name += POOL[Math.floor(Math.random() * POOL.length)];
    return name;
}

function renameVariables(code) {
    resetCounter();
    const tokens = tokenize(code);
    const scopeStack = [new Map()];
    const result = [];
    let i = 0;

    const pushScope = () => scopeStack.push(new Map());
    const popScope = () => { if (scopeStack.length > 1) scopeStack.pop(); };

    function declare(name) {
        if (PROTECTED.has(name)) return name;
        const n = genName();
        scopeStack[scopeStack.length - 1].set(name, n);
        return n;
    }

    function lookup(name) {
        if (PROTECTED.has(name)) return null;
        for (let k = scopeStack.length - 1; k >= 0; k--) {
            if (scopeStack[k].has(name)) return scopeStack[k].get(name);
        }
        return null;
    }

    function pushResult(tok) { result.push(tok); }

    function peekNext(offset = 1) {
        let k = i + offset;
        while (k < tokens.length && tokens[k].type === 'whitespace') k++;
        return tokens[k];
    }

    while (i < tokens.length) {
        const tok = tokens[i];

        // Pass-through non-code tokens
        if (tok.type === 'string' || tok.type === 'comment' || tok.type === 'whitespace' || tok.type === 'number') {
            pushResult(tok); i++; continue;
        }

        // --- LOCAL declaration ---
        if (tok.type === 'keyword' && tok.value === 'local') {
            pushResult(tok); i++;
            // collect whitespace
            while (i < tokens.length && tokens[i].type === 'whitespace') { pushResult(tokens[i]); i++; }

            // local function
            if (i < tokens.length && tokens[i].type === 'keyword' && tokens[i].value === 'function') {
                pushResult(tokens[i]); i++;
                while (i < tokens.length && tokens[i].type === 'whitespace') { pushResult(tokens[i]); i++; }
                if (i < tokens.length && tokens[i].type === 'ident') {
                    const nn = declare(tokens[i].value);
                    pushResult({ type: 'ident', value: nn }); i++;
                }
                // now fall through to function body handling below (scan for '(')
                while (i < tokens.length && tokens[i].value !== '(') { pushResult(tokens[i]); i++; }
                if (i < tokens.length) { pushResult(tokens[i]); i++; } // '('
                pushScope();
                while (i < tokens.length && tokens[i].value !== ')') {
                    if (tokens[i].type === 'ident' && tokens[i].value !== '...') {
                        pushResult({ type: 'ident', value: declare(tokens[i].value) }); i++;
                    } else { pushResult(tokens[i]); i++; }
                }
                continue;
            }

            // local varlist = ...
            while (i < tokens.length && tokens[i].type === 'ident') {
                const nn = declare(tokens[i].value);
                pushResult({ type: 'ident', value: nn }); i++;
                while (i < tokens.length && tokens[i].type === 'whitespace') { pushResult(tokens[i]); i++; }
                if (i < tokens.length && tokens[i].value === ',') {
                    pushResult(tokens[i]); i++;
                    while (i < tokens.length && tokens[i].type === 'whitespace') { pushResult(tokens[i]); i++; }
                } else break;
            }
            continue;
        }

        // --- FUNCTION (non-local) —opens new scope for params ---
        if (tok.type === 'keyword' && tok.value === 'function') {
            pushResult(tok); i++;
            // emit function name (may be qualified: a.b.c or a:b)
            while (i < tokens.length && tokens[i].value !== '(') {
                if (tokens[i].type === 'ident') {
                    const nn = lookup(tokens[i].value);
                    pushResult({ type: 'ident', value: nn || tokens[i].value }); i++;
                } else { pushResult(tokens[i]); i++; }
            }
            if (i < tokens.length) { pushResult(tokens[i]); i++; } // '('
            pushScope();
            while (i < tokens.length && tokens[i].value !== ')') {
                if (tokens[i].type === 'ident' && tokens[i].value !== '...') {
                    pushResult({ type: 'ident', value: declare(tokens[i].value) }); i++;
                } else { pushResult(tokens[i]); i++; }
            }
            continue;
        }

        // --- FOR loop variables ---
        if (tok.type === 'keyword' && tok.value === 'for') {
            pushResult(tok); i++;
            while (i < tokens.length && tokens[i].type === 'whitespace') { pushResult(tokens[i]); i++; }
            pushScope();
            // collect loop vars until '=' or 'in'
            while (i < tokens.length && tokens[i].type === 'ident') {
                const nn = declare(tokens[i].value);
                pushResult({ type: 'ident', value: nn }); i++;
                while (i < tokens.length && tokens[i].type === 'whitespace') { pushResult(tokens[i]); i++; }
                if (i < tokens.length && tokens[i].value === ',') {
                    pushResult(tokens[i]); i++;
                    while (i < tokens.length && tokens[i].type === 'whitespace') { pushResult(tokens[i]); i++; }
                } else break;
            }
            continue;
        }

        // --- Scope openers (do, then, repeat open sub-scope, already handled by function/for above for do in for)
        if (tok.type === 'keyword' && (tok.value === 'do' || tok.value === 'repeat')) {
            // Only push scope if it wasn't already pushed by 'for'
            if (tok.value === 'do') {
                const prev = peekNext(-1); // unreliable, just always push
                pushScope();
            } else { pushScope(); }
            pushResult(tok); i++; continue;
        }

        if (tok.type === 'keyword' && (tok.value === 'end' || tok.value === 'until')) {
            popScope();
            pushResult(tok); i++; continue;
        }

        // --- IDENT usage: rename if in scope ---
        if (tok.type === 'ident') {
            const nn = lookup(tok.value);
            pushResult({ type: 'ident', value: nn || tok.value });
            i++; continue;
        }

        // everything else
        pushResult(tok); i++;
    }

    return detokenize(result);
}

module.exports = { renameVariables };
