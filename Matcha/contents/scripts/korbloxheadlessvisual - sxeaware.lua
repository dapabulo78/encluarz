local offsets = {
    Transparency = 0xF0,
    CanCollide   = 0x1AE,
    CFrame       = 0xC0,
    Anchored     = 0x1AE,  
}

local function write_float(addr, val)
    if addr and addr ~= 0 then
        pcall(memory_write, "float", addr, val)
    end
end

local function write_byte(addr, val)
    if addr and addr ~= 0 then
        pcall(memory_write, "byte", addr, val)
    end
end

local lastChar = nil

local function safeRemoveParts(char)
    if not char then return end

    local parts = {
        char:FindFirstChild("Head"),
        char:FindFirstChild("RightUpperLeg"),
        char:FindFirstChild("RightLowerLeg"),
        char:FindFirstChild("RightFoot")
    }

    local count = 0
    for _, part in ipairs(parts) do
        if part then
            count = count + 1
            local addr = part.Address
            if addr and addr ~= 0 then

                write_float(addr + offsets.Transparency, 1.0)

                write_byte(addr + offsets.CanCollide, 0)

                local anchored = memory_read("byte", addr + offsets.Anchored) or 0
                write_byte(addr + offsets.Anchored, bit32.bor(anchored, 0x2))

                local cfBase = addr + offsets.CFrame --not sure if cframe is supported by matcha but ill still use it lol why not nigga you asking me stfu nigga smd
                write_float(cfBase + 0x20, 999999)  -- Position.Y
            end
        end
    end

    if count > 0 then
    end
end

local function removeHeadAndRightLeg()
    local lp = game.Players.LocalPlayer
    if not lp then return end

    local char = lp.Character
    if char == lastChar then return end 

    lastChar = char
    safeRemoveParts(char)
end

removeHeadAndRightLeg()

spawn(function()
    while true do
        pcall(removeHeadAndRightLeg)
        task.wait(2)  
    end
end)
