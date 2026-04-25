-- ============================================================
-- GitHub Script Loader Utility
-- ============================================================

local LoaderUtil = {}

-- Configuration
LoaderUtil.GITHUB_RAW_URL = "https://raw.githubusercontent.com"
LoaderUtil.CACHE = {}

-- Load module dari GitHub dengan proper URL format
function LoaderUtil:loadFromGitHub(owner, repo, branch, filePath)
    local url = string.format(
        "%s/%s/%s/%s/%s",
        self.GITHUB_RAW_URL,
        owner,
        repo,
        branch or "main",
        filePath
    )

    return self:loadFromURL(url)
end

-- Load script dari URL
function LoaderUtil:loadFromURL(url)
    -- Check cache first
    if self.CACHE[url] then
        return self.CACHE[url]
    end

    local success, response = self:httpGet(url)

    if not success then
        error("Failed to load from " .. url .. ": " .. tostring(response))
    end

    -- Parse dan execute script
    local chunk, err = load(response, url)
    if not chunk then
        error("Failed to parse script from " .. url .. ": " .. tostring(err))
    end

    -- Cache result
    self.CACHE[url] = chunk

    -- Execute dan return result
    return chunk()
end

-- HTTP GET request (membutuhkan http library)
function LoaderUtil:httpGet(url)
    -- For Roblox
    if HttpService then
        return pcall(function()
            return HttpService:GetAsync(url, false)
        end)
    end

    -- For standard Lua (dengan socket)
    if http then
        return pcall(function()
            return http.get(url)
        end)
    end

    -- For node.js / autres
    if _G.fetch then
        local success, response = pcall(function()
            local res = _G.fetch(url)
            return res:text()
        end)
        return success, response
    end

    error("No HTTP library available. Install socket or use Roblox.")
end

-- Clear cache
function LoaderUtil:clearCache()
    self.CACHE = {}
end

return LoaderUtil
