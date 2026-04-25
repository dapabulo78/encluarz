-- ============================================================
-- Contoh: Load TeleportModule dari GitHub
-- ============================================================

-- PILIHAN 1: Menggunakan LoaderUtil (Recommended)
-- =========================================================
local Loader = require(script.Parent.LoaderUtil)

-- Load TeleportModule dari GitHub (ganti USERNAME/REPO)
local TeleportModule = Loader:loadFromGitHub(
    "USERNAME",           -- GitHub username
    "REPO_NAME",          -- Repository name
    "main",               -- Branch (default: main)
    "Scripts/TeleportModule.lua"  -- File path
)

-- Atau gunakan URL langsung
-- local TeleportModule = Loader:loadFromURL(
--     "https://raw.githubusercontent.com/USERNAME/REPO_NAME/main/Scripts/TeleportModule.lua"
-- )


-- PILIHAN 2: Direct Load (Roblox saja)
-- =========================================================
-- local scriptUrl = "https://raw.githubusercontent.com/USERNAME/REPO_NAME/main/Scripts/TeleportModule.lua"
-- local success, response = pcall(function()
--     return game:GetService("HttpService"):GetAsync(scriptUrl, false)
-- end)
--
-- if not success then
--     error("Failed to load script: " .. response)
-- end
--
-- local TeleportModule = load(response, scriptUrl)()


-- PILIHAN 3: Menggunakan loadstring (Old Roblox)
-- =========================================================
-- local LoaderURL = "https://raw.githubusercontent.com/USERNAME/REPO_NAME/main/Scripts/LoaderUtil.lua"
-- local TeleportURL = "https://raw.githubusercontent.com/USERNAME/REPO_NAME/main/Scripts/TeleportModule.lua"
--
-- loadstring(game:GetService("HttpService"):GetAsync(LoaderURL))()
-- local TeleportModule = loadstring(game:GetService("HttpService"):GetAsync(TeleportURL))()


-- Testing
-- =========================================================
if TeleportModule and TeleportModule.GetLastUpdate then
    print("✅ TeleportModule loaded successfully!")
    print("Last update: " .. TeleportModule.GetLastUpdate())
    print("Map count: " .. TeleportModule.GetMapCount())
else
    error("❌ TeleportModule failed to load properly")
end

return TeleportModule
