getfenv()["Config"] = {
    AutoSkillCheck = {
        Activate = true,
        Toggle = false,
        Keybind = "x",
        Ratio = "Perfect", -- Options: Perfect, Neutral
    },

    Esp = {
        Activate = true,
    },

    Debug = false,
}



local env = getfenv()


local Players = game:GetService("Players")

local Config = getfenv()["Config"]

if not Config then
    error("Config not found in environment")
    return
end

local Map = workspace:FindFirstChild("Map")

local WorkspacePath = "C:/matcha/workspace/"
local FolderPath = WorkspacePath .. "ViolenceDistrict/"
local ModuleFolder = FolderPath .. "Modules/"

---@diagnostic disable: undefined-global
local keyrelease, keypress = keyrelease, keypress
local isrbxactive = isrbxactive
local setrobloxinput = setrobloxinput
local isfolder, makefolder = isfolder, makefolder
local isfile, writefile, readfile = isfile, writefile, readfile
local OldPrint = print

env["print"] = function(...)
    if Config.Debug then
        OldPrint("[ViolenceDistrict]", ...)
    end
end

local function ensureFolder(path)
    if not isfolder(path) then
        makefolder(path)
    end
end

ensureFolder(FolderPath)
ensureFolder(ModuleFolder)

local function LoadModule(name, url)
    local path = ModuleFolder .. name
    local Src = game:HttpGet(url)

    if not isfile(path) then
        writefile(path, Src)
    else
        local localSrc = readfile(path)
        if localSrc ~= Src then
            writefile(path, Src)
        end
    end

    return require(path)
end

setrobloxinput(true)

if Config.Debug then
    env["repr"] = LoadModule(
        "repr.lua",
        "https://raw.githubusercontent.com/Ozzypig/repr/refs/heads/master/repr.lua"
    )
end


local MemoryManager = LoadModule(
    "MemoryManager.lua",
    "https://raw.githubusercontent.com/thelucas128/Macha/refs/heads/main/MemoryManagerFixed.luau"
)

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

local Cache = {}

local lineX = Drawing.new("Line")
lineX.Color = Color3.fromRGB(255, 0, 0)
lineX.Thickness = 2
lineX.Transparency = 1

local lineY = Drawing.new("Line")
lineY.Color = Color3.fromRGB(0, 255, 0)
lineY.Thickness = 2
lineY.Transparency = 1

local lineZ = Drawing.new("Line")
lineZ.Color = Color3.fromRGB(0, 0, 255)
lineZ.Thickness = 2
lineZ.Transparency = 1

local function drawRotation(hrp, length)
    length = length or 3
    
    local m = MemoryManager.GetRotationMatrix(hrp)
    if not m then
        lineX.Visible = false
        lineY.Visible = false
        lineZ.Visible = false
        return
    end
    
    local pos = hrp.Position
    

    local rightVec = Vector3.new(m[0], m[3], m[6]) * length
    local upVec = Vector3.new(m[1], m[4], m[7]) * length
    local forwardVec = Vector3.new(-m[2], -m[5], -m[8]) * length
    
  
    local xEnd = pos + rightVec
    local xStart, xStartOn = WorldToScreen(pos)
    local xEndScreen, xEndOn = WorldToScreen(xEnd)
    if xStart and xEndScreen and xStartOn and xEndOn then
        lineX.From = Vector2.new(xStart.X, xStart.Y)
        lineX.To = Vector2.new(xEndScreen.X, xEndScreen.Y)
        lineX.Visible = true
    else
        lineX.Visible = false
    end
    
  
    local yEnd = pos + upVec
    local yStart, yStartOn = WorldToScreen(pos)
    local yEndScreen, yEndOn = WorldToScreen(yEnd)
    if yStart and yEndScreen and yStartOn and yEndOn then
        lineY.From = Vector2.new(yStart.X, yStart.Y)
        lineY.To = Vector2.new(yEndScreen.X, yEndScreen.Y)
        lineY.Visible = true
    else
        lineY.Visible = false
    end
    
   
    local zEnd = pos + forwardVec
    local zStart, zStartOn = WorldToScreen(pos)
    local zEndScreen, zEndOn = WorldToScreen(zEnd)
    if zStart and zEndScreen and zStartOn and zEndOn then
        lineZ.From = Vector2.new(zStart.X, zStart.Y)
        lineZ.To = Vector2.new(zEndScreen.X, zEndScreen.Y)
        lineZ.Visible = true
    else
        lineZ.Visible = false
    end
end



local function normalizeAngle(angle)
    angle = angle % 360
    return angle < 0 and angle + 360 or angle
end

local function  Search()
    local lookup = {}

    for _, obj in workspace:FindFirstChild("Map"):GetDescendants() do
        local name = obj.Name
        local bucket = lookup[name]
        if bucket then
            bucket[#bucket + 1] = obj
        else
            lookup[name] = { obj }
        end
    end
    return lookup
end

local function Autogen()
    local CheckPrompt = PlayerGui:FindFirstChild("SkillCheckPromptGui")
    if CheckPrompt then
        local Rotation = MemoryManager.GetGuiObjectRotation(CheckPrompt.Check.Line.Address)
        local GoalRotation = MemoryManager.GetGuiObjectRotation(CheckPrompt.Check.Goal.Address)

        Rotation = normalizeAngle(Rotation)
        GoalRotation = normalizeAngle(GoalRotation)

        local lowerSuccess = normalizeAngle(104 + GoalRotation)
        local upperSuccess = normalizeAngle(114 + GoalRotation)
        local upperNeutral = normalizeAngle(159 + GoalRotation)

        if lowerSuccess <= Rotation and Rotation <= upperSuccess and Config.AutoSkillCheck.Ratio == "Perfect" then
			keypress(32)
			keyrelease(32)
            print("Success!", Rotation, GoalRotation)
        elseif upperSuccess < Rotation and Rotation <= upperNeutral then
			keypress(32)
			keyrelease(32)
            print("Neutral", Rotation, GoalRotation)
        end
    end
end

local DidSearch = false
local lookup = {}



while true do
    if Config.Debug then
    drawRotation(Player.Character.HumanoidRootPart,1) 
    end
        
    if Config.Esp.Activate and Map and #Map:GetChildren() > 0 then
        if not DidSearch then
            lookup = Search()
            DidSearch = true
        end

        if DidSearch then
            local generator = lookup["Generator"]
            if generator and Config.Debug then
                --print(env["repr"](lookup["Generator"]))
            end
        end
    else
        DidSearch = false
    end


    if Config.AutoSkillCheck.Activate then
        Autogen()
    end

    task.wait()
end

