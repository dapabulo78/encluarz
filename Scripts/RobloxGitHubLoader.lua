-- ============================================================
-- Roblox GitHub Module Loader
-- Script ini load TeleportModule dari GitHub
-- ============================================================

local HttpService = game:GetService("HttpService")

-- CONFIGURATION - Ganti dengan GitHub info Anda
local GITHUB_CONFIG = {
    USERNAME = "YOUR_GITHUB_USERNAME",  -- Ganti
    REPO = "YOUR_REPO_NAME",             -- Ganti
    BRANCH = "main",                     -- atau "master"
    MODULE_PATH = "Scripts/TeleportModule.lua"  -- Path di repo
}

-- ============================================================
-- Module Loader Function
-- ============================================================

local ModuleCache = {}

local function buildRawGitHubURL(config)
    return string.format(
        "https://raw.githubusercontent.com/%s/%s/%s/%s",
        config.USERNAME,
        config.REPO,
        config.BRANCH,
        config.MODULE_PATH
    )
end

local function loadModuleFromGitHub(config)
    local url = buildRawGitHubURL(config)

    print("[Loader] 📡 Loading from: " .. url)

    -- Check cache
    if ModuleCache[url] then
        print("[Loader] ✅ Using cached module")
        return ModuleCache[url]
    end

    -- Fetch dari GitHub
    local success, response = pcall(function()
        return HttpService:GetAsync(url, false)
    end)

    if not success then
        error("[Loader] ❌ HTTP Error: " .. response)
    end

    print("[Loader] ✅ Downloaded " .. #response .. " bytes")

    -- Parse script
    local chunk, parseErr = load(response, url)
    if not chunk then
        error("[Loader] ❌ Parse Error: " .. parseErr)
    end

    print("[Loader] ✅ Script parsed successfully")

    -- Execute dan ambil result
    local result = chunk()

    -- Jika obfuscated, result mungkin di tempat lain
    if not result then
        -- Coba cari di _G
        result = _G.TeleportModule or _G.teleportmodule
        if result then
            print("[Loader] ⚠️  Module found in _G")
        end
    end

    if not result then
        error("[Loader] ❌ Module tidak return value")
    end

    -- Validate module
    if type(result) ~= "table" then
        error("[Loader] ❌ Module harus return table, got: " .. type(result))
    end

    if not result.GetMapCount then
        warn("[Loader] ⚠️  Module missing GetMapCount()")
    end

    -- Cache
    ModuleCache[url] = result
    print("[Loader] ✅ Module cached")

    return result
end

-- ============================================================
-- Usage
-- ============================================================

local TeleportModule = loadModuleFromGitHub(GITHUB_CONFIG)

-- Test
print("\n=== Testing TeleportModule ===")
print("Map Count: " .. TeleportModule.GetMapCount())
print("Last Update: " .. TeleportModule.GetLastUpdate())
print("Current Map: " .. TeleportModule.GetCurrentMap())

return TeleportModule
