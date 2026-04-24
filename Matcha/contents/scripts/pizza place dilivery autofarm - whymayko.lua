local player = game.Players.LocalPlayer
local backpack = player.Backpack
local function getHRP()
    return (player.Character or player.CharacterAdded:Wait()):WaitForChild("HumanoidRootPart")
end
local hrp = getHRP()
print("Script started - Made by WhyMayko")

local KEY_2 = 50
local KEY_3 = 51
local equipKey = KEY_2

local function updateEquipKey()
    if backpack:FindFirstChild("Umbrella") then
        equipKey = KEY_3
    else
        equipKey = KEY_2
    end
end

local function getEquippedDelivery()
    local char = player.Character
    if not char then return nil end
    for _, obj in ipairs(char:GetChildren()) do
        if obj:IsA("Tool") and obj:FindFirstChild("House") then
            return obj, obj.House.Value
        end
    end
end

local function countBackpackDeliveries()
    local count = 0
    for _, tool in ipairs(backpack:GetChildren()) do
        if tool:IsA("Tool") and tool:FindFirstChild("House") then
            count += 1
        end
    end
    return count
end

local function equipDelivery()
    if not isrbxactive() then return end
    updateEquipKey()
    setrobloxinput(true)
    keypress(equipKey)
    task.wait(1)
    keyrelease(equipKey)
end

local function getWorldDeliveries()
    local deliveries = {}
    for _, obj in ipairs(workspace:GetChildren()) do
        if obj:IsA("Tool") and obj:FindFirstChild("House") and string.match(obj.Name, "^[A-Z][1-9]$") then
            table.insert(deliveries, obj)
        end
    end
    return deliveries
end

while true do
    task.wait(0.5)
    updateEquipKey()
    local tool, house = getEquippedDelivery()

    if not tool then
        if countBackpackDeliveries() > 0 then
            equipDelivery()
            continue
        end
        local pizzas = getWorldDeliveries()
        if #pizzas > 0 then
            local startTime = os.clock()
            while os.clock() - startTime < 5 do
                for _, pizza in ipairs(pizzas) do
                    if getEquippedDelivery() then break end
                    local pos = pizza:FindFirstChild("Handle") and pizza.Handle.Position or pizza.Position
                    hrp.Position = pos + Vector3.new(0, 3, 0)
                    task.wait(0.15)
                end
            end
        end
        continue
    end

    local doorTouch = nil
    local timeout = os.clock() + 5
    repeat
        for _, obj in ipairs(house:GetDescendants()) do
            if obj.Name == "FrontDoorMain" then
                local dt = obj:FindFirstChild("DoorTouch")
                if dt and dt:IsA("BasePart") then
                    doorTouch = dt
                    break
                end
            end
        end
        task.wait(0.15)
    until doorTouch or os.clock() > timeout

    if not doorTouch then
        timeout = os.clock() + 5
        repeat
            for _, obj in ipairs(house:GetDescendants()) do
                if obj.Name == "DoorTouch" and obj:IsA("BasePart") then
                    doorTouch = obj
                    break
                end
            end
            task.wait(0.15)
        until doorTouch or os.clock() > timeout
    end

    if not doorTouch then continue end

    while getEquippedDelivery() do
        hrp.Position = doorTouch.Position
        task.wait(0.2)
    end

    for i = 1, 5 do
        hrp.Position = doorTouch.Position + Vector3.new(0, 50, 0)
        task.wait(0.15)
    end
    task.wait(1)
end
