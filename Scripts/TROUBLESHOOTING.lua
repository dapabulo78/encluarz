-- ============================================================
-- TROUBLESHOOTING: Script Load Failed dari GitHub
-- ============================================================

-- 🔴 ERROR 1: 404 Not Found
-- =========================================================
-- Penyebab: URL tidak benar atau file tidak ada di GitHub
--
-- ✅ Solusi:
-- 1. Gunakan RAW URL, bukan GitHub web URL:
--    ❌ https://github.com/USERNAME/REPO/blob/main/Scripts/TeleportModule.lua
--    ✅ https://raw.githubusercontent.com/USERNAME/REPO/main/Scripts/TeleportModule.lua
--
-- 2. Pastikan file benar-benar ada di repository
-- 3. Pastikan branch name benar (main, master, dll)
-- 4. Gunakan format path dengan underscore, bukan space


-- 🔴 ERROR 2: Access Denied / No Permission
-- =========================================================
-- Penyebab: Private repository atau rate limit
--
-- ✅ Solusi:
-- 1. Gunakan GitHub token (untuk private repos):
--    local url = "https://raw.githubusercontent.com/USERNAME/REPO/main/file.lua?token=YOUR_TOKEN"
--
-- 2. Tunggu beberapa menit jika kena rate limit (60 req/hour tanpa auth)
--
-- 3. Untuk Roblox, enable HttpService:
--    Game Settings → Security → Allow Http Requests: ON


-- 🔴 ERROR 3: Script Syntax Error
-- =========================================================
-- Penyebab: Script di GitHub punya syntax error
--
-- ✅ Solusi:
-- 1. Cek script di GitHub apakah ada error
-- 2. Obfuscated code mungkin perlu parser khusus
-- 3. Test local file terlebih dahulu sebelum upload GitHub


-- 🔴 ERROR 4: Module tidak return value
-- =========================================================
-- Penyebab: Script tidak punya 'return statement' di akhir
--
-- ✅ Solusi:
-- Pastikan TeleportModule.lua punya di akhir:
--    return TeleportModule
--
-- Atau tambahkan saat load:
--    local Module = load(response)
--    Module()  -- Execute
--    -- Kalau tidak return, akses dari global
--    return _G.TeleportModule


-- 🔴 ERROR 5: HttpService tidak tersedia
-- =========================================================
-- Penyebab: Environment tidak support HTTP (local Lua, old game)
--
-- ✅ Solusi:
-- Gunakan alternative loader yang mendukung:
--    - wget (command line)
--    - curl (command line)
--    - socket.http (Lua with LuaSockets)
--    - HttpService (Roblox)
--    - fetch (browser/Node.js)


-- ============================================================
-- BEST PRACTICES
-- ============================================================

-- 1. Selalu gunakan RAW URL
local URL = "https://raw.githubusercontent.com/USERNAME/REPO/main/path/to/file.lua"

-- 2. Wrap dalam try-catch (pcall)
local success, result = pcall(function()
    return load(HttpService:GetAsync(URL))()
end)

if not success then
    print("Error: " .. result)
end

-- 3. Cache hasil load untuk performa
local CACHE = {}
function loadModule(url)
    if CACHE[url] then
        return CACHE[url]
    end
    local module = load(HttpService:GetAsync(url))()
    CACHE[url] = module
    return module
end

-- 4. Provide fallback jika load gagal
local TeleportModule = (function()
    local success, result = pcall(function()
        return load(HttpService:GetAsync("https://..."))()
    end)
    if success then
        return result
    else
        -- Use local version / dummy module
        return require(script.Parent:FindFirstChild("TeleportModule"))
    end
end)()

-- ============================================================
-- QUICK TEST
-- ============================================================

-- Ganti dengan URL Anda:
local TEST_URL = "https://raw.githubusercontent.com/USERNAME/REPO/main/Scripts/TeleportModule.lua"

print("📡 Loading from: " .. TEST_URL)

local success, error_msg = pcall(function()
    local response = HttpService:GetAsync(TEST_URL, false)
    print("✅ HTTP Request: Success (" .. #response .. " bytes)")

    local chunk = load(response, TEST_URL)
    print("✅ Parse: Success")

    local module = chunk()
    print("✅ Execute: Success")

    if module.GetMapCount then
        print("✅ Module loaded! Maps: " .. module.GetMapCount())
    else
        print("⚠️  Module loaded but missing GetMapCount()")
    end
end)

if not success then
    print("❌ Failed: " .. error_msg)
end
