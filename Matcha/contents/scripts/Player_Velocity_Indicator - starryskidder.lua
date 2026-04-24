local players = game:GetService("Players")

local drawings = {}
local function updateDrawing(part, From, To)
    if not part then return end

    if not drawings[part.Address] then
        local line = Drawing.new("Line")
        line.Visible = true

        line.Color = Color3.fromRGB(math.random(1,255), math.random(1,255), math.random(1,255))
        line.Thickness = 3

        drawings[part.Address] = line
        return true
    else
        if not To and not From then return false end
        drawings[part.Address].To = To
        drawings[part.Address].From = From
    return false end
end
local function drawingVisibility(part, state)
    if drawings[part.Address] then
        drawings[part.Address].Visible = state
    end
end
local function removeDrawing(part)
    if not part then return end

    if drawings[part.Address] then
        drawings[part.Address]:Remove()
        drawings[part.Address] = nil
        return true
    end
    return false
end

local function magnitude(Vec3)
    return math.sqrt(Vec3.X * Vec3.X + Vec3.Y * Vec3.Y + Vec3.Z * Vec3.Z)
end

local function normalize(Vec3)
    local mag = magnitude(Vec3)
    if mag == 0 then return Vector3.new(0, 0, 0) end

    return Vector3.new(Vec3.X / mag, Vec3.Y / mag, Vec3.Z / mag)
end

-- add players
local hrps = {}
spawn(function() while true do task.wait(2)
    for _, v in pairs(players:GetPlayers()) do
        local char = v and v.Character
        local hrp = char and char.HumanoidRootPart
        if hrp then hrps[v.Address] = hrp else print("No HRP for: ", v.Name) end
        updateDrawing(hrp)
    end end
end)

players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(char)
        local hrp = char:WaitForChild("HumanoidRootPart", 5)
        if hrp then
            hrps[player.Address] = hrp
            updateDrawing(hrp)
        end
    end)
end)
players.PlayerRemoving:Connect(function(player)
    removeDrawing(hrps[player.Address])
    hrps[player.Address] = nil
end)

-- local lineScale = 0.4 -- Calculate Instead
local function main()
    while true do task.wait()
        for _, v in pairs(hrps) do
            local start = v and v.Position
            local velocity = v and v.AssemblyLinearVelocity
            if start and velocity then
                local speed = magnitude(velocity)
                local lineScale = speed / 100
                local endPoint = start + (velocity * lineScale)
                updateDrawing(v, WorldToScreen(start), WorldToScreen(endPoint))
            else
                drawingVisibility(v, false)
            end
        end
    end
end

task.spawn(main)