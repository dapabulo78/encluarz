# Matcha Obfuscator

This folder contains the Matcha Lua/LuaU obfuscator engine.

## Setup

Clone the matchaobfusc repo into this folder:

```bash
# From inside the encluarz/ directory:
git clone https://github.com/XonistReal/matchaobfusc Matcha --no-checkout
cd Matcha
git checkout main
```

Or manually copy the files from https://github.com/XonistReal/matchaobfusc into this folder.

After cloning, the folder should contain:
- `obfuscator.js`
- `transforms.js`
- `codegen.js`
- `app.js`
- `scripts.js`
- `style.css`
- `index.html`
- `scripts.html`
- `tutorials.html`
- `tutorials.js`
- `contents/`
- `engine.js`  ← this adapter (already present)

## How it works

`engine.js` is an adapter that wraps Matcha's `obfuscator.js` into the interface
expected by `backend/server.js`:

```js
const { obfuscate } = require('../Matcha/engine');
const result = obfuscate(luaCode, options);
// result: { ok: true, result: '...' } or { ok: false, error: '...' }
```
