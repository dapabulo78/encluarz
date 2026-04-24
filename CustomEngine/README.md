# Encluarz Custom Engine

Mesin obfuskasi Lua buatan sendiri yang berjalan paralel dengan Prometheus.

## Fitur

| Layer | Teknik | Deskripsi |
|-------|--------|-----------|
| 1 | **Variable Renaming** | Semua variabel lokal diganti nama jadi karakter `I`, `l`, `i` yang sulit dibedakan |
| 2 | **String XOR Encoding** | Semua string literal dienkripsi dengan XOR key acak, decode terjadi di runtime |
| 3 | **Junk Code Insertion** | Dead code yang tidak pernah dieksekusi disisipkan di antara statement |
| 4 | **Control Flow Flattening** | Seluruh script dibungkus dalam state-machine dispatcher + fake states |
| 5 | **Anti-Tamper** | Validasi environment Lua + integrity check |
| 6 | **XOR Layer Wrap (×N)** | Seluruh output dienkripsi ulang sebagai byte array, di-decode via `load()` |

## Penggunaan dari Node.js

```js
const { obfuscate } = require('./CustomEngine/engine');

const result = obfuscate(`print("hello world")`, {
    variableRename: true,
    stringEncode:   true,
    junkCode:       true,
    controlFlow:    true,
    antiTamper:     true,
    layers:         2,       // jumlah XOR layer (1-5)
    junkDensity:    0.35,    // kepadatan junk code (0.0 - 1.0)
});

if (result.ok) {
    console.log(result.result);
} else {
    console.error(result.error);
}
```

## Struktur Folder

```
CustomEngine/
├── engine.js          ← Orchestrator utama
├── tokenizer.js       ← Lua tokenizer (string/comment-aware)
├── package.json
├── README.md
└── steps/
    ├── varRename.js   ← Variable renaming dengan scope tracking
    ├── stringEncode.js← XOR encoding untuk string literal
    ├── junkCode.js    ← Dead code insertion
    ├── controlFlow.js ← Control flow flattening + fake states
    ├── antiTamper.js  ← Environment & integrity check
    └── layerWrap.js   ← XOR bytecode wrapping
```

## Integrasi dengan server.js

Engine ini sudah diintegrasikan ke endpoint `/api/obfuscate`.
Pilih engine dari dropdown **"Engine"** di UI:
- **Prometheus** — engine asli (preset: Minify / Medium / Heavy)
- **Custom Engine** — engine baru ini dengan opsi layer lengkap
