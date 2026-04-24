----------------------------------------------------
local brightness_offset = 0x120
local clocktime_offset = 0x1B8
local fogend_offset = 0x134
local globalshadows_offset = 0x148
local ambient_offset = 0xD8
local outdoorambient_offset = 0x108

local invalidatelighting_offset = 0x148
local datamodeltorenderview_offset = 0x1D0
-- offsets now all set -----------------------------
local Lighting = game:GetService("Lighting")

local fdm = memory_read("uintptr_t", getbase() + 0x7E83168)
local dm = memory_read("uintptr_t", fdm + 0x1C0)
local RenderView = memory_read("uintptr_t", dm + datamodeltorenderview_offset)
----------------------------------------------------

local function readColor(address)
    local r = memory_read("float", address)
    local g = memory_read("float", address + 0x4)
    local b = memory_read("float", address + 0x8)

    return Color3.new(r, g, b)
end
local function writeColor(address, rgb)
    memory_write("float", address, rgb.R / 255)
    memory_write("float", address + 0x4, rgb.G / 255)
    memory_write("float", address + 0x8, rgb.B / 255)
end

local originalLighting = { -- to restore later if needed
    Brightness = memory_read("float", Lighting.Address + brightness_offset),
	ClockTime = memory_read("float", Lighting.Address + clocktime_offset),
	FogEnd = memory_read("float", Lighting.Address + fogend_offset),
	GlobalShadows = memory_read("byte", Lighting.Address + globalshadows_offset),
	Ambient = readColor(Lighting.Address + ambient_offset),
	OutdoorAmbient = readColor(Lighting.Address + outdoorambient_offset)
}
local spoofedLighting = {
    Brightness = 1,
    ClockTime = 14,
    FogEnd = 100000,
    GlobalShadows = 0, -- false
    Ambient = Color3.fromRGB(255,255,255),
    OutdoorAmbient = Color3.fromRGB(255,255,255)
}

local function spoofLighting()
    memory_write("float", Lighting.Address + brightness_offset, spoofedLighting.Brightness)
    memory_write("float", Lighting.Address + clocktime_offset, spoofedLighting.ClockTime)
    memory_write("float", Lighting.Address + fogend_offset, spoofedLighting.FogEnd)
    memory_write("byte", Lighting.Address + globalshadows_offset, spoofedLighting.GlobalShadows)
    writeColor(Lighting.Address + ambient_offset, spoofedLighting.Ambient)
    writeColor(Lighting.Address + outdoorambient_offset, spoofedLighting.OutdoorAmbient)

    memory_write("byte", RenderView + invalidatelighting_offset, 0)
end
spoofLighting()