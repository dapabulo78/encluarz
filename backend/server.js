const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ─── MATCHA ENGINE ────────────────────────────────────────
const { obfuscate: customObfuscate } = require('../Matcha/engine');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── RATE LIMITER ─────────────────────────────────────────
// In-memory store: { key -> { count, resetAt } }
const rateLimitStore = new Map();

function getRateLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    let entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        rateLimitStore.set(key, entry);
    }
    entry.count++;
    const remaining = Math.max(0, maxRequests - entry.count);
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: entry.count <= maxRequests, remaining, retryAfter };
}

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitStore.entries()) {
        if (now > val.resetAt) rateLimitStore.delete(key);
    }
}, 5 * 60 * 1000);

// Middleware factory
function rateLimiter({ maxRequests = 10, windowMs = 60000, keyFn = null, message = null } = {}) {
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const session = token ? validateSession(token) : null;

        // Key: prefer per-user, fallback to per-IP
        const key = keyFn
            ? keyFn(req, session, ip)
            : (session ? `user:${session.username}:${req.path}` : `ip:${ip}:${req.path}`);

        const { allowed, remaining, retryAfter } = getRateLimit(key, maxRequests, windowMs);

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil((rateLimitStore.get(key)?.resetAt || Date.now()) / 1000));

        if (!allowed) {
            res.setHeader('Retry-After', retryAfter);
            return res.status(429).json({
                error: message || `Terlalu banyak request. Coba lagi dalam ${retryAfter} detik.`,
                retryAfter,
            });
        }
        next();
    };
}

// Preset limiters
const obfuscateRateLimit = rateLimiter({ maxRequests: 10, windowMs: 60 * 1000 });      // 10/menit per user/IP
const loginRateLimit     = rateLimiter({ maxRequests: 5,  windowMs: 15 * 60 * 1000,   // 5 attempt/15 menit per IP
    keyFn: (req, _s, ip) => `ip:${ip}:login`,
    message: 'Terlalu banyak percobaan login. Tunggu 15 menit.' });
const registerRateLimit  = rateLimiter({ maxRequests: 3,  windowMs: 60 * 60 * 1000,   // 3 register/jam per IP
    keyFn: (req, _s, ip) => `ip:${ip}:register`,
    message: 'Terlalu banyak registrasi dari IP ini.' });
// ──────────────────────────────────────────────────────────
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const GH_TOKEN  = process.env.GH_TOKEN;
const GH_OWNER  = "dapabulo78";
const GH_REPO   = "encluarz";
const GH_BRANCH = "main";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

const scriptCache = new Map();
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// ─── DETECT LUA BINARY ───────────────────────────────────
let LUA_BIN = 'lua5.1';
(function detectLua() {
    const candidates = ['lua5.4', 'lua5.3', 'lua5.1', 'lua'];
    const { execSync } = require('child_process');
    for (const bin of candidates) {
        try {
            execSync(`${bin} -v`, { stdio: 'ignore' });
            LUA_BIN = bin;
            console.log(`[Encluarz] Lua binary: ${bin}`);
            return;
        } catch (e) {}
    }
    console.warn('[Encluarz] WARNING: Tidak ada lua binary ditemukan!');
})();

// ─── SESSION STORE (persistent ke disk) ──────────────────
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

function loadSessions() {
    try {
        if (fs.existsSync(SESSIONS_FILE)) {
            const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
            const now = Date.now();
            const valid = Object.fromEntries(
                Object.entries(raw).filter(([, s]) => s.expires > now)
            );
            return new Map(Object.entries(valid));
        }
    } catch (e) {}
    return new Map();
}

function saveSessions(map) {
    try {
        const obj = Object.fromEntries(map.entries());
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {}
}

const sessions = loadSessions();

function generateToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

function createSession(username, role) {
    const token = generateToken();
    sessions.set(token, {
        username,
        role,
        expires: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 hari (persistent)
    });
    saveSessions(sessions);
    return token;
}

function validateSession(token) {
    if (!token) return null;
    const s = sessions.get(token);
    if (!s) return null;
    if (Date.now() > s.expires) {
        sessions.delete(token);
        saveSessions(sessions);
        return null;
    }
    // Refresh session expiry setiap kali dipakai
    s.expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
    saveSessions(sessions);
    return s;
}

// ─── PROMETHEUS PRESETS ────────────────────────────────────
const PRESETS = {
    Weak: `return { LuaVersion="LuaU", NameGenerator="MangledShuffled", Steps={` +
          `{Name="WrapInFunction"},{Name="EncryptStrings"}` +
          `} }`,
    Medium: `return { LuaVersion="LuaU", NameGenerator="MangledShuffled", Steps={` +
            `{Name="WrapInFunction"},{Name="ConstantArray"},{Name="EncryptStrings"},{Name="SplitStrings"}` +
            `} }`,
    Strong: `return { LuaVersion="LuaU", NameGenerator="MangledShuffled", Steps={` +
            `{Name="WrapInFunction"},{Name="ConstantArray"},{Name="EncryptStrings"},` +
            `{Name="SplitStrings"},{Name="ProxifyLocals"}` +
            `} }`,
};

// ─── USER DATABASE ────────────────────────────────────────
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        }
    } catch (e) {}
    const defaults = {
        admin:   { password: process.env.ADMIN_PASS || 'rbx2026',   role: 'admin', count: 0, logs: [] },
        xyzazen: { password: process.env.OWNER_PASS || 'loader123', role: 'admin', count: 0, logs: [] }
    };
    saveUsers(defaults);
    return defaults;
}

function saveUsers(users) {
    try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); } catch (e) {}
}

let usersDB = loadUsers();
let totalScriptsAllTime = 0;
let skidAlerts = 0;

// ─── ANTI-TAMPER INJECTION ───────────────────────────────
function injectAntiTamper(originalScript) {
    const antiTamper = `
-- @@PROTECTED BY RBX.LOADER@@
local _AT = (function()
    local _ok, _err = pcall(function()
        assert(typeof ~= nil,              "no typeof")
        assert(typeof(game) == "Instance", "no game")
        assert(typeof(workspace) == "Instance", "no workspace")
        assert(task ~= nil,                "no task")
        assert(task.wait ~= nil,           "no task.wait")
    end)
    if not _ok then
        while true do local _ = 1 + 1 end
    end

    local _t0 = os.clock()
    local _d  = 0
    for _i = 1, 1000 do _d = _d + _i end
    if (os.clock() - _t0) > 1.0 then
        while true do task.wait(0) end
    end

    local _SECRET_KEY = "rbx_loader_v2_protected"
    local _OWNER_TAG  = "xyzazen"
    local _CANARY     = {_SECRET_KEY, _OWNER_TAG}
    if _CANARY[1] ~= _SECRET_KEY or _CANARY[2] ~= _OWNER_TAG then
        while true do task.wait(0) end
    end
end)()
-- @@END PROTECTION@@

`;
    return antiTamper + '\n' + originalScript;
}

// ─── HELPERS ─────────────────────────────────────────────
function fetchWithRedirect(urlString, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        const parsedUrl = new URL(urlString);
        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const req = lib.get({
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: { 'User-Agent': 'RBX-Loader' }
        }, (res) => {
            if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
                res.resume();
                const redirectUrl = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : `${parsedUrl.protocol}//${parsedUrl.hostname}${res.headers.location}`;
                return resolve(fetchWithRedirect(redirectUrl, maxRedirects - 1));
            }
            resolve({ statusCode: res.statusCode, response: res });
        });
        req.on('error', reject);
    });
}

function sendTelegramAlert(msg) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    const payload = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'HTML' });
    const req = https.request({
        hostname: 'api.telegram.org', path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    });
    req.on('error', e => console.error('[TG Alert]', e.message));
    req.write(payload); req.end();
}

function sendTelegramFile(scriptContent, scriptId, loaderScript, username) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    const filename = `original_${scriptId}.lua`;
    const caption = `🚀 <b>New Obfuscation</b>\n\n👤 <b>User:</b> <code>${username||'unknown'}</code>\n🆔 <b>ID:</b> <code>${scriptId}</code>\n🔗 <b>Loadstring:</b>\n<code>${loaderScript}</code>`;
    const boundary = '----TelegramBoundary' + Date.now().toString(16);
    let payload = `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${TELEGRAM_CHAT_ID}\r\n`;
    payload += `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`;
    payload += `--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nHTML\r\n`;
    payload += `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${scriptContent}\r\n`;
    payload += `--${boundary}--\r\n`;
    const req = https.request({
        hostname: 'api.telegram.org', path: `/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
        method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
    });
    req.on('error', e => console.error('[TG File]', e.message));
    req.write(payload); req.end();
}

function uploadToGithub(filePath, content) {
    return new Promise((resolve) => {
        if (!GH_TOKEN) {
            console.warn(`[GitHub] GH_TOKEN tidak di-set! Script tidak di-backup.`);
            return resolve(false);
        }

        const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');
        const getSha = () => new Promise((res) => {
            const getReq = https.get({
                hostname: 'api.github.com',
                path: `/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}?ref=${GH_BRANCH}`,
                headers: { 'Authorization': `token ${GH_TOKEN}`, 'User-Agent': 'RBX-Loader' }
            }, (ghRes) => {
                const chunks = [];
                ghRes.on('data', d => chunks.push(d));
                ghRes.on('end', () => {
                    try { res(JSON.parse(Buffer.concat(chunks).toString('utf-8')).sha || null); }
                    catch (e) { res(null); }
                });
            });
            getReq.on('error', () => res(null));
        });

        getSha().then((sha) => {
            const payload = JSON.stringify({
                message: `Deploy: ${filePath}`, content: contentBase64,
                sha: sha || undefined, branch: GH_BRANCH
            });
            const putReq = https.request({
                hostname: 'api.github.com',
                path: `/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}`,
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GH_TOKEN}`, 'User-Agent': 'RBX-Loader',
                    'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload)
                }
            }, (r) => {
                if (r.statusCode === 200 || r.statusCode === 201) {
                    console.log(`[GitHub] Upload berhasil: ${filePath}`);
                    r.resume();
                    resolve(true);
                } else {
                    const chunks = [];
                    r.on('data', d => chunks.push(d));
                    r.on('end', () => {
                        console.error(`[GitHub] Upload gagal (${r.statusCode}): ${filePath}`);
                        resolve(false);
                    });
                }
            });
            putReq.on('error', (err) => { resolve(false); });
            putReq.write(payload);
            putReq.end();
        });
    });
}

function cleanupTempFiles(...files) {
    files.forEach(f => {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
    });
}

// ============================================================
//  AUTH ENDPOINTS
// ============================================================

app.post('/api/register', registerRateLimit, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    if (username.length < 3)
        return res.status(400).json({ error: 'Username minimal 3 karakter.' });
    if (password.length < 4)
        return res.status(400).json({ error: 'Password minimal 4 karakter.' });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
        return res.status(400).json({ error: 'Username hanya huruf, angka, underscore.' });
    if (usersDB[username])
        return res.status(409).json({ error: 'Username sudah digunakan.' });

    usersDB[username] = { password, role: 'user', count: 0, logs: [] };
    saveUsers(usersDB);
    res.json({ success: true });
});

app.post('/api/login', loginRateLimit, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username dan password wajib diisi.' });

    usersDB = loadUsers();
    const user = usersDB[username];

    if (!user || user.password !== password)
        return res.status(401).json({ error: 'Username atau password salah.' });

    const token = createSession(username, user.role);

    res.json({
        success: true,
        token,
        role: user.role,
        username,
        count: user.count || 0,
        logs: (user.logs || []).slice(-10).reverse()
    });
});

app.get('/api/user-stats', (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Missing username' });
    const user = usersDB[username];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
        count: user.count || 0,
        logs: (user.logs || []).slice(-10).reverse()
    });
});

app.get('/api/dashboard', (req, res) => {
    const allUsers = Object.entries(usersDB).map(([name, u]) => ({
        username: name,
        role: u.role,
        count: u.count || 0
    }));
    const recentLogs = Object.entries(usersDB)
        .flatMap(([name, u]) => (u.logs || []).map(l => ({ ...l, username: name })))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 20);
    res.json({
        totalScripts: totalScriptsAllTime,
        cacheActive: scriptCache.size,
        skidAlerts,
        serverStatus: 'ONLINE',
        users: allUsers,
        recentLogs
    });
});

// ============================================================
//  OBFUSCATE — Prometheus Only
// ============================================================

app.post('/api/obfuscate', obfuscateRateLimit, async (req, res) => {
    let { script, preset, useAntiTamper, useGithubBackup } = req.body;
    if (!script) return res.status(400).json({ error: "Script Kosong!" });

    const username = 'guest';
    const presetKey = PRESETS[preset] ? preset : 'Medium';
    const configContent = PRESETS[presetKey];
    const shouldInjectAntiTamper = useAntiTamper !== false;
    const shouldUploadGithub = useGithubBackup !== false;

    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.headers.host;

        const tempId = Date.now();
        const inputPath  = path.join(tempDir, `in_${tempId}.lua`);
        const outputPath = path.join(tempDir, `in_${tempId}.obfuscated.lua`);
        const configPath = path.join(tempDir, `config_${tempId}.lua`);

        const finalScript = shouldInjectAntiTamper ? injectAntiTamper(script) : script;
        fs.writeFileSync(inputPath, finalScript, 'utf-8');
        fs.writeFileSync(configPath, configContent);

        const prometheusPath = path.join(__dirname, '../Prometheus/cli.lua');
        const execCommand = `"${LUA_BIN}" "${prometheusPath}" --config "${configPath}" "${inputPath}"`;

        exec(execCommand,
            { maxBuffer: 1024 * 1024 * 50 },
            async (error, stdout, stderr) => {
                if (error || !fs.existsSync(outputPath)) {
                    cleanupTempFiles(inputPath, configPath);
                    console.error('[Obfuscate] Error:', stderr || error?.message);
                    return res.status(500).json({ error: "Obfuscation Failed!", detail: stderr || error?.message });
                }

                const obfuscatedCode = fs.readFileSync(outputPath, 'utf8');
                const scriptId = require('crypto').randomBytes(8).toString('hex');

                scriptCache.set(scriptId, obfuscatedCode);
                setTimeout(() => scriptCache.delete(scriptId), 60 * 60 * 1000);

                let githubOk = false;
                if (shouldUploadGithub) {
                    githubOk = await uploadToGithub(`Scripts/${scriptId}.lua`, obfuscatedCode);
                }

                const loader = `loadstring(game:HttpGet("${protocol}://${host}/Scripts?Id=${scriptId}"))()`;

                totalScriptsAllTime++;
                if (username && usersDB[username]) {
                    usersDB[username].count = (usersDB[username].count || 0) + 1;
                    if (!usersDB[username].logs) usersDB[username].logs = [];
                    usersDB[username].logs.push({ id: scriptId, ts: Date.now(), loader });
                    if (usersDB[username].logs.length > 50)
                        usersDB[username].logs = usersDB[username].logs.slice(-50);
                    saveUsers(usersDB);
                }

                sendTelegramFile(req.body.script, scriptId, loader, username);

                res.json({
                    success: true,
                    loader,
                    scriptId,
                    githubBackup: githubOk,
                    warning: (!shouldUploadGithub || githubOk) ? null :
                        'GitHub backup gagal. Loadstring hanya valid 1 jam.'
                });

                cleanupTempFiles(inputPath, outputPath, configPath);
            }
        );
    } catch (e) {
        console.error('[Obfuscate] Exception:', e.message);
        res.status(500).send(e.message);
    }
});

// ============================================================
//  CUSTOM ENGINE OBFUSCATE
// ============================================================

app.post('/api/obfuscate-custom', obfuscateRateLimit, async (req, res) => {
    const {
        script,
        useGithubBackup,
        variableRename = true,
        stringEncode   = true,
        junkCode       = true,
        controlFlow    = true,
        antiTamper     = true,
        layers         = 2,
        junkDensity    = 0.35,
    } = req.body;

    if (!script) return res.status(400).json({ error: 'Script Kosong!' });

    const username = 'guest';
    const shouldUploadGithub = useGithubBackup !== false;

    try {
        const result = customObfuscate(script, {
            variableRename,
            stringEncode,
            junkCode,
            controlFlow,
            antiTamper,
            layers: Math.min(Math.max(Number(layers) || 2, 1), 5),
            junkDensity: Math.min(Math.max(Number(junkDensity) || 0.35, 0), 1),
        });

        if (!result.ok) {
            return res.status(500).json({ error: 'Custom Engine Failed!', detail: result.error });
        }

        const obfuscatedCode = result.result;
        const scriptId = require('crypto').randomBytes(8).toString('hex');

        scriptCache.set(scriptId, obfuscatedCode);
        setTimeout(() => scriptCache.delete(scriptId), 60 * 60 * 1000);

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host     = req.headers['x-forwarded-host'] || req.headers.host;

        let githubOk = false;
        if (shouldUploadGithub) {
            githubOk = await uploadToGithub(`Scripts/${scriptId}.lua`, obfuscatedCode);
        }

        const loader = `loadstring(game:HttpGet("${protocol}://${host}/Scripts?Id=${scriptId}"))()`;

        totalScriptsAllTime++;
        if (username && usersDB[username]) {
            usersDB[username].count = (usersDB[username].count || 0) + 1;
            if (!usersDB[username].logs) usersDB[username].logs = [];
            usersDB[username].logs.push({ id: scriptId, ts: Date.now(), loader, engine: 'matcha' });
            if (usersDB[username].logs.length > 50)
                usersDB[username].logs = usersDB[username].logs.slice(-50);
            saveUsers(usersDB);
        }

        sendTelegramFile(script, scriptId, loader, username);

        return res.json({
            success: true,
            loader,
            scriptId,
            engine: 'matcha',
            githubBackup: githubOk,
            warning: (!shouldUploadGithub || githubOk) ? null :
                'GitHub backup gagal. Loadstring hanya valid 1 jam.',
        });

    } catch (e) {
        console.error('[Matcha] Exception:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================================
//  DEOBFUSCATE (admin only)
// ============================================================

app.post('/api/deobfuscate', async (req, res) => {

    const { script } = req.body;
    if (!script) return res.status(400).json({ error: 'Script kosong!' });

    const tempId = Date.now();
    const inputPath  = path.join(tempDir, `deobf_${tempId}.lua`);
    const deobfPath  = path.join(__dirname, 'deobfuscator.py');

    try {
        fs.writeFileSync(inputPath, script, 'utf-8');

        exec(`python3 "${deobfPath}" "${inputPath}"`,
            { maxBuffer: 1024 * 1024 * 50, timeout: 35000 },
            (error, stdout, stderr) => {
                cleanupTempFiles(inputPath);
                if (error && !stdout) {
                    return res.status(500).json({ error: 'Deobfuscation failed.', detail: stderr || error.message });
                }
                const output = stdout || '';
                if (!output.trim()) {
                    return res.status(500).json({ error: 'Tidak ada output.' });
                }
                res.json({ success: true, result: output });
            }
        );
    } catch (e) {
        cleanupTempFiles(inputPath);
        res.status(500).json({ error: e.message });
    }
});

// ─── SERVE SCRIPTS ───────────────────────────────────────
app.get('/Scripts', async (req, res) => {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const isExecutor = /Dalvik|Roblox|Seliware|HttpClient|lua-roblox|KRNL|Synapse|Fluxus|Wave|Delta|Electron|RBX|HttpGet/i.test(userAgent);
    const isBrowser  = /Mozilla|Chrome|Safari|Firefox|Opera|Edge/i.test(userAgent);

    if (isBrowser && !isExecutor) {
        skidAlerts++;
        sendTelegramAlert(`🚨 <b>SKID ALERT</b>\nIP: <code>${req.headers['x-forwarded-for'] || req.socket.remoteAddress}</code>\nUA: <code>${userAgent.slice(0,100)}</code>`);
        return res.status(403).sendFile(path.join(__dirname, 'public', '403.html'));
    }

    const scriptId = req.query.Id;
    if (!scriptId) return res.status(400).send("-- Missing Id");

    if (scriptCache.has(scriptId)) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(scriptCache.get(scriptId));
    }

    const githubRawUrl = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/Scripts/${scriptId}.lua?t=${Date.now()}`;
    try {
        const { statusCode, response } = await fetchWithRedirect(githubRawUrl);
        if (statusCode !== 200) {
            response.resume();
            return res.status(404).send("-- Script Not Found or Expired.");
        }
        const chunks = [];
        response.on('data', d => chunks.push(d));
        response.on('end', () => {
            const data = Buffer.concat(chunks).toString('utf-8');
            scriptCache.set(scriptId, data);
            setTimeout(() => scriptCache.delete(scriptId), 60 * 60 * 1000);
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.send(data);
        });
        response.on('error', () => {
            if (!res.headersSent) res.status(500).send("-- Internal Server Error");
        });
    } catch (err) {
        if (!res.headersSent) res.status(500).send("-- Internal Server Error");
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`[Encluarz] Live on port ${PORT} | Engine: Prometheus + Encluarz | Lua: ${LUA_BIN}`));
