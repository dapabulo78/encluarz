local prx = {}
local function childAdded(Instance)
    --local instType = typeof(Instance)
    --assert(instType == "Part" or instType == "MeshPart", "Error in positionChanged. expected BasePart got", instType)

    if not prx[Instance.Address] then
        prx[Instance.Address] = {childrenCount = #Instance:GetChildren(), instance = Instance}
    return nil end

    local childcount = #Instance:GetChildren()
    if childcount ~= prx[Instance.Address].childrenCount then
        prx[Instance.Address].childrenCount = childcount
    return true end

    return false
end

local function samePos(a, b) -- Because comparing things like Vectors or Instances doesnt work properly??
    if a and b then
        return a.X == b.X and a.Y == b.Y and a.Z == b.Z
    end
end

local function magnitude(v)
    return math.sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z)
end
local prx2 = {}
local function positionChanged(Instance)
    --local instType = typeof(Instance)
    --assert(instType == "Part" or instType == "MeshPart", "Error in positionChanged. expected BasePart got", instType)

    if not Instance.Position then return end

    if not prx2[Instance.Address] then
        prx2[Instance.Address] = {position = Instance.Position, instance = Instance}
    return nil end


    local pos = Instance.Position
    local newpos = prx2[Instance.Address].position

    if magnitude(pos - newpos) < 0.05 then return false end

    if not samePos(pos, newpos) then
        prx2[Instance.Address].position = pos
    return true end

    return false
end

local allparts = {} -- Upon Initialize
for _, v in pairs(game:GetService("Workspace"):GetDescendants()) do
    if v:IsA("Part") or v:IsA("MeshPart") then
        table.insert(allparts, v)
    end 
end

for _, v in pairs(allparts) do childAdded(v) end -- Add all to child checker List
for _, v in pairs(allparts) do positionChanged(v) end -- Add all to position checker List

local drawings = {}
local function updateDrawing(part)
    if not drawings[part.Address] then
        local line = Drawing.new("Line")
        line.From = Vector2.new(0,0)
        line.To = Vector2.new(0,0)
        line.Visible = true
        drawings[part.Address] = line
        return true
    else
        drawings[part.Address].To = WorldToScreen(part.Position)
    return false end
end
local function drawingVisibility(part, state)
    if drawings[part.Address] then
        drawings[part.Address].Visible = state
    end
end
local function removeDrawing(part)
    if drawings[part.Address] then
        drawings[part.Address]:Remove()
        drawings[part.Address] = nil
        return true
    end
    return false
end

local function main()
    while true do task.wait()
        for _, v in pairs(allparts) do
            if positionChanged(v) == true then
                updateDrawing(v)
            else
                drawingVisibility(v, false)
            end
        end
    end
end
task.spawn(main)
















-- ChatGPT optimized:
local Workspace = game:GetService("Workspace")

-- caches
local prx = {}   -- [addr] = childrenCount
local prx2 = {}  -- [addr] = lastPosition
local drawings = {} -- [addr] = line

-- constants
local EPS = 0.1
local EPS2 = EPS * EPS

-- utils
local function dist2(a, b)
    local dx = a.X - b.X
    local dy = a.Y - b.Y
    local dz = a.Z - b.Z
    return dx*dx + dy*dy + dz*dz
end

-- child change check (kept, but faster)
local function childAdded(inst)
    local addr = inst.Address
    local count = #inst:GetChildren()
    local old = prx[addr]

    if old == nil then
        prx[addr] = count
        return nil
    end

    if count ~= old then
        prx[addr] = count
        return true
    end

    return false
end

-- position change check (no sqrt, fewer lookups)
local function positionChanged(inst)
    local pos = inst.Position
    if pos == nil then return nil end

    local addr = inst.Address
    local oldPos = prx2[addr]

    if oldPos == nil then
        prx2[addr] = pos
        return nil
    end

    -- ignore tiny jitter
    if dist2(pos, oldPos) <= EPS2 then
        return false
    end

    prx2[addr] = pos
    return true
end

-- drawings
local function ensureDrawing(part)
    local addr = part.Address
    local line = drawings[addr]
    if not line then
        line = Drawing.new("Line")
        line.From = Vector2.new(0, 0)
        line.To = Vector2.new(0, 0)
        line.Visible = false
        drawings[addr] = line
    end
    return line
end

local function setVisible(part, state)
    local line = drawings[part.Address]
    if line then
        line.Visible = state
    end
end

local function updateDrawing(part)
    local line = ensureDrawing(part)
    line.To = WorldToScreen(part.Position)
    line.Visible = true
end

-- build parts list (faster)
local allparts = {}
do
    local desc = Workspace:GetDescendants()
    for i = 1, #desc do
        local v = desc[i]
        if v:IsA("BasePart") then
            allparts[#allparts + 1] = v
        end
    end
end

-- prime caches (numeric loops)
for i = 1, #allparts do childAdded(allparts[i]) end
for i = 1, #allparts do positionChanged(allparts[i]) end

-- main loop (numeric loop)
local function main()
    while true do
        task.wait()
        for i = 1, #allparts do
            local v = allparts[i]
            if positionChanged(v) then
                updateDrawing(v)
            else
                setVisible(v, false)
            end
        end
    end
end

task.spawn(main)