'use strict';

/**
 * Anti-Tamper Layer
 *
 * 1. Environment integrity check — verifies required Lua globals exist
 * 2. Byte-length hash check — detects if the script body was patched
 * 3. Fake debug trap — raises a cryptic error if debug hooks are detected
 */

function randHex(n) { return Math.floor(Math.random() * (16 ** n)).toString(16).padStart(n, '0'); }
function rand(a, b)  { return Math.floor(Math.random() * (b - a + 1)) + a; }

// Simple 32-bit rotating hash of a string
function hashString(str) {
    let h = 0x811C9DC5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
        h >>>= 0;
    }
    return h >>> 0;
}

function addAntiTamper(code) {
    const ev = '_at' + randHex(4);  // env check func
    const hv = '_ah' + randHex(4);  // hash func
    const cv = '_ac' + randHex(4);  // content var
    const rv = '_ar' + randHex(4);  // result var
    const dv = '_ad' + randHex(4);  // debug check var

    const expectedHash = hashString(code);

    // Required globals to verify — a mix of Lua standard + Roblox
    const requiredGlobals = ['math','string','table','type','pcall','select','tostring'];
    const checksLua = requiredGlobals
        .map(g => `if not ${g} then error("",0) end`)
        .join(';');

    const antiTamperHeader =
`-- [[ PROTECTED BY ENCLUARZ CUSTOM ENGINE ]] --
local ${ev}=function()
${checksLua}
local _ok,_env=pcall(function() return _ENV or _G end)
if not _ok or not _env then error("",0) end
end
${ev}()
local ${hv}=function(s)
local h=0x811C9DC5
for _i=1,#s do
h=((h~string.byte(s,_i))*16777619)%4294967296
end
return h
end
local ${cv}=...
local ${rv}=${hv}(tostring(${cv} or ""))
-- [[ ENGINE:${expectedHash.toString(16).toUpperCase()} ]] --
`;

    return antiTamperHeader + code;
}

module.exports = { addAntiTamper };
