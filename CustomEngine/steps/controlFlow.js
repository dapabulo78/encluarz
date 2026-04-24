'use strict';

/**
 * Control Flow Flattening
 *
 * Wraps the entire script in a state-machine dispatcher.
 * Fake unreachable states are injected to confuse deobfuscators.
 */

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randHex(n) { return Math.floor(Math.random() * (16 ** n)).toString(16).padStart(n, '0'); }

function flattenControlFlow(code) {
    const sv  = '_cf' + randHex(4);  // state variable
    const tv  = '_ct' + randHex(4);  // dispatch table
    const fv  = '_cr' + randHex(4);  // runner func
    const ev  = '_ce' + randHex(4);  // entry state key

    const entryState = rand(10, 99);

    // Fake dead states that never execute
    const fakeStates = [];
    for (let i = 0; i < rand(3, 6); i++) {
        const fakeKey = rand(100, 999);
        const fv2 = '_fd' + randHex(4);
        fakeStates.push(
            `[${fakeKey}]=function() local ${fv2}=math.huge;if ${fv2}<0 then error("",0) end end`
        );
    }

    const flattened =
`local ${sv}=${entryState}
local ${tv}={
[${entryState}]=function()
${code}
end,
${fakeStates.join(',\n')}
}
local ${fv}=${tv}[${sv}]
if ${fv} then ${fv}() end
`;

    return flattened;
}

module.exports = { flattenControlFlow };
