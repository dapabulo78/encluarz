-- ============================================================
-- ROBLOX GITHUB LOADER - SETUP GUIDE
-- ============================================================

--[[
STEP 1: Enable HttpService
===============================
1. Di Roblox Studio, buka Game Settings
2. Cari "HttpService"
3. Toggle "Allow Http Requests" ke ON
4. Save

STEP 2: Prepare GitHub Repository
===============================
1. Upload TeleportModule.lua ke GitHub repo Anda
2. Repository harus PUBLIC (atau set akses token)
3. Pastikan file ada di path yang benar: Scripts/TeleportModule.lua

STEP 3: Update Configuration
===============================
Di RobloxGitHubLoader.lua, ganti:

local GITHUB_CONFIG = {
    USERNAME = "YOUR_GITHUB_USERNAME",     -- Ganti dengan username GitHub Anda
    REPO = "YOUR_REPO_NAME",               -- Ganti dengan nama repository
    BRANCH = "main",                       -- Sesuaikan jika pakai branch lain
    MODULE_PATH = "Scripts/TeleportModule.lua"
}

Contoh:
local GITHUB_CONFIG = {
    USERNAME = "syafiiyah",
    REPO = "encluarz",
    BRANCH = "main",
    MODULE_PATH = "Scripts/TeleportModule.lua"
}

STEP 4: Verify Raw GitHub URL
===============================
URL yang dihasilkan harus berbentuk:
https://raw.githubusercontent.com/USERNAME/REPO/BRANCH/PATH

Contoh yang benar:
✅ https://raw.githubusercontent.com/syafiiyah/encluarz/main/Scripts/TeleportModule.lua

Contoh SALAH:
❌ https://github.com/syafiiyah/encluarz/blob/main/Scripts/TeleportModule.lua
   (ini adalah web URL, bukan raw file)

STEP 5: Place Script di Game
===============================
1. Di Roblox Studio, taruh RobloxGitHubLoader.lua di:
   - ServerScriptService (untuk Server script)
   - LocalScript (untuk Client script)

2. Script akan otomatis:
   - Download TeleportModule dari GitHub
   - Parse dan load module
   - Return module untuk digunakan

STEP 6: Use the Module
===============================
-- Ambil loader script
local Loader = require(game.ServerScriptService:WaitForChild("RobloxGitHubLoader"))

-- Sekarang bisa pakai TeleportModule
print(Loader.GetMapCount())
print(Loader.GetLastUpdate())
]]


-- ============================================================
-- TROUBLESHOOTING untuk Roblox
-- ============================================================

--[[
ERROR: "HttpService is not available"
   ✅ Enable HttpService di Game Settings → Allow Http Requests

ERROR: "404 Not Found"
   ✅ Check URL format:
   - Gunakan RAW URL (raw.githubusercontent.com, bukan github.com)
   - Pastikan file ada di GitHub
   - Pastikan path benar (case-sensitive)

ERROR: "Access Denied" atau "403 Forbidden"
   ✅ Repository harus PUBLIC
   ✅ Atau gunakan GitHub token:
      local url = "https://raw.githubusercontent.com/..."
      local header = {["Authorization"] = "token YOUR_GITHUB_TOKEN"}
      HttpService:GetAsync(url, false, header)

ERROR: "Module tidak return value"
   ✅ Pastikan TeleportModule.lua ada ini di akhir:
      return TeleportModule

ERROR: "Obfuscated script error"
   ✅ Jika pakai hasilobfus.lua (obfuscated):
   - Load dengan script yang lebih permisif
   - Atau de-obfuscate dulu sebelum upload GitHub
]]


-- ============================================================
-- QUICK TEST SCRIPT (Copy-paste di ServerScript)
-- ============================================================

--[[
local HttpService = game:GetService("HttpService")

-- Test GitHub connection
local TEST_URL = "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/Scripts/TeleportModule.lua"

print("🔍 Testing GitHub connection...")
print("URL: " .. TEST_URL)

local success, response = pcall(function()
    return HttpService:GetAsync(TEST_URL, false)
end)

if success then
    print("✅ HTTP Request: Success (" .. #response .. " bytes)")

    local chunk = load(response, TEST_URL)
    if chunk then
        print("✅ Script parsing: Success")

        local module = chunk()
        if module then
            print("✅ Module loaded!")
            print("Type: " .. type(module))

            if module.GetMapCount then
                print("✅ GetMapCount() works: " .. module.GetMapCount())
            end
        else
            print("❌ Module returned nil")
        end
    else
        print("❌ Script parsing failed")
    end
else
    print("❌ HTTP Error: " .. response)
end
]]


-- ============================================================
-- ALTERNATIVE: Load Obfuscated Version
-- ============================================================

--[[
Untuk hasilobfus.lua (obfuscated version):

local HttpService = game:GetService("HttpService")

local OBFUSCATED_URL = "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/Scripts/hasilobfus.lua"

local success, response = pcall(function()
    return HttpService:GetAsync(OBFUSCATED_URL, false)
end)

if success then
    -- Obfuscated code mungkin create function yang return module
    local chunk = load(response, OBFUSCATED_URL)
    local TeleportModule = chunk()

    -- Atau bisa jadi module disimpan di global variable
    TeleportModule = TeleportModule or _G.TeleportModule or _G.o

    return TeleportModule
else
    error("Failed: " .. response)
end
]]
