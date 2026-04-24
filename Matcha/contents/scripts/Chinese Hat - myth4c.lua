local Players = game:GetService('Players')
local _lp = Players.LocalPlayer
if not _lp then repeat wait(0.1); _lp = Players.LocalPlayer until _lp end
local MY_NAME = _lp.Name
local cfg = _G.ConeHat or {}
local FPS          = cfg.FPS          or 60
local SEGMENTS     = cfg.SEGMENTS     or 24
local HAT_RADIUS   = cfg.HAT_RADIUS   or 1.8
local HAT_HEIGHT   = cfg.HAT_HEIGHT   or 1.3
local HAT_Y        = cfg.HAT_Y        or 0.6
local COL_CONE     = cfg.COL_CONE     or Color3.new(0, 0, 0)
local Z_CONE       = cfg.Z_CONE       or 5
local TRANSPARENCY = cfg.TRANSPARENCY or 0.5
local REFRESH_RATE = FPS == 0 and 0 or 1 / FPS

local coneTriangles   = {}
local circleTriangles = {}

local function newTri(color, zindex)
    local t = Drawing.new('Triangle')
    t.Color        = color
    t.Filled       = true
    t.Visible      = false
    t.ZIndex       = zindex
    t.Transparency = TRANSPARENCY
    return t
end

for i = 1, SEGMENTS do
    coneTriangles[i]   = newTri(COL_CONE, Z_CONE)
    circleTriangles[i] = newTri(COL_CONE, Z_CONE - 1)
end

local function hideAll()
    for i = 1, SEGMENTS do
        coneTriangles[i].Visible   = false
        circleTriangles[i].Visible = false
    end
end

local function ringPoints(cx, cy, cz, radius, yOffset, n)
    local pts    = {}
    local worldY = cy + yOffset
    for i = 1, n do
        local angle = ((i - 1) / n) * math.pi * 2
        local wx = cx + math.cos(angle) * radius
        local wz = cz + math.sin(angle) * radius
        local s, on = WorldToScreen(Vector3.new(wx, worldY, wz))
        pts[i] = { sx = s.X, sy = s.Y, on = on }
    end
    return pts
end

local function drawHat(hx, hy, hz)
    local apexScreen, apexOn     = WorldToScreen(Vector3.new(hx, hy + HAT_Y + HAT_HEIGHT, hz))
    local centerScreen, centerOn = WorldToScreen(Vector3.new(hx, hy + HAT_Y, hz))
    local baseRing = ringPoints(hx, hy, hz, HAT_RADIUS, HAT_Y, SEGMENTS)

    local cx, cy = centerScreen.X, centerScreen.Y

    local function pushOut(px, py, amount)
        local dx, dy = px - cx, py - cy
        local len = math.sqrt(dx*dx + dy*dy)
        if len == 0 then return px, py end
        return px + (dx/len)*amount, py + (dy/len)*amount
    end

    for i = 1, SEGMENTS do
        local ni  = (i % SEGMENTS) + 1
        local p1  = baseRing[i]
        local p2  = baseRing[ni]

        local tri = coneTriangles[i]
        if p1.on or p2.on then
            tri.PointA  = Vector2.new(apexScreen.X, apexScreen.Y)
            tri.PointB  = Vector2.new(p1.sx, p1.sy)
            tri.PointC  = Vector2.new(p2.sx, p2.sy)
            tri.Visible = true
        else
            tri.Visible = false
        end

        local cir = circleTriangles[i]
        if p1.on or p2.on then
            local b1x, b1y = pushOut(p1.sx, p1.sy, 1.5)
            local b2x, b2y = pushOut(p2.sx, p2.sy, 1.5)
            cir.PointA  = Vector2.new(cx, cy)
            cir.PointB  = Vector2.new(b1x, b1y)
            cir.PointC  = Vector2.new(b2x, b2y)
            cir.Visible = true
        else
            cir.Visible = false
        end
    end
end

print("Hat script loaded")
task.spawn(function()
    while true do
        task.wait(REFRESH_RATE)
        local player = Players:FindFirstChild(MY_NAME)
        if player then
            local char = player.Character
            if char then
                local head = char:FindFirstChild('Head')
                if head then
                    drawHat(head.Position.X, head.Position.Y, head.Position.Z)
                else
                    hideAll()
                end
            else
                hideAll()
            end
        else
            hideAll()
        end
    end
end)
