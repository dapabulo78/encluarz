local Mouse = game.Players.LocalPlayer:GetMouse()

-- Square1 (Square)
local Square1 = Drawing.new("Square")
Square1.Visible = true
Square1.Transparency = 1
Square1.ZIndex = 10
Square1.Color = Color3.fromHex("#FFFFFF")
Square1.Position = Vector2.new(100, 100)
Square1.Size = Vector2.new(621, 385)
Square1.Filled = true

-- Text2 (Text)
local Text2 = Drawing.new("Text")
Text2.Visible = true
Text2.Transparency = 1
Text2.ZIndex = 20
Text2.Color = Color3.fromHex("#FFFFFF")
Text2.Position = Vector2.new(100, 100)
Text2.Text = "John cheating script"
Text2.Size = 22
Text2.Center = false
Text2.Outline = true
Text2.Font = Drawing.Fonts.UI

-- Circle3 (Circle)
local Circle3 = Drawing.new("Circle")
Circle3.Visible = true
Circle3.Transparency = 1
Circle3.ZIndex = 30
Circle3.Color = Color3.fromHex("#400040")
Circle3.Position = Vector2.new(322, 250)
Circle3.Radius = 50
Circle3.NumSides = 32
Circle3.Thickness = 1
Circle3.Filled = true

-- Checkbox4 (Checkbox)

-- Checkbox Checkbox4
local Checkbox4_IsChecked = false
local Checkbox4 = Drawing.new("Square")
Checkbox4.Visible = true
Checkbox4.Transparency = 1
Checkbox4.Color = Color3.fromHex("#000000")
Checkbox4.Thickness = 1
Checkbox4.Filled = false
Checkbox4.Size = Vector2.new(20, 20)
Checkbox4.Position = Vector2.new(302, 230)
Checkbox4.ZIndex = 41
local Checkbox4_Inner = Drawing.new("Square")
Checkbox4_Inner.Visible = true and Checkbox4_IsChecked
Checkbox4_Inner.Transparency = 1
Checkbox4_Inner.Color = Color3.fromHex("#00FF00")
Checkbox4_Inner.Filled = true
Checkbox4_Inner.Size = Checkbox4.Size
Checkbox4_Inner.Position = Checkbox4.Position
Checkbox4_Inner.ZIndex = 40
local Checkbox4_Label = Drawing.new("Text")
Checkbox4_Label.Visible = true
Checkbox4_Label.Text = "turn on cheat?"
Checkbox4_Label.Size = 16
Checkbox4_Label.Outline = true
Checkbox4_Label.Font = 0
Checkbox4_Label.Color = Color3.fromHex("#FFFFFF")
Checkbox4_Label.Position = Checkbox4.Position + Vector2.new(25, 2)
Checkbox4_Label.ZIndex = 40

-- Checkbox5 (Checkbox)

-- Checkbox Checkbox5
local Checkbox5_IsChecked = false
local Checkbox5 = Drawing.new("Square")
Checkbox5.Visible = true
Checkbox5.Transparency = 1
Checkbox5.Color = Color3.fromHex("#000000")
Checkbox5.Thickness = 1
Checkbox5.Filled = false
Checkbox5.Size = Vector2.new(20, 20)
Checkbox5.Position = Vector2.new(302, 257)
Checkbox5.ZIndex = 51
local Checkbox5_Inner = Drawing.new("Square")
Checkbox5_Inner.Visible = true and Checkbox5_IsChecked
Checkbox5_Inner.Transparency = 1
Checkbox5_Inner.Color = Color3.fromHex("#00FF00")
Checkbox5_Inner.Filled = true
Checkbox5_Inner.Size = Checkbox5.Size
Checkbox5_Inner.Position = Checkbox5.Position
Checkbox5_Inner.ZIndex = 50
local Checkbox5_Label = Drawing.new("Text")
Checkbox5_Label.Visible = true
Checkbox5_Label.Text = "turn on mega cheat? (UNSAFE)"
Checkbox5_Label.Size = 16
Checkbox5_Label.Outline = true
Checkbox5_Label.Font = 0
Checkbox5_Label.Color = Color3.fromHex("#FFFFFF")
Checkbox5_Label.Position = Checkbox5.Position + Vector2.new(25, 2)
Checkbox5_Label.ZIndex = 50

-- Checkbox6 (Checkbox)

-- Checkbox Checkbox6
local Checkbox6_IsChecked = false
local Checkbox6 = Drawing.new("Square")
Checkbox6.Visible = true
Checkbox6.Transparency = 1
Checkbox6.Color = Color3.fromHex("#000000")
Checkbox6.Thickness = 1
Checkbox6.Filled = false
Checkbox6.Size = Vector2.new(20, 20)
Checkbox6.Position = Vector2.new(107, 449)
Checkbox6.ZIndex = 61
local Checkbox6_Inner = Drawing.new("Square")
Checkbox6_Inner.Visible = true and Checkbox6_IsChecked
Checkbox6_Inner.Transparency = 1
Checkbox6_Inner.Color = Color3.fromHex("#00FF00")
Checkbox6_Inner.Filled = true
Checkbox6_Inner.Size = Checkbox6.Size
Checkbox6_Inner.Position = Checkbox6.Position
Checkbox6_Inner.ZIndex = 60
local Checkbox6_Label = Drawing.new("Text")
Checkbox6_Label.Visible = true
Checkbox6_Label.Text = "give mega cheat option?"
Checkbox6_Label.Size = 16
Checkbox6_Label.Outline = true
Checkbox6_Label.Font = 0
Checkbox6_Label.Color = Color3.fromHex("#FFFFFF")
Checkbox6_Label.Position = Checkbox6.Position + Vector2.new(25, 2)
Checkbox6_Label.ZIndex = 60

-- Checkbox7 (Checkbox)

-- Checkbox Checkbox7
local Checkbox7_IsChecked = false
local Checkbox7 = Drawing.new("Square")
Checkbox7.Visible = true
Checkbox7.Transparency = 1
Checkbox7.Color = Color3.fromHex("#000000")
Checkbox7.Thickness = 1
Checkbox7.Filled = false
Checkbox7.Size = Vector2.new(20, 20)
Checkbox7.Position = Vector2.new(107, 415)
Checkbox7.ZIndex = 71
local Checkbox7_Inner = Drawing.new("Square")
Checkbox7_Inner.Visible = true and Checkbox7_IsChecked
Checkbox7_Inner.Transparency = 1
Checkbox7_Inner.Color = Color3.fromHex("#00FF00")
Checkbox7_Inner.Filled = true
Checkbox7_Inner.Size = Checkbox7.Size
Checkbox7_Inner.Position = Checkbox7.Position
Checkbox7_Inner.ZIndex = 70
local Checkbox7_Label = Drawing.new("Text")
Checkbox7_Label.Visible = true
Checkbox7_Label.Text = "toggle"
Checkbox7_Label.Size = 16
Checkbox7_Label.Outline = true
Checkbox7_Label.Font = 0
Checkbox7_Label.Color = Color3.fromHex("#FFFFFF")
Checkbox7_Label.Position = Checkbox7.Position + Vector2.new(25, 2)
Checkbox7_Label.ZIndex = 70

-- Checkbox8 (Checkbox)

-- Checkbox Checkbox8
local Checkbox8_IsChecked = false
local Checkbox8 = Drawing.new("Square")
Checkbox8.Visible = true
Checkbox8.Transparency = 1
Checkbox8.Color = Color3.fromHex("#000000")
Checkbox8.Thickness = 1
Checkbox8.Filled = false
Checkbox8.Size = Vector2.new(20, 20)
Checkbox8.Position = Vector2.new(107, 387)
Checkbox8.ZIndex = 81
local Checkbox8_Inner = Drawing.new("Square")
Checkbox8_Inner.Visible = true and Checkbox8_IsChecked
Checkbox8_Inner.Transparency = 1
Checkbox8_Inner.Color = Color3.fromHex("#00FF00")
Checkbox8_Inner.Filled = true
Checkbox8_Inner.Size = Checkbox8.Size
Checkbox8_Inner.Position = Checkbox8.Position
Checkbox8_Inner.ZIndex = 80
local Checkbox8_Label = Drawing.new("Text")
Checkbox8_Label.Visible = true
Checkbox8_Label.Text = "toggle (non da hood mode)"
Checkbox8_Label.Size = 16
Checkbox8_Label.Outline = true
Checkbox8_Label.Font = 0
Checkbox8_Label.Color = Color3.fromHex("#FFFFFF")
Checkbox8_Label.Position = Checkbox8.Position + Vector2.new(25, 2)
Checkbox8_Label.ZIndex = 80

-- Slider9 (Slider)

-- Slider Slider9
local Slider9 = Drawing.new("Square")
Slider9.Visible = true
Slider9.Transparency = 1
Slider9.Color = Color3.fromHex("#444444")
Slider9.Filled = true
Slider9.Size = Vector2.new(200, 10)
Slider9.Position = Vector2.new(358, 287.5)
Slider9.ZIndex = 90
local Slider9_Value = 50
local Slider9_Knob = Drawing.new("Square")
Slider9_Knob.Visible = true
Slider9_Knob.Transparency = 1
Slider9_Knob.Color = Color3.fromHex("#FFFFFF")
Slider9_Knob.Filled = true
Slider9_Knob.Size = Vector2.new(20, 20)
Slider9_Knob.Position = Slider9.Position + Vector2.new(200 * 0.5 - 10, 5 - 10)
Slider9_Knob.ZIndex = 91
Slider9_Knob.Corner = 100
local Slider9_ValueText = Drawing.new("Text")
Slider9_ValueText.Visible = true
Slider9_ValueText.Text = tostring(math.floor(Slider9_Value)) .. ""
Slider9_ValueText.Size = 16
Slider9_ValueText.Center = true
Slider9_ValueText.Outline = true
Slider9_ValueText.Color = Color3.new(1, 1, 1)
Slider9_ValueText.Position = Slider9.Position + Vector2.new(200/2, -10)
Slider9_ValueText.ZIndex = 92

-- Circle10 (Circle)
local Circle10 = Drawing.new("Circle")
Circle10.Visible = true
Circle10.Transparency = 1
Circle10.ZIndex = 100
Circle10.Color = Color3.fromHex("#00ff00")
Circle10.Position = Vector2.new(617, 387)
Circle10.Radius = 50
Circle10.NumSides = 32
Circle10.Thickness = 1
Circle10.Filled = true

-- Checkbox11 (Checkbox)

-- Checkbox Checkbox11
local Checkbox11_IsChecked = false
local Checkbox11 = Drawing.new("Square")
Checkbox11.Visible = true
Checkbox11.Transparency = 1
Checkbox11.Color = Color3.fromHex("#000000")
Checkbox11.Thickness = 1
Checkbox11.Filled = false
Checkbox11.Size = Vector2.new(20, 20)
Checkbox11.Position = Vector2.new(544, 377)
Checkbox11.ZIndex = 111
local Checkbox11_Inner = Drawing.new("Square")
Checkbox11_Inner.Visible = true and Checkbox11_IsChecked
Checkbox11_Inner.Transparency = 1
Checkbox11_Inner.Color = Color3.fromHex("#00FF00")
Checkbox11_Inner.Filled = true
Checkbox11_Inner.Size = Checkbox11.Size
Checkbox11_Inner.Position = Checkbox11.Position
Checkbox11_Inner.ZIndex = 110
local Checkbox11_Label = Drawing.new("Text")
Checkbox11_Label.Visible = true
Checkbox11_Label.Text = "turn red? (CRASHES)"
Checkbox11_Label.Size = 16
Checkbox11_Label.Outline = true
Checkbox11_Label.Font = 0
Checkbox11_Label.Color = Color3.fromHex("#FFFFFF")
Checkbox11_Label.Position = Checkbox11.Position + Vector2.new(25, 2)
Checkbox11_Label.ZIndex = 110

local KeyNames = {
    [48] = "0",
    [49] = "1",
    [50] = "2",
    [51] = "3",
    [52] = "4",
    [53] = "5",
    [54] = "6",
    [55] = "7",
    [56] = "8",
    [57] = "9",
    [1] = "LeftMouse",
    [2] = "RightMouse",
    [4] = "MiddleMouse",
    [8] = "Backspace",
    [9] = "Tab",
    [13] = "Enter",
    [16] = "Shift",
    [17] = "Ctrl",
    [18] = "Alt",
    [19] = "Pause",
    [20] = "CapsLock",
    [27] = "Esc",
    [32] = "Space",
    [33] = "PageUp",
    [34] = "PageDown",
    [35] = "End",
    [36] = "Home",
    [37] = "Left",
    [38] = "Up",
    [39] = "Right",
    [40] = "Down",
    [45] = "Insert",
    [46] = "Delete",
    [65] = "A",
    [66] = "B",
    [67] = "C",
    [68] = "D",
    [69] = "E",
    [70] = "F",
    [71] = "G",
    [72] = "H",
    [73] = "I",
    [74] = "J",
    [75] = "K",
    [76] = "L",
    [77] = "M",
    [78] = "N",
    [79] = "O",
    [80] = "P",
    [81] = "Q",
    [82] = "R",
    [83] = "S",
    [84] = "T",
    [85] = "U",
    [86] = "V",
    [87] = "W",
    [88] = "X",
    [89] = "Y",
    [90] = "Z",
    [112] = "F1",
    [113] = "F2",
    [114] = "F3",
    [115] = "F4",
    [116] = "F5",
    [117] = "F6",
    [118] = "F7",
    [119] = "F8",
    [120] = "F9",
    [121] = "F10",
    [122] = "F11",
    [123] = "F12",
}

-- Input Handling
local dragging = nil
local dragStart = nil
local startPos = nil
local knobStartPos = nil
local lastMouse1 = false

while true do
    wait(0.01)
    if isrbxactive() then
        local mouse1 = ismouse1pressed()
        local mPos = Vector2.new(Mouse.X, Mouse.Y)

        -- Mouse Down (Just Pressed)
        if mouse1 and not lastMouse1 then
            -- Button Checkbox4
            if Checkbox4.Visible and mPos.X >= Checkbox4.Position.X and mPos.X <= Checkbox4.Position.X + Checkbox4.Size.X and
               mPos.Y >= Checkbox4.Position.Y and mPos.Y <= Checkbox4.Position.Y + Checkbox4.Size.Y then
                -- Toggle Checkbox
                Checkbox4_IsChecked = not Checkbox4_IsChecked
                Checkbox4_Inner.Visible = Checkbox4_IsChecked
                if onToggle then pcall(function() onToggle(Checkbox4_IsChecked) end) end
            end
            -- Button Checkbox5
            if Checkbox5.Visible and mPos.X >= Checkbox5.Position.X and mPos.X <= Checkbox5.Position.X + Checkbox5.Size.X and
               mPos.Y >= Checkbox5.Position.Y and mPos.Y <= Checkbox5.Position.Y + Checkbox5.Size.Y then
                -- Toggle Checkbox
                Checkbox5_IsChecked = not Checkbox5_IsChecked
                Checkbox5_Inner.Visible = Checkbox5_IsChecked
                if onToggle then pcall(function() onToggle(Checkbox5_IsChecked) end) end
            end
            -- Button Checkbox6
            if Checkbox6.Visible and mPos.X >= Checkbox6.Position.X and mPos.X <= Checkbox6.Position.X + Checkbox6.Size.X and
               mPos.Y >= Checkbox6.Position.Y and mPos.Y <= Checkbox6.Position.Y + Checkbox6.Size.Y then
                -- Toggle Checkbox
                Checkbox6_IsChecked = not Checkbox6_IsChecked
                Checkbox6_Inner.Visible = Checkbox6_IsChecked
                if onToggle then pcall(function() onToggle(Checkbox6_IsChecked) end) end
            end
            -- Button Checkbox7
            if Checkbox7.Visible and mPos.X >= Checkbox7.Position.X and mPos.X <= Checkbox7.Position.X + Checkbox7.Size.X and
               mPos.Y >= Checkbox7.Position.Y and mPos.Y <= Checkbox7.Position.Y + Checkbox7.Size.Y then
                -- Toggle Checkbox
                Checkbox7_IsChecked = not Checkbox7_IsChecked
                Checkbox7_Inner.Visible = Checkbox7_IsChecked
                if onToggle then pcall(function() onToggle(Checkbox7_IsChecked) end) end
            end
            -- Button Checkbox8
            if Checkbox8.Visible and mPos.X >= Checkbox8.Position.X and mPos.X <= Checkbox8.Position.X + Checkbox8.Size.X and
               mPos.Y >= Checkbox8.Position.Y and mPos.Y <= Checkbox8.Position.Y + Checkbox8.Size.Y then
                -- Toggle Checkbox
                Checkbox8_IsChecked = not Checkbox8_IsChecked
                Checkbox8_Inner.Visible = Checkbox8_IsChecked
                if onToggle then pcall(function() onToggle(Checkbox8_IsChecked) end) end
            end
            -- Button Checkbox11
            if Checkbox11.Visible and mPos.X >= Checkbox11.Position.X and mPos.X <= Checkbox11.Position.X + Checkbox11.Size.X and
               mPos.Y >= Checkbox11.Position.Y and mPos.Y <= Checkbox11.Position.Y + Checkbox11.Size.Y then
                -- Toggle Checkbox
                Checkbox11_IsChecked = not Checkbox11_IsChecked
                Checkbox11_Inner.Visible = Checkbox11_IsChecked
                if onToggle then pcall(function() onToggle(Checkbox11_IsChecked) end) end
            end
            -- Drag Slider9
            if Slider9_Knob.Visible and mPos.X >= Slider9_Knob.Position.X and mPos.X <= Slider9_Knob.Position.X + Slider9_Knob.Size.X and
               mPos.Y >= Slider9_Knob.Position.Y and mPos.Y <= Slider9_Knob.Position.Y + Slider9_Knob.Size.Y then
                dragging = Slider9_Knob
                dragStart = mPos
                startPos = Slider9_Knob.Position
            end
        end

        -- Mouse Up (Just Released)
        if not mouse1 and lastMouse1 then
            dragging = nil
        end

        -- Dragging Update
        if dragging and mouse1 then
            local delta = mPos - dragStart
            dragging.Position = startPos + delta
            if dragging == Slider9_Knob then
                -- Constrain to track
                local minX = Slider9.Position.X
                local maxX = Slider9.Position.X + Slider9.Size.X
                if dragging.Position.X < minX then dragging.Position = Vector2.new(minX, dragging.Position.Y) end
                if dragging.Position.X > maxX then dragging.Position = Vector2.new(maxX, dragging.Position.Y) end
                dragging.Position = Vector2.new(dragging.Position.X, Slider9.Position.Y + 5 - dragging.Size.Y/2)
                -- Calculate Value
                local percent = (dragging.Position.X - minX) / (Slider9.Size.X)
                local value = 0 + (100 - 0) * percent
                Slider9_Value = value
                Slider9_ValueText.Text = tostring(math.floor(value)) .. ""
                pcall(function() onChanged(value) end)
            end
        end

        lastMouse1 = mouse1
    end
end
