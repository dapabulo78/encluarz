local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
if not LocalPlayer then
    repeat wait(0.1); LocalPlayer = Players.LocalPlayer until LocalPlayer
end

local autoFarming     = false
local fruitEsp        = false
local chamEsp         = false
local autoFruits      = false
local autoTpFruit     = false
local autoFarmNearest = false
local autoNpcFarm     = false
local autoFarmLevel   = false
local farmLevelGen    = 0
local bigHitbox       = false
local pullEnemies     = false
local autoKen         = false
local chamBoxes  = {}
local chestIndex = 1
local espLabels  = {}

local FARM_SPEED = 310
local MIN_SPEED  = 50
local MAX_SPEED  = 1000
local SPEED_STEP = 50

local islandList = {
    {name="Tiki2",         pos=Vector3.new(-16577.81, 107.2,   1226.22)},
    {name="Tiki1",         pos=Vector3.new(-16546.72,  55.87,  -228.59)},
    {name="Port",          pos=Vector3.new(  -706.75,  85.98,  5775.46)},
    {name="Hydra1",        pos=Vector3.new(  6737.77, 127.56,  -715.37)},
    {name="Hydra2",        pos=Vector3.new(  6651.94, 546.71,   260.22)},
    {name="Hydra3",        pos=Vector3.new(  4563.77,1002.40,   824.84)},
    {name="GreatTree1",    pos=Vector3.new(  2976.45,  74.41, -7919.18)},
    {name="GreatTree2",    pos=Vector3.new(  3727.85, 124.12, -7153.10)},
    {name="HauntedCastle", pos=Vector3.new( -9558.96, 172.28,  6139.46)},
    {name="IceCream",      pos=Vector3.new(  -836.01,  65.99,-10973.16)},
    {name="CakeLand",      pos=Vector3.new( -2115.22,  70.16,-12366.38)},
    {name="Chocolate",     pos=Vector3.new(   314.05,  24.97,-12480.51)},
    {name="Peanut",        pos=Vector3.new( -2093.83,  38.28,-10204.63)},
    {name="Mansion",       pos=Vector3.new(-13330.71, 450.81, -7441.45)},
    {name="TurtleCenter2", pos=Vector3.new(-13274.77, 391.72, -9791.60)},
    {name="TurtleCenter1", pos=Vector3.new(-12019.83, 331.91,-10562.06)},
    {name="TurtleEntrance",pos=Vector3.new(-10607.67, 331.94, -8782.75)},
}
local selectedIsland = 1

-- Load the library
local Library
local ok, err = pcall(function()
    loadstring(game:HttpGet("https://raw.githubusercontent.com/dunnerulz/Wabi-Sabi-UI-Library/refs/heads/main/library.lua"))()
    Library = WabiSabiUILibrary
end)
if not ok or not Library then
    warn("Failed to load WabiSabi UI: " .. tostring(err))
    return
end

-- Create the window
local Window = Library:CreateWindow({
    Title = "Myth4c's Script",
    Columns = 2,
    Divider = true,
    ConfigFile = "myth4c_bloxfruits.json",
    BuiltInIndicatorToggle = true,
    Theme = {
        Colors = {
            Accent = Color3.fromRGB(0, 170, 80)
        }
    }
})

-- Build island name list for dropdown
local islandNames = {}
for _, isle in pairs(islandList) do
    table.insert(islandNames, isle.name)
end

-- Top tabs

-- ─── HOME TAB ────────────────────────────────────────────────

Window:AddButton("ideas_label", { Text = "Ideas? DM @kktasus#8563", Column = 1, Callback = function() end })

local _origRenderIndicator = Window._renderIndicator
local _origUpdateIndicator = Window._updateIndicatorInteraction
Window._renderIndicator = function() end
Window._updateIndicatorInteraction = function() end
Window:AddToggle("indicator_toggle", {
    Text = "Show Indicator",
    Default = false,
    Column = 1,
    Callback = function(value)
        if value then
            Window._renderIndicator = _origRenderIndicator
            Window._updateIndicatorInteraction = _origUpdateIndicator
        else
            Window._renderIndicator = function() end
            Window._updateIndicatorInteraction = function() end
        end
    end
})

-- ─── FEATURES TAB ────────────────────────────────────────────

Window:AddSection("Farming", { Column = 1 })

Window:AddToggle("auto_farm_nearest", {
    Text = "Auto Farm Nearest",
    Description = "Farms the nearest enemy (load chests/enemies first!)",
    Default = false,
    Keybind = true,
    Column = 1,
    Callback = function(value)
        autoFarmNearest = value
        notify(value and "Auto Farm Nearest ON!" or "Auto Farm Nearest OFF!", "Myth4c's Script", 2)
    end
})

Window:AddToggle("auto_farm_chest", {
    Text = "Auto Farm Chest",
    Description = "Automatically farms chests (load them in first!)",
    Default = false,
    Keybind = true,
    Column = 1,
    Callback = function(value)
        autoFarming = value
        if value then chestIndex = 1 end
        notify(value and "Auto Farm Chest ON!" or "Auto Farm Chest OFF!", "Myth4c's Script", 2)
    end
})

Window:AddToggle("fruit_esp", {
    Text = "Fruit ESP",
    Description = "Shows ESP boxes and labels around fruits on the map",
    Default = false,
    Keybind = true,
    Column = 1,
    Callback = function(value)
        fruitEsp = value; chamEsp = value
        if value then buildEspLabels(); buildChamBoxes()
        else clearEspLabels(); clearChamBoxes() end
        notify(value and "Fruit ESP On!" or "Fruit ESP Off!", "Myth4c's Script", 2)
    end
})

Window:AddToggle("auto_farm_fruits", {
    Text = "Auto Farm Fruits",
    Description = "Tweens to the nearest fruit and farms it",
    Default = false,
    Keybind = true,
    Column = 1,
    Callback = function(value)
        autoFruits = value
        notify(value and "Auto Farm Fruits ON!" or "Auto Farm Fruits OFF!", "Myth4c's Script", 2)
    end
})

Window:AddToggle("auto_tp_fruit", {
    Text = "Auto TP To Fruit",
    Description = "Instantly teleports you to the nearest fruit",
    Default = false,
    Keybind = true,
    Column = 1,
    Callback = function(value)
        autoTpFruit = value
        notify(value and "TP to Fruit ON!" or "TP to Fruit OFF!", "Myth4c's Script", 2)
    end
})

Window:AddSection("NPC Farm", { Column = 2 })

Window:AddToggle("auto_npc_farm", {
    Text = "Auto NPC Farm",
    Description = "Farms NPCs on the selected island",
    Default = false,
    Keybind = true,
    Column = 2,
    Callback = function(value)
        autoNpcFarm = value
        notify(value and "Auto NPC Farm ON!" or "Auto NPC Farm OFF!", "Myth4c's Script", 2)
    end
})

Window:AddDropdown("npc_island", {
    Text = "NPC Island",
    Description = "Select which island to farm NPCs on",
    Options = islandNames,
    Default = islandNames[1],
    MaxVisible = 6,
    Column = 2,
    Callback = function(value)
        for i, isle in pairs(islandList) do
            if isle.name == value then selectedIsland = i; break end
        end
        notify("Island: " .. value, "Myth4c's Script", 1)
    end
})

Window:AddToggle("auto_farm_level", {
    Text = "Auto Farm Level",
    Description = "Farms mobs based on your current level (quest giver must be loaded!)",
    Default = false,
    Keybind = true,
    Column = 2,
    Callback = function(value)
        autoFarmLevel = value
        farmLevelGen = farmLevelGen + 1
        notify(value and "Auto Farm Level ON!" or "Auto Farm Level OFF!", "Myth4c's Script", 2)
    end
})

Window:AddSection("Combat", { Column = 1 })

Window:AddToggle("big_hitbox", {
    Text = "Big Hitbox",
    Description = "Expands enemy HumanoidRootPart size for easier hits",
    Default = false,
    Keybind = true,
    Column = 1,
    Callback = function(value)
        bigHitbox = value
        notify(value and "Big Hitbox ON!" or "Big Hitbox OFF!", "Myth4c's Script", 2)
    end
})

Window:AddToggle("pull_enemies", {
    Text = "Pull Enemies",
    Description = "Pulls all enemies to one point under you",
    Default = false,
    Keybind = true,
    Column = 1,
    Callback = function(value)
        pullEnemies = value
        notify(value and "Pull Enemies ON!" or "Pull Enemies OFF!", "Myth4c's Script", 2)
        if value then
            -- One-time wake-up: tween to each enemy to trigger server interaction
            task.spawn(function()
                local Character = LocalPlayer.Character
                local myHrp = Character and Character:FindFirstChild("HumanoidRootPart")
                if not myHrp then return end
                local folder = game.Workspace:FindFirstChild("Enemies")
                if not folder then return end
                for _, model in pairs(folder:GetChildren()) do
                    if not pullEnemies then break end
                    if model:IsA("Model") then
                        local hrp = model:FindFirstChild("HumanoidRootPart")
                        if hrp then
                            local dx = hrp.Position.X - myHrp.Position.X
                            local dy = hrp.Position.Y - myHrp.Position.Y
                            local dz = hrp.Position.Z - myHrp.Position.Z
                            local dist = math.sqrt(dx*dx + dy*dy + dz*dz)
                            if dist <= 100 then
                                local startPos = myHrp.Position
                                local dur = dist / FARM_SPEED
                                local t0 = os.clock()
                                while pullEnemies do
                                    local a = math.min((os.clock() - t0) / dur, 1)
                                    myHrp.Position = Vector3.new(startPos.X + dx*a, startPos.Y + dy*a, startPos.Z + dz*a)
                                    myHrp.Velocity = Vector3.new(0, 0, 0)
                                    myHrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
                                    if a >= 1 then break end
                                    task.wait()
                                end
                                task.wait(0.05)
                            end
                        end
                    end
                end
            end)
        end
    end
})

Window:AddToggle("auto_ken", {
    Text = "Auto Ken",
    Description = "Automatically keeps Ken (Observation Haki) active",
    Default = false,
    Keybind = true,
    Column = 1,
    Callback = function(value)
        autoKen = value
        notify(value and "Auto Ken ON!" or "Auto Ken OFF!", "Myth4c's Script", 2)
    end
})

Window:AddSection("Speed", { Column = 2 })

Window:AddSlider("farm_speed", {
    Text = "Farm Speed",
    Description = "Movement speed used while farming",
    Min = MIN_SPEED,
    Max = MAX_SPEED,
    Step = SPEED_STEP,
    Default = FARM_SPEED,
    Integer = true,
    Column = 2,
    Callback = function(value)
        FARM_SPEED = value
        notify("Farm Speed: " .. value, "Myth4c's Script", 1)
    end
})

-- ─── PVP TAB ─────────────────────────────────────────────────


-- ─── INFO TAB ────────────────────────────────────────────────




Window:AddSection("Contact", { Column = 2 })
Window:AddButton("info_contact", { Text = "DM @kktasus#8563 for ideas", Column = 2, Callback = function() end })



-- ─── Game Logic ───────────────────────────────────────────────

local NPC_TWEEN_SPEED = 250

local function npcTweenTo(hrp, targetPos)
    local startPos = hrp.Position
    local dx=targetPos.X-startPos.X; local dy=targetPos.Y-startPos.Y; local dz=targetPos.Z-startPos.Z
    local distance = math.sqrt(dx*dx+dy*dy+dz*dz)
    if distance < 0.1 then return end
    local duration = distance/NPC_TWEEN_SPEED; local startTime = os.clock()
    while true do
        if not autoNpcFarm then return end
        local alpha = math.min((os.clock()-startTime)/duration, 1)
        hrp.Position = Vector3.new(startPos.X+dx*alpha, startPos.Y+dy*alpha, startPos.Z+dz*alpha)
        hrp.Velocity = Vector3.new(0,0,0); hrp.AssemblyLinearVelocity = Vector3.new(0,0,0)
        if alpha >= 1 then break end
        task.wait()
    end
end

function clearEspLabels()
    for _, entry in pairs(espLabels) do entry.label.Visible=false; entry.label:Remove() end
    espLabels = {}
end

function clearChamBoxes()
    for _, entry in pairs(chamBoxes) do
        for _, line in pairs(entry.lines) do line.Visible=false; line:Remove() end
    end
    chamBoxes = {}
end

function buildChamBoxes()
    clearChamBoxes()
    for _, obj in pairs(game.Workspace:GetChildren()) do
        local fruitFolder = obj:FindFirstChild("Fruit")
        if fruitFolder then
            local fruitPart = fruitFolder:FindFirstChild("Fruit")
            if fruitPart and fruitPart:IsA("BasePart") then
                local lines = {}
                for i = 1, 4 do
                    local l = Drawing.new("Line")
                    l.Color=Color3.new(1,0.4,0); l.Thickness=2; l.Visible=false; l.ZIndex=9
                    table.insert(lines, l)
                end
                table.insert(chamBoxes, {lines=lines, part=fruitPart})
            end
        end
    end
end

function buildEspLabels()
    clearEspLabels()
    for _, obj in pairs(game.Workspace:GetChildren()) do
        local fruitFolder = obj:FindFirstChild("Fruit")
        if fruitFolder then
            local fruitPart = fruitFolder:FindFirstChild("Fruit")
            if fruitPart and fruitPart:IsA("BasePart") then
                local fruitName = (obj.Name ~= "Fruit" and obj.Name) or "Spawned Fruit"
                local label = Drawing.new("Text")
                label.Text=fruitName; label.Position=Vector2.new(0,0)
                label.Color=Color3.new(0,1,0); label.Size=14; label.Outline=true
                label.Visible=false; label.ZIndex=10; label.Font=Drawing.Fonts.Monospace; label.Center=true
                table.insert(espLabels, {label=label, part=fruitPart})
            end
        end
    end
end

local CHEST_SPEED = 310
local FRUIT_SPEED = 210

local function tweenTo(hrp, targetPos, speed, checkFn)
    local startPos = hrp.Position
    local dx=targetPos.X-startPos.X; local dy=targetPos.Y-startPos.Y; local dz=targetPos.Z-startPos.Z
    local distance = math.sqrt(dx*dx+dy*dy+dz*dz)
    if distance < 0.1 then return end
    local duration = distance/speed; local startTime = os.clock()
    while true do
        if not checkFn() then return end
        local elapsed = os.clock()-startTime
        local alpha = math.min(elapsed/duration, 1)
        hrp.Position = Vector3.new(startPos.X+dx*alpha, startPos.Y+dy*alpha, startPos.Z+dz*alpha)
        hrp.Velocity = Vector3.new(0,0,0); hrp.AssemblyLinearVelocity = Vector3.new(0,0,0)
        if alpha >= 1 then break end
        task.wait()
    end
end

local function farmTweenTo(hrp, targetPos)
    local startPos = hrp.Position
    local dx=targetPos.X-startPos.X; local dy=targetPos.Y-startPos.Y; local dz=targetPos.Z-startPos.Z
    local distance = math.sqrt(dx*dx+dy*dy+dz*dz)
    if distance < 0.5 then return end
    local duration = distance/FARM_SPEED; local startTime = os.clock()
    while true do
        if not autoFarmNearest then return end
        local elapsed = os.clock()-startTime
        local alpha = math.min(elapsed/duration, 1)
        hrp.Position = Vector3.new(startPos.X+dx*alpha, startPos.Y+dy*alpha, startPos.Z+dz*alpha)
        hrp.Velocity = Vector3.new(0,0,0); hrp.AssemblyLinearVelocity = Vector3.new(0,0,0)
        if alpha >= 1 then break end
        task.wait()
    end
end

local function isAlive(model)
    if not model or not model.Parent then return false end
    local hum = model:FindFirstChildOfClass("Humanoid")
    if hum and hum.Health <= 0 then return false end
    return true
end

local function getNearestEnemy(hrp)
    local folder = game.Workspace:FindFirstChild("Enemies")
    if not folder then return nil end
    local best, bestDist = nil, math.huge
    for _, model in pairs(folder:GetChildren()) do
        if model:IsA("Model") and isAlive(model) then
            local root = model:FindFirstChild("HumanoidRootPart") or model:FindFirstChildOfClass("BasePart")
            if root then
                local dx=root.Position.X-hrp.Position.X; local dy=root.Position.Y-hrp.Position.Y; local dz=root.Position.Z-hrp.Position.Z
                local dist=math.sqrt(dx*dx+dy*dy+dz*dz)
                if dist < bestDist then bestDist=dist; best=model end
            end
        end
    end
    return best
end


local function farmAttack(hrp, checkFn, enemyName)
    local folder = game.Workspace:FindFirstChild("Enemies")
    if not folder then return end

    -- Find nearest enemy
    local nearest, nearestRoot, bestDist = nil, nil, math.huge
    for _, model in pairs(folder:GetChildren()) do
        if model:IsA("Model") and isAlive(model) then
            if not enemyName or model.Name == enemyName then
                local root = model:FindFirstChild("HumanoidRootPart") or model:FindFirstChildOfClass("BasePart")
                if root then
                    local dx = root.Position.X - hrp.Position.X
                    local dy = root.Position.Y - hrp.Position.Y
                    local dz = root.Position.Z - hrp.Position.Z
                    local d = math.sqrt(dx*dx + dy*dy + dz*dz)
                    if d < bestDist then bestDist = d; nearest = model; nearestRoot = root end
                end
            end
        end
    end
    if not nearest then return end

    -- Expand hitbox and keep re-expanding every 1 second
    local chest = nearest:FindFirstChild("UpperTorso") or nearest:FindFirstChild("Torso")
    if chest then chest.Size = Vector3.new(10, 50, 10) end
    task.spawn(function()
        while checkFn() and isAlive(nearest) do
            local c = nearest:FindFirstChild("UpperTorso") or nearest:FindFirstChild("Torso")
            if c then c.Size = Vector3.new(10, 50, 10) end
            task.wait(1)
        end
    end)

    -- Orbit around enemy: 15 studs away, 30 studs above
    local ORBIT_RADIUS = 10
    local ORBIT_HEIGHT = 15
    local ORBIT_SPEED  = 2  -- radians per second
    local angle = 0
    local lastClick = 0

    while checkFn() and isAlive(nearest) do
        local tr = nearest:FindFirstChild("HumanoidRootPart") or nearest:FindFirstChildOfClass("BasePart")
        if tr then
            local ex = tr.Position.X + math.cos(angle) * ORBIT_RADIUS
            local ey = tr.Position.Y + ORBIT_HEIGHT
            local ez = tr.Position.Z + math.sin(angle) * ORBIT_RADIUS
            hrp.Position = Vector3.new(ex, ey, ez)
            hrp.Velocity = Vector3.new(0, 0, 0)
            hrp.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
            angle = angle + ORBIT_SPEED * 0.016
        end
        local now = os.clock()
        if now - lastClick >= 0.06 then mouse1click(); lastClick = now end
        task.wait()
    end
end

local function teleportToChest(targetPart)
    local Character = LocalPlayer.Character; if not Character then return end
    local hrp = Character:FindFirstChild("HumanoidRootPart"); if not hrp then return end
    tweenTo(hrp, Vector3.new(targetPart.Position.X, targetPart.Position.Y+3, targetPart.Position.Z), CHEST_SPEED, function() return autoFarming end)
end

task.spawn(function()
    while true do
        if autoFarming then
            local ChestModels = game.Workspace:FindFirstChild("ChestModels")
            if ChestModels then
                local children = ChestModels:GetChildren()
                if #children > 0 then
                    if chestIndex > #children then chestIndex=1 end
                    local model = children[chestIndex]
                    if model then
                        local tp = model:FindFirstChild("RootPart")
                        if tp then notify("Going to chest "..chestIndex.."/"..#children,"Myth4c's Script",2); teleportToChest(tp); chestIndex=chestIndex+1
                        else chestIndex=chestIndex+1 end
                    end
                end
            end
            task.wait(0.5)
        else task.wait(0.1) end
    end
end)

task.spawn(function()
    while true do
        if autoFruits then
            local Character = LocalPlayer.Character
            local hrp = Character and Character:FindFirstChild("HumanoidRootPart")
            if hrp then
                local bestPart, bestDist = nil, math.huge
                for _, obj in pairs(game.Workspace:GetChildren()) do
                    local ff = obj:FindFirstChild("Fruit")
                    if ff then
                        local fp = ff:FindFirstChild("Fruit")
                        if fp and fp:IsA("BasePart") then
                            local dx=fp.Position.X-hrp.Position.X; local dy=fp.Position.Y-hrp.Position.Y; local dz=fp.Position.Z-hrp.Position.Z
                            local dist=math.sqrt(dx*dx+dy*dy+dz*dz)
                            if dist < bestDist then bestDist=dist; bestPart=fp end
                        end
                    end
                end
                if bestPart then
                    notify("Farming fruit...","Myth4c's Script",1)
                    tweenTo(hrp, Vector3.new(bestPart.Position.X,bestPart.Position.Y+3,bestPart.Position.Z), FRUIT_SPEED, function() return autoFruits end)
                end
            end
            task.wait(1)
        else task.wait(0.1) end
    end
end)

task.spawn(function()
    while true do
        if autoFarmNearest then
            local Character = LocalPlayer.Character
            local hrp = Character and Character:FindFirstChild("HumanoidRootPart")
            if hrp then
                farmAttack(hrp, function() return autoFarmNearest end, nil)
            end
            task.wait(0.1)
        else task.wait(0.1) end
    end
end)

task.spawn(function()
    while true do
        if autoTpFruit then
            local Character = LocalPlayer.Character
            local hrp = Character and Character:FindFirstChild("HumanoidRootPart")
            if hrp then
                local bestPart, bestDist = nil, math.huge
                for _, obj in pairs(game.Workspace:GetChildren()) do
                    local ff=obj:FindFirstChild("Fruit")
                    if ff then
                        local fp=ff:FindFirstChild("Fruit")
                        if fp and fp:IsA("BasePart") then
                            local dx=fp.Position.X-hrp.Position.X; local dy=fp.Position.Y-hrp.Position.Y; local dz=fp.Position.Z-hrp.Position.Z
                            local dist=math.sqrt(dx*dx+dy*dy+dz*dz)
                            if dist < bestDist then bestDist=dist; bestPart=fp end
                        end
                    end
                end
                if bestPart then
                    hrp.Position=Vector3.new(bestPart.Position.X,bestPart.Position.Y+3,bestPart.Position.Z)
                    hrp.Velocity=Vector3.new(0,0,0); hrp.AssemblyLinearVelocity=Vector3.new(0,0,0)
                end
            end
            task.wait(0.1)
        else task.wait(0.1) end
    end
end)

task.spawn(function()
    while true do
        if autoNpcFarm then
            local Character = LocalPlayer.Character
            local hrp = Character and Character:FindFirstChild("HumanoidRootPart")
            if hrp then
                local island = islandList[selectedIsland]
                local ip = island.pos
                notify("NPC Farm: going to "..island.name,"Myth4c's Script",2)
                npcTweenTo(hrp, Vector3.new(ip.X, ip.Y, ip.Z))
                task.wait(0.5)
                local char2 = LocalPlayer.Character
                if char2 then
                    for _, part in pairs(char2:GetChildren()) do
                        if part:IsA("BasePart") then part.CanCollide = false end
                    end
                end
                while autoNpcFarm do
                    local hrp2 = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                    if not hrp2 then task.wait(0.1); break end
                    farmAttack(hrp2, function() return autoNpcFarm end, nil)
                    task.wait(0.1)
                end
            end
            task.wait(0.1)
        else task.wait(0.1) end
    end
end)

local questData = {
    {minLvl=0,   maxLvl=9,   enemy="Bandit",              questGroup="BanditQuest1",   npcPos=Vector3.new(1058.99,  12.71,   1551.73),  questName="Bandits"},
    {minLvl=0,   maxLvl=9,   enemy="Trainee",             questGroup="MarineQuest",    npcPos=Vector3.new(-2083.0,  13.0,    -11.0),    questName="Trainees"},
    {minLvl=10,  maxLvl=14,  enemy="Monkey",              questGroup="JungleQuest",    npcPos=Vector3.new(-1598.09, 33.2,    153.38),   questName="Monkeys"},
    {minLvl=15,  maxLvl=19,  enemy="Gorilla",             questGroup="JungleQuest",    npcPos=Vector3.new(-1598.09, 33.2,    153.38),   questName="Gorillas"},
    {minLvl=20,  maxLvl=29,  enemy="The Gorilla King",    questGroup="JungleQuest",    npcPos=Vector3.new(-1598.09, 33.2,    153.38),   questName="Gorilla King"},
    {minLvl=30,  maxLvl=39,  enemy="Pirate",              questGroup="PirateVillage",  npcPos=Vector3.new(-1141.08, 1.1,     3831.55),  questName="Pirates"},
    {minLvl=40,  maxLvl=54,  enemy="Brute",               questGroup="PirateVillage",  npcPos=Vector3.new(-1141.08, 1.1,     3831.55),  questName="Brute"},
    {minLvl=55,  maxLvl=59,  enemy="Chef",                questGroup="PirateVillage",  npcPos=Vector3.new(-1141.08, 1.1,     3831.55),  questName="Chef"},
    {minLvl=60,  maxLvl=74,  enemy="Desert Bandit",       questGroup="DesertQuest",    npcPos=Vector3.new(894.49,   2.79,    4392.43),  questName="Desert Bandit"},
    {minLvl=75,  maxLvl=89,  enemy="Desert Officer",      questGroup="DesertQuest",    npcPos=Vector3.new(894.49,   2.79,    4392.43),  questName="Desert Officer"},
    {minLvl=90,  maxLvl=99,  enemy="Snow Bandit",         questGroup="SnowQuest",      npcPos=Vector3.new(1387.19,  83.62,   -1295.05), questName="Snow Bandit"},
    {minLvl=100, maxLvl=104, enemy="Snowman",             questGroup="SnowQuest",      npcPos=Vector3.new(1387.19,  83.62,   -1295.05), questName="Snowman"},
    {minLvl=105, maxLvl=119, enemy="Yeti",                questGroup="SnowQuest",      npcPos=Vector3.new(1387.19,  83.62,   -1295.05), questName="Yeti"},
    {minLvl=120, maxLvl=129, enemy="Chief Petty Officer", questGroup="MarineQuest2",   npcPos=Vector3.new(-5039.59, 25.0,    4324.68),  questName="Chief Petty Officer"},
    {minLvl=130, maxLvl=149, enemy="Vice Admiral",        questGroup="MarineQuest2",   npcPos=Vector3.new(-5039.59, 25.0,    4324.68),  questName="Vice Admiral"},
    {minLvl=150, maxLvl=174, enemy="Sky Bandit",          questGroup="SkyQuest",       npcPos=Vector3.new(-4839.53, 714.02,  -2619.44), questName="Sky Bandit"},
    {minLvl=175, maxLvl=189, enemy="Dark Master",         questGroup="SkyQuest",       npcPos=Vector3.new(-4839.53, 714.02,  -2619.44), questName="Dark Master"},
    {minLvl=190, maxLvl=209, enemy="Prisoner",            questGroup="PrisonerQuest",  npcPos=Vector3.new(5310.61,  -2.0,    474.95),   questName="Prisoner"},
    {minLvl=210, maxLvl=219, enemy="Dangerous Prisoner",  questGroup="PrisonerQuest",  npcPos=Vector3.new(5310.61,  -2.0,    474.95),   questName="Dangerous Prisoner"},
    {minLvl=220, maxLvl=229, enemy="Warden",              questGroup="ImpelQuest",     npcPos=Vector3.new(5191.86,  -0.11,   686.44),   questName="Warden"},
    {minLvl=230, maxLvl=239, enemy="Chief Warden",        questGroup="ImpelQuest",     npcPos=Vector3.new(5191.86,  -0.11,   686.44),   questName="Chief Warden"},
    {minLvl=240, maxLvl=249, enemy="Swan",                questGroup="ImpelQuest",     npcPos=Vector3.new(5191.86,  -0.11,   686.44),   questName="Swan"},
    {minLvl=250, maxLvl=274, enemy="Toga Warrior",        questGroup="ColosseumQuest", npcPos=Vector3.new(-1580.05, 3.74,    -2986.48), questName="Toga Warrior"},
    {minLvl=275, maxLvl=299, enemy="Gladiator",           questGroup="ColosseumQuest", npcPos=Vector3.new(-1580.05, 3.74,    -2986.48), questName="Gladiator"},
    {minLvl=300, maxLvl=324, enemy="Military Soldier",    questGroup="MagmaQuest",     npcPos=Vector3.new(-5313.37, 8.58,    8515.29),  questName="Mil. Soldier"},
    {minLvl=325, maxLvl=349, enemy="Military Spy",        questGroup="MagmaQuest",     npcPos=Vector3.new(-5313.37, 8.58,    8515.29),  questName="Mil. Spy"},
    {minLvl=350, maxLvl=374, enemy="Magma Admiral",       questGroup="MagmaQuest",     npcPos=Vector3.new(-5313.37, 8.58,    8515.29),  questName="Magma Admiral"},
    {minLvl=375, maxLvl=399, enemy="Fishman Warrior",     questGroup="FishmanQuest",   npcPos=Vector3.new(61121.11, 14.82,   1564.53),  questName="Fishman Warrior"},
    {minLvl=400, maxLvl=424, enemy="Fishman Commando",    questGroup="FishmanQuest",   npcPos=Vector3.new(61121.11, 14.82,   1564.53),  questName="Fishman Commando"},
    {minLvl=425, maxLvl=449, enemy="Fishman Lord",        questGroup="FishmanQuest",   npcPos=Vector3.new(61121.11, 14.82,   1564.53),  questName="Fishman Lord"},
    {minLvl=450, maxLvl=474, enemy="God's Guard",         questGroup="SkyExp1Quest",   npcPos=Vector3.new(-7859.1,  5541.84, -381.48),  questName="God's Guard"},
    {minLvl=475, maxLvl=499, enemy="Shanda",              questGroup="SkyExp1Quest",   npcPos=Vector3.new(-7859.1,  5541.84, -381.48),  questName="Shanda"},
    {minLvl=500, maxLvl=524, enemy="Wysper",              questGroup="SkyExp1Quest",   npcPos=Vector3.new(-7859.1,  5541.84, -381.48),  questName="Wysper"},
    {minLvl=525, maxLvl=549, enemy="Royal Squad",         questGroup="SkyExp2Quest",   npcPos=Vector3.new(-7904.69, 5632.31, -1409.97), questName="Royal Squad"},
    {minLvl=550, maxLvl=574, enemy="Royal Soldier",       questGroup="SkyExp2Quest",   npcPos=Vector3.new(-7904.69, 5632.31, -1409.97), questName="Royal Soldier"},
    {minLvl=575, maxLvl=624, enemy="Thunder God",         questGroup="SkyExp2Quest",   npcPos=Vector3.new(-7904.69, 5632.31, -1409.97), questName="Thunder God"},
    {minLvl=625, maxLvl=649, enemy="Galley Pirate",       questGroup="FountainQuest",  npcPos=Vector3.new(5259.82,  34.85,   4050.03),  questName="Galley Pirate"},
    {minLvl=650, maxLvl=674, enemy="Galley Captain",      questGroup="FountainQuest",  npcPos=Vector3.new(5259.82,  34.85,   4050.03),  questName="Galley Captain"},
    {minLvl=675, maxLvl=699, enemy="Cyborg",              questGroup="FountainQuest",  npcPos=Vector3.new(5259.82,  34.85,   4050.03),  questName="Cyborg"},
    {minLvl=700, maxLvl=724, enemy="Raider",              questGroup="Area1Quest",     npcPos=Vector3.new(-10810.0, 391.0,  -9760.0),  questName="Raider"},
    {minLvl=725, maxLvl=749, enemy="Mercenary",           questGroup="Area1Quest",     npcPos=Vector3.new(-10810.0, 391.0,  -9760.0),  questName="Mercenary"},
    {minLvl=750, maxLvl=774, enemy="Diamond",             questGroup="Area1Quest",     npcPos=Vector3.new(-10810.0, 391.0,  -9760.0),  questName="Diamond"},
    {minLvl=775, maxLvl=799, enemy="Swan Pirate",         questGroup="Area2Quest",     npcPos=Vector3.new(-11050.0, 391.0,  -9800.0),  questName="Swan Pirate"},
    {minLvl=800, maxLvl=849, enemy="Factory Staff",       questGroup="Area2Quest",     npcPos=Vector3.new(-11050.0, 391.0,  -9800.0),  questName="Factory Staff"},
    {minLvl=875, maxLvl=899, enemy="Marine Lieutenant",   questGroup="MarineQuest3",   npcPos=Vector3.new(-13000.0, 395.0,  -8800.0),  questName="Marine Lieutenant"},
    {minLvl=900, maxLvl=924, enemy="Marine Captain",      questGroup="MarineQuest3",   npcPos=Vector3.new(-13000.0, 395.0,  -8800.0),  questName="Marine Captain"},
    {minLvl=950, maxLvl=974, enemy="Zombie",              questGroup="ZombieQuest",    npcPos=Vector3.new(-9558.96, 172.28,  6139.46), questName="Zombie"},
    {minLvl=975, maxLvl=999, enemy="Vampire",             questGroup="ZombieQuest",    npcPos=Vector3.new(-9558.96, 172.28,  6139.46), questName="Vampire"},
    {minLvl=1975, maxLvl=1999, enemy="Reborn Skeleton",       questGroup="HauntedQuest1",       npcPos=Vector3.new(-9558.96,  172.28,   6139.46),  questName="Reborn Skeleton"},
    {minLvl=2000, maxLvl=2024, enemy="Living Zombie",         questGroup="HauntedQuest1",       npcPos=Vector3.new(-9558.96,  172.28,   6139.46),  questName="Living Zombie"},
    {minLvl=2075, maxLvl=2099, enemy="Peanut Scout",          questGroup="NutsIslandQuest",     npcPos=Vector3.new(-2093.83,   38.28, -10204.63),  questName="Peanut Scout"},
    {minLvl=2100, maxLvl=2124, enemy="Peanut President",      questGroup="NutsIslandQuest",     npcPos=Vector3.new(-2093.83,   38.28, -10204.63),  questName="Peanut President"},
    {minLvl=2125, maxLvl=2149, enemy="Ice Cream Chef",        questGroup="IceCreamIslandQuest", npcPos=Vector3.new( -836.01,   65.99, -10973.16),  questName="Ice Cream Chef"},
    {minLvl=2150, maxLvl=2174, enemy="Ice Cream Commander",   questGroup="IceCreamIslandQuest", npcPos=Vector3.new( -836.01,   65.99, -10973.16),  questName="Ice Cream Commander"},
    {minLvl=2200, maxLvl=2224, enemy="Cookie Crafter",        questGroup="CakeQuest1",          npcPos=Vector3.new(-2115.22,   70.16, -12366.38),  questName="Cookie Crafter"},
    {minLvl=2225, maxLvl=2249, enemy="Cake Guard",            questGroup="CakeQuest1",          npcPos=Vector3.new(-2115.22,   70.16, -12366.38),  questName="Cake Guard"},
    {minLvl=2300, maxLvl=2324, enemy="Cocoa Warrior",         questGroup="ChocQuest1",          npcPos=Vector3.new(  314.05,   24.97, -12480.51),  questName="Cocoa Warrior"},
    {minLvl=2325, maxLvl=2349, enemy="Chocolate Bar Battler", questGroup="ChocQuest1",          npcPos=Vector3.new(  314.05,   24.97, -12480.51),  questName="Chocolate Bar Battler"},
    {minLvl=2450, maxLvl=2474, enemy="Isle Outlaw",           questGroup="TikiQuest1",          npcPos=Vector3.new(-16546.72,  55.87,   -228.59),  questName="Isle Outlaw"},
    {minLvl=2475, maxLvl=2499, enemy="Island Boy",            questGroup="TikiQuest1",          npcPos=Vector3.new(-16546.72,  55.87,   -228.59),  questName="Island Boy"},
    {minLvl=2500, maxLvl=2524, enemy="Sun-kissed Warrior",    questGroup="TikiQuest2",          npcPos=Vector3.new(-16577.81, 107.2,    1226.22),  questName="Sun-kissed Warrior"},
    {minLvl=2600, maxLvl=2624, enemy="Reef Bandit",           questGroup="SubmergedQuest1",     npcPos=Vector3.new( 10780.64,-2088.41,  9260.45),  questName="Reef Bandit"},
    {minLvl=2625, maxLvl=2649, enemy="Coral Pirate",          questGroup="SubmergedQuest1",     npcPos=Vector3.new( 10780.64,-2088.41,  9260.45),  questName="Coral Pirate"},
    {minLvl=2650, maxLvl=2674, enemy="Sea Chanter",           questGroup="SubmergedQuest2",     npcPos=Vector3.new( 10883.60,-2086.89, 10034.02),  questName="Sea Chanter"},
    {minLvl=2675, maxLvl=2699, enemy="Ocean Prophet",         questGroup="SubmergedQuest2",     npcPos=Vector3.new( 10883.60,-2086.89, 10034.02),  questName="Ocean Prophet"},
    {minLvl=2675, maxLvl=2699, enemy="High Disciple",         questGroup="SubmergedQuest3",     npcPos=Vector3.new(  9637.29,-1993.14,  9616.30),  questName="High Disciple"},
    {minLvl=2700, maxLvl=2799, enemy="Grand Devotee",         questGroup="SubmergedQuest3",     npcPos=Vector3.new(  9637.29,-1993.14,  9616.30),  questName="Grand Devotee"},
}

local function getPlayerLevel()
    local ok, val = pcall(function()
        local txt = LocalPlayer.PlayerGui.Main.Level.Text
        return tonumber(txt:match("%d+"))
    end)
    if ok and type(val) == "number" and val > 0 then return val end
    return 0
end

local function getQuestForLevel(lvl)
    local best = nil
    for _, q in pairs(questData) do
        if lvl >= q.minLvl and lvl <= q.maxLvl then
            if best == nil or q.minLvl > best.minLvl then best = q end
        end
    end
    return best
end

local function isQuestActive()
    local ok, txt = pcall(function()
        return LocalPlayer.PlayerGui.Main.Quest.Container.QuestTitle.Title.Text
    end)
    if ok and type(txt) == "string" and txt ~= "" then return true end
    return false
end

local questAccepted = false

task.spawn(function()
    while true do
        if not autoFarmLevel then task.wait(0.1); continue end
        local myGen = farmLevelGen
        local Character = LocalPlayer.Character
        local hrp = Character and Character:FindFirstChild("HumanoidRootPart")
        if not hrp then task.wait(0.5); continue end
        if isQuestActive() then questAccepted = true end
        local lvl = getPlayerLevel()
        local quest = getQuestForLevel(lvl)
        if not quest then notify("No quest for lvl "..lvl,"Myth4c's Script",3); task.wait(5); continue end
        if not questAccepted then
            notify("Going to: "..quest.questName,"Myth4c's Script",2)
            local qpos = quest.npcPos; local startPos = hrp.Position
            local dx=qpos.X-startPos.X; local dy=qpos.Y-startPos.Y; local dz=qpos.Z-startPos.Z
            local dist = math.sqrt(dx*dx+dy*dy+dz*dz)
            if dist > 20 then
                local dur = dist/250; local t0 = os.clock()
                while autoFarmLevel and farmLevelGen==myGen do
                    local a = math.min((os.clock()-t0)/dur, 1)
                    hrp.Position = Vector3.new(startPos.X+dx*a, startPos.Y+dy*a, startPos.Z+dz*a)
                    hrp.Velocity = Vector3.new(0,0,0); hrp.AssemblyLinearVelocity = Vector3.new(0,0,0)
                    if a >= 1 then break end; task.wait()
                end
            end
            if not autoFarmLevel or farmLevelGen~=myGen then questAccepted=false; continue end
            task.wait(2); mouse1click(); task.wait(2)
            local function getQuestOption()
                local sameGroup = {}
                for _, q in pairs(questData) do
                    if q.questGroup == quest.questGroup then table.insert(sameGroup, q) end
                end
                table.sort(sameGroup, function(a,b) return a.minLvl < b.minLvl end)
                for i, q in pairs(sameGroup) do
                    if q.enemy == quest.enemy then
                        if i == 1 then return "Option1" elseif i == 2 then return "Option2" else return "Option3" end
                    end
                end
                return "Option1"
            end
            local optionName = getQuestOption()
            notify("Clicking "..optionName.." for "..quest.enemy,"Myth4c's Script",2)
            task.wait(1)
            local function tweenClick(btnName)
                local btn = LocalPlayer.PlayerGui.Main.Dialogue[btnName]
                local bx = btn.AbsolutePosition.X + btn.AbsoluteSize.X / 2
                local by = btn.AbsolutePosition.Y + btn.AbsoluteSize.Y / 2
                mousemoveabs(bx, by); task.wait(0.2)
                local steps = 20
                for i = 1, steps do
                    mousemoveabs(bx + math.sin(i/steps*math.pi)*5, by + math.cos(i/steps*math.pi)*5); task.wait(0.03)
                end
                mousemoveabs(bx, by); task.wait(0.1); mouse1press(); task.wait(0.1); mouse1release()
            end
            tweenClick(optionName); task.wait(1)
            tweenClick("Option1"); task.wait(1)
            mouse1press(); task.wait(0.1); mouse1release(); task.wait(1)
            questAccepted = true
            notify("Quest accepted! Farming: "..quest.enemy,"Myth4c's Script",3)
        else
            notify("Farming: "..quest.enemy,"Myth4c's Script",2)
        end
        while autoFarmLevel and farmLevelGen==myGen do
            if not isQuestActive() then notify("Quest complete! Re-accepting...","Myth4c's Script",3); questAccepted=false; break end
            local hrp2 = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
            if not hrp2 then task.wait(0.5); break end
            farmAttack(hrp2, function() return autoFarmLevel and farmLevelGen==myGen end, quest.enemy)
            task.wait(0.1)
        end
        if farmLevelGen ~= myGen then questAccepted = false end
        task.wait(0.1)
    end
end)

task.spawn(function()
    while true do
        if fruitEsp then
            local Character = LocalPlayer.Character
            local HumanoidRootPart = Character and Character:FindFirstChild("HumanoidRootPart")
            for _, entry in pairs(espLabels) do
                if entry and entry.label and entry.part and HumanoidRootPart then
                    local screenPos, onScreen = WorldToScreen(entry.part.Position)
                    entry.label.Visible = onScreen
                    if onScreen then entry.label.Position=Vector2.new(screenPos.X,screenPos.Y-20) end
                end
            end
        end
        task.wait(0.1)
    end
end)

task.spawn(function()
    while true do task.wait(10); if fruitEsp then buildEspLabels(); buildChamBoxes() end end
end)

task.spawn(function()
    while true do
        if chamEsp then
            local Character = LocalPlayer.Character
            local hrp = Character and Character:FindFirstChild("HumanoidRootPart")
            for _, entry in pairs(chamBoxes) do
                if entry and entry.part and hrp then
                    local pos=entry.part.Position; local sz=entry.part.Size*0.5
                    local corners = {
                        Vector3.new(pos.X-sz.X,pos.Y-sz.Y,pos.Z-sz.Z), Vector3.new(pos.X+sz.X,pos.Y-sz.Y,pos.Z-sz.Z),
                        Vector3.new(pos.X-sz.X,pos.Y+sz.Y,pos.Z-sz.Z), Vector3.new(pos.X+sz.X,pos.Y+sz.Y,pos.Z-sz.Z),
                        Vector3.new(pos.X-sz.X,pos.Y-sz.Y,pos.Z+sz.Z), Vector3.new(pos.X+sz.X,pos.Y-sz.Y,pos.Z+sz.Z),
                        Vector3.new(pos.X-sz.X,pos.Y+sz.Y,pos.Z+sz.Z), Vector3.new(pos.X+sz.X,pos.Y+sz.Y,pos.Z+sz.Z),
                    }
                    local minX,minY,maxX,maxY = math.huge,math.huge,-math.huge,-math.huge
                    local allOnScreen = true
                    for _, c in pairs(corners) do
                        local sp,on = WorldToScreen(c)
                        if not on then allOnScreen=false end
                        if sp.X<minX then minX=sp.X end; if sp.Y<minY then minY=sp.Y end
                        if sp.X>maxX then maxX=sp.X end; if sp.Y>maxY then maxY=sp.Y end
                    end
                    if allOnScreen then
                        entry.lines[1].From=Vector2.new(minX,minY); entry.lines[1].To=Vector2.new(maxX,minY)
                        entry.lines[2].From=Vector2.new(minX,maxY); entry.lines[2].To=Vector2.new(maxX,maxY)
                        entry.lines[3].From=Vector2.new(minX,minY); entry.lines[3].To=Vector2.new(minX,maxY)
                        entry.lines[4].From=Vector2.new(maxX,minY); entry.lines[4].To=Vector2.new(maxX,maxY)
                        for _, l in pairs(entry.lines) do l.Visible=true end
                    else for _, l in pairs(entry.lines) do l.Visible=false end end
                end
            end
        end
        task.wait(0.05)
    end
end)

-- Big Hitbox loop
task.spawn(function()
    while true do
        if bigHitbox then
            local folder = game.Workspace:FindFirstChild("Enemies")
            if folder then
                for _, model in pairs(folder:GetChildren()) do
                    if model:IsA("Model") then
                        local chest = model:FindFirstChild("UpperTorso") or model:FindFirstChild("Torso")
                        if chest then
                            chest.Size = Vector3.new(2, 150, 1)
                        end
                    end
                end
            end
        end
        task.wait(0.5)
    end
end)

-- Pull Enemies loop
task.spawn(function()
    while true do
        if pullEnemies then
            local Character = LocalPlayer.Character
            local myHrp = Character and Character:FindFirstChild("HumanoidRootPart")
            if myHrp then
                local pullPoint = Vector3.new(myHrp.Position.X, myHrp.Position.Y - 3, myHrp.Position.Z)
                local folder = game.Workspace:FindFirstChild("Enemies")
                if folder then
                    for _, model in pairs(folder:GetChildren()) do
                        if model:IsA("Model") then
                            task.spawn(function()
                                local hrp = model:FindFirstChild("HumanoidRootPart")
                                if hrp then
                                    hrp.CanCollide = false
                                    hrp.Position = pullPoint
                                end
                            end)
                        end
                    end
                end
            end
        end
        task.wait(0.001)
    end
end)

-- Auto Ken loop
task.spawn(function()
    while true do
        task.wait(0.1)
        if autoKen then
            if not LocalPlayer:GetAttribute("KenActive") then
                keypress(0x45)
                task.wait(0.1)
                keyrelease(0x45)
            end
        end
    end
end)

-- Main loop (required for WabiSabi)
while true do
    local ok, err = pcall(function()
        Window:Step()
    end)
    if not ok then
        warn("Step error: " .. tostring(err))
        task.wait(1)
    end
    task.wait()
end
