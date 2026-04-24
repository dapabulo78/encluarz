// ============================================================
// Matcha Tutorials — Tutorial Engine
// Renders tutorial cards, article views with code blocks,
// table of contents, and syntax highlighting.
// ============================================================

(function () {
  'use strict';

  // ================================================================
  //  Tutorial Data
  // ================================================================

  var TUTORIALS = [
    {
      id: 'universal-shooter-lua',
      title: 'Universal Lua for All Shooters',
      author: 'diamondreaper9',
      difficulty: 'intermediate',
      description: 'Build a complete Drawing-based UI from scratch with interactive checkboxes, sliders, and a game input loop. Covers rapid fire, inf ammo for Arsenal, and more universal shooter features.',
      tags: ['Drawing API', 'UI Components', 'Input Handling', 'Game Loop'],
      sections: [
        {
          title: 'Getting the Mouse Reference',
          explanation: 'Every script that responds to user clicks needs access to the Mouse object. This gives us the current cursor position on screen so we can detect when the player clicks on our custom UI elements.',
          code: 'local Mouse = game.Players.LocalPlayer:GetMouse()',
          breakdown: '<b>game.Players.LocalPlayer</b> gets the player running the script. <b>:GetMouse()</b> returns a Mouse object with <code>.X</code> and <code>.Y</code> properties that update in real-time as the cursor moves. We store it in a local variable so we can read the position every frame in our input loop.'
        },
        {
          title: 'Drawing a Background Panel',
          explanation: 'The Drawing API lets you render shapes directly on screen without using Roblox GUI objects. This is commonly used in executor scripts because Drawing elements render on top of everything and cannot be detected by anti-cheats that scan the PlayerGui hierarchy.',
          code: '-- Square1 (Background Panel)\nlocal Square1 = Drawing.new("Square")\nSquare1.Visible = true\nSquare1.Transparency = 1\nSquare1.ZIndex = 10\nSquare1.Color = Color3.fromHex("#FFFFFF")\nSquare1.Position = Vector2.new(100, 100)\nSquare1.Size = Vector2.new(621, 385)\nSquare1.Filled = true',
          breakdown: '<b>Drawing.new("Square")</b> creates a rectangle on the screen overlay. Key properties:<br><br><b>Visible</b> &mdash; whether it renders at all.<br><b>Transparency</b> &mdash; 1 = fully visible, 0 = invisible (opposite of Roblox GUI!).<br><b>ZIndex</b> &mdash; higher numbers draw on top of lower ones.<br><b>Position</b> &mdash; top-left corner in screen pixels (Vector2).<br><b>Size</b> &mdash; width and height in pixels.<br><b>Filled</b> &mdash; true = solid fill, false = outline only.'
        },
        {
          title: 'Adding Text Labels',
          explanation: 'Text elements display information on screen. They work just like Drawing squares but render text strings instead of shapes. You control font, size, alignment, and outline.',
          code: 'local Text2 = Drawing.new("Text")\nText2.Visible = true\nText2.Transparency = 1\nText2.ZIndex = 20\nText2.Color = Color3.fromHex("#FFFFFF")\nText2.Position = Vector2.new(100, 100)\nText2.Text = "John cheating script"\nText2.Size = 22\nText2.Center = false\nText2.Outline = true\nText2.Font = Drawing.Fonts.UI',
          breakdown: '<b>Drawing.new("Text")</b> creates a text label.<br><br><b>.Text</b> &mdash; the string to display.<br><b>.Size</b> &mdash; font size in pixels.<br><b>.Center</b> &mdash; if true, the Position is the center point instead of top-left.<br><b>.Outline</b> &mdash; adds a dark stroke around the text so it\'s readable on any background.<br><b>.Font</b> &mdash; Drawing.Fonts.UI, .System, .Plex, or .Monospace.'
        },
        {
          title: 'Creating Circles',
          explanation: 'Circles are useful for decorative elements, indicators, or custom cursor overlays. The Drawing circle is actually a polygon with configurable sides, so you can make anything from a triangle to a smooth circle.',
          code: 'local Circle3 = Drawing.new("Circle")\nCircle3.Visible = true\nCircle3.Transparency = 1\nCircle3.ZIndex = 30\nCircle3.Color = Color3.fromHex("#400040")\nCircle3.Position = Vector2.new(322, 250)\nCircle3.Radius = 50\nCircle3.NumSides = 32\nCircle3.Thickness = 1\nCircle3.Filled = true',
          breakdown: '<b>Drawing.new("Circle")</b> creates a circular shape.<br><br><b>.Position</b> &mdash; the CENTER of the circle (unlike Square, which uses top-left).<br><b>.Radius</b> &mdash; size in pixels from center to edge.<br><b>.NumSides</b> &mdash; how smooth the circle looks. 32 is smooth, 3 = triangle, 6 = hexagon.<br><b>.Thickness</b> &mdash; outline width when Filled is false.<br><b>.Filled</b> &mdash; solid vs outline only.'
        },
        {
          title: 'Building a Checkbox Component',
          explanation: 'A checkbox needs three Drawing elements working together: an outer box (the clickable border), an inner filled square (the check indicator), and a text label. When clicked, we toggle a boolean and show/hide the inner square.',
          code: '-- Checkbox state\nlocal Checkbox4_IsChecked = false\n\n-- Outer box (border)\nlocal Checkbox4 = Drawing.new("Square")\nCheckbox4.Visible = true\nCheckbox4.Color = Color3.fromHex("#000000")\nCheckbox4.Thickness = 1\nCheckbox4.Filled = false\nCheckbox4.Size = Vector2.new(20, 20)\nCheckbox4.Position = Vector2.new(302, 230)\nCheckbox4.ZIndex = 41\n\n-- Inner fill (check indicator)\nlocal Checkbox4_Inner = Drawing.new("Square")\nCheckbox4_Inner.Visible = Checkbox4_IsChecked  -- starts hidden\nCheckbox4_Inner.Color = Color3.fromHex("#00FF00")\nCheckbox4_Inner.Filled = true\nCheckbox4_Inner.Size = Checkbox4.Size\nCheckbox4_Inner.Position = Checkbox4.Position\nCheckbox4_Inner.ZIndex = 40\n\n-- Label text\nlocal Checkbox4_Label = Drawing.new("Text")\nCheckbox4_Label.Visible = true\nCheckbox4_Label.Text = "turn on cheat?"\nCheckbox4_Label.Size = 16\nCheckbox4_Label.Outline = true\nCheckbox4_Label.Color = Color3.fromHex("#FFFFFF")\nCheckbox4_Label.Position = Checkbox4.Position + Vector2.new(25, 2)\nCheckbox4_Label.ZIndex = 40',
          breakdown: 'The pattern is: <b>border square</b> (Filled=false) + <b>fill square</b> (same size/pos, Filled=true, starts invisible) + <b>text label</b> (offset 25px to the right).<br><br>The inner square\'s <code>Visible</code> is set to the checkbox state. When the user clicks, we flip <code>Checkbox4_IsChecked</code> and update <code>Checkbox4_Inner.Visible</code>. The ZIndex of the border is higher than the fill so the outline always shows on top.'
        },
        {
          title: 'Building a Slider Component',
          explanation: 'A slider has three parts: a track (the background bar), a knob (the draggable handle), and a value label. The knob is constrained to move only along the track\'s X axis, and we calculate the value from its position.',
          code: '-- Slider track\nlocal Slider9 = Drawing.new("Square")\nSlider9.Color = Color3.fromHex("#444444")\nSlider9.Filled = true\nSlider9.Size = Vector2.new(200, 10)\nSlider9.Position = Vector2.new(358, 287.5)\nSlider9.ZIndex = 90\n\n-- Slider value (0 to 100)\nlocal Slider9_Value = 50\n\n-- Draggable knob\nlocal Slider9_Knob = Drawing.new("Square")\nSlider9_Knob.Color = Color3.fromHex("#FFFFFF")\nSlider9_Knob.Filled = true\nSlider9_Knob.Size = Vector2.new(20, 20)\nSlider9_Knob.Position = Slider9.Position\n    + Vector2.new(200 * 0.5 - 10, 5 - 10)\nSlider9_Knob.ZIndex = 91\n\n-- Value text above slider\nlocal Slider9_ValueText = Drawing.new("Text")\nSlider9_ValueText.Text = tostring(math.floor(Slider9_Value))\nSlider9_ValueText.Size = 16\nSlider9_ValueText.Center = true\nSlider9_ValueText.Outline = true\nSlider9_ValueText.Position = Slider9.Position\n    + Vector2.new(200/2, -10)\nSlider9_ValueText.ZIndex = 92',
          breakdown: 'The track is a thin bar (200x10). The knob is a 20x20 square positioned at 50% of the track (the default value). The initial knob X position is calculated as:<br><br><code>track.X + trackWidth * (value/100) - knobWidth/2</code><br><br>The value text sits centered above the track using <code>Center = true</code>. When dragging, we\'ll constrain the knob between <code>track.X</code> and <code>track.X + track.Width</code>.'
        },
        {
          title: 'Key Name Mapping',
          explanation: 'This table maps virtual key codes (integers) to human-readable names. Roblox executors use numeric key codes for keypress/keyrelease functions, and this lookup table lets you display friendly names in your UI.',
          code: 'local KeyNames = {\n    [48] = "0", [49] = "1", [50] = "2",\n    [51] = "3", [52] = "4", [53] = "5",\n    [65] = "A", [66] = "B", [67] = "C",\n    -- ... all alphanumeric keys ...\n    [16] = "Shift", [17] = "Ctrl",\n    [18] = "Alt", [32] = "Space",\n    [112] = "F1", [113] = "F2",\n    -- ... function keys ...\n}',
          breakdown: 'The table uses <b>numeric indices</b> matching Windows virtual key codes (VK codes). For example, <code>65</code> = "A", <code>32</code> = "Space". This is useful when you want to display which key a feature is bound to, or when mapping <code>iskeypressed(keycode)</code> results to labels in your UI.'
        },
        {
          title: 'The Input Loop',
          explanation: 'Drawing UI has no built-in click events, so we need a manual input loop that runs every frame, checks where the mouse is, and handles clicks ourselves. This is the core pattern for any Drawing-based UI.',
          code: 'local dragging = nil\nlocal dragStart = nil\nlocal startPos = nil\nlocal lastMouse1 = false\n\nwhile true do\n    wait(0.01)\n    if isrbxactive() then\n        local mouse1 = ismouse1pressed()\n        local mPos = Vector2.new(Mouse.X, Mouse.Y)\n\n        -- Detect "just pressed" (rising edge)\n        if mouse1 and not lastMouse1 then\n            -- handle clicks here\n        end\n\n        -- Detect "just released" (falling edge)\n        if not mouse1 and lastMouse1 then\n            dragging = nil\n        end\n\n        -- Update drag every frame\n        if dragging and mouse1 then\n            -- handle drag updates here\n        end\n\n        lastMouse1 = mouse1\n    end\nend',
          breakdown: '<b>while true do wait(0.01)</b> &mdash; runs ~100 times per second (100 FPS input polling).<br><br><b>isrbxactive()</b> &mdash; only process input when the Roblox window is focused.<br><br><b>Rising edge detection:</b> <code>mouse1 and not lastMouse1</code> fires only on the frame when the button first goes down &mdash; this prevents repeated triggers while holding.<br><br><b>Falling edge:</b> <code>not mouse1 and lastMouse1</code> fires when the button is released &mdash; used to end drag operations.<br><br><b>lastMouse1</b> stores the previous frame\'s state so we can detect transitions.'
        },
        {
          title: 'Hit Testing for Checkboxes',
          explanation: 'When the user clicks, we need to determine which UI element they clicked on. This is done with simple bounding-box math: check if the mouse position falls within the rectangle defined by each element\'s position and size.',
          code: '-- Inside the "just pressed" block:\nif Checkbox4.Visible\n    and mPos.X >= Checkbox4.Position.X\n    and mPos.X <= Checkbox4.Position.X\n        + Checkbox4.Size.X\n    and mPos.Y >= Checkbox4.Position.Y\n    and mPos.Y <= Checkbox4.Position.Y\n        + Checkbox4.Size.Y\nthen\n    -- Toggle the checkbox\n    Checkbox4_IsChecked = not Checkbox4_IsChecked\n    Checkbox4_Inner.Visible = Checkbox4_IsChecked\nend',
          breakdown: 'The hit test checks 4 conditions:<br><br>1. <b>mPos.X >= left edge</b> (Position.X)<br>2. <b>mPos.X <= right edge</b> (Position.X + Size.X)<br>3. <b>mPos.Y >= top edge</b> (Position.Y)<br>4. <b>mPos.Y <= bottom edge</b> (Position.Y + Size.Y)<br><br>If all 4 pass, the mouse is inside the checkbox. We flip the boolean with <code>not</code> and update the inner square\'s Visible property to match. We also check <code>Checkbox4.Visible</code> first so hidden checkboxes can\'t be clicked.'
        },
        {
          title: 'Slider Dragging Logic',
          explanation: 'Slider dragging is more complex than a checkbox click. We need to track when the drag starts, constrain the knob to the track, and continuously calculate the value as the user moves the mouse.',
          code: '-- Start drag (inside "just pressed"):\nif mPos.X >= Slider9_Knob.Position.X\n    and mPos.X <= Slider9_Knob.Position.X\n        + Slider9_Knob.Size.X\n    and mPos.Y >= Slider9_Knob.Position.Y\n    and mPos.Y <= Slider9_Knob.Position.Y\n        + Slider9_Knob.Size.Y\nthen\n    dragging = Slider9_Knob\n    dragStart = mPos\n    startPos = Slider9_Knob.Position\nend\n\n-- Update drag (every frame while held):\nif dragging == Slider9_Knob then\n    local delta = mPos - dragStart\n    dragging.Position = startPos + delta\n    -- Constrain X to track bounds\n    local minX = Slider9.Position.X\n    local maxX = Slider9.Position.X + Slider9.Size.X\n    local x = math.clamp(dragging.Position.X, minX, maxX)\n    dragging.Position = Vector2.new(x,\n        Slider9.Position.Y + 5 - dragging.Size.Y/2)\n    -- Calculate 0-100 value from position\n    local percent = (x - minX) / Slider9.Size.X\n    Slider9_Value = percent * 100\n    Slider9_ValueText.Text = tostring(\n        math.floor(Slider9_Value))\nend',
          breakdown: '<b>Drag start:</b> When the mouse clicks on the knob, we save the starting mouse position and knob position. This lets us calculate a relative delta.<br><br><b>Delta dragging:</b> Each frame, <code>mPos - dragStart</code> gives how far the mouse moved. Adding that to <code>startPos</code> moves the knob by the same amount.<br><br><b>Constraining:</b> We clamp the knob X between the track\'s left and right edges. The Y is locked to the track center.<br><br><b>Value calculation:</b> <code>(knobX - trackLeft) / trackWidth</code> gives a 0-1 percent, which we multiply by 100 for the final value. The text label updates in real-time.'
        }
      ]
    },
    {
      id: 'player-velocity-indicator',
      title: 'Player Velocity Indicator',
      author: 'starryskidder',
      difficulty: 'intermediate',
      description: 'Draw colored lines from every player showing their movement direction and speed. Covers Drawing lines, player tracking with events, manual vector math, and WorldToScreen projection.',
      tags: ['Drawing API', 'Player Tracking', 'Vector Math', 'WorldToScreen'],
      sections: [
        {
          title: 'Service References & Data Structure',
          explanation: 'The script needs the Players service to iterate over everyone in the server. We also create a <code>drawings</code> table that maps each part\'s memory address to its Drawing line object — this lets us quickly look up, update, or remove a line for any part.',
          code: 'local players = game:GetService("Players")\n\nlocal drawings = {}',
          breakdown: '<b>game:GetService("Players")</b> returns the Players service, which has methods like <code>:GetPlayers()</code> and events like <code>PlayerAdded</code>.<br><br>The <code>drawings</code> table uses <b>part.Address</b> (a unique memory address string) as the key. This is more reliable than using the part instance itself because Lua\'s table indexing on userdata can behave inconsistently in executors.'
        },
        {
          title: 'Creating & Managing Drawing Lines',
          explanation: 'The <code>updateDrawing</code> function either creates a new Drawing line for a part (first call) or updates its endpoints (subsequent calls). Each line gets a random color so you can visually distinguish different players.',
          code: 'local function updateDrawing(part, From, To)\n    if not part then return end\n\n    if not drawings[part.Address] then\n        local line = Drawing.new("Line")\n        line.Visible = true\n        line.Color = Color3.fromRGB(\n            math.random(1,255),\n            math.random(1,255),\n            math.random(1,255))\n        line.Thickness = 3\n        drawings[part.Address] = line\n        return true\n    else\n        if not To and not From then return false end\n        drawings[part.Address].To = To\n        drawings[part.Address].From = From\n        return false\n    end\nend',
          breakdown: '<b>Drawing.new("Line")</b> creates a line on the screen overlay with <code>.From</code> and <code>.To</code> endpoints (Vector2 screen coordinates).<br><br><b>First call</b> (no entry in table): creates the line, assigns a random color, stores it, returns <code>true</code>.<br><br><b>Subsequent calls</b>: updates <code>.From</code> and <code>.To</code> to move the line each frame. The <code>nil</code> guard prevents writing bad data if the caller passes nothing.'
        },
        {
          title: 'Visibility & Cleanup Helpers',
          explanation: 'Two small utility functions: one to show/hide a line without destroying it (useful when a player is temporarily off-screen), and one to permanently remove a line when a player leaves the game.',
          code: 'local function drawingVisibility(part, state)\n    if drawings[part.Address] then\n        drawings[part.Address].Visible = state\n    end\nend\n\nlocal function removeDrawing(part)\n    if not part then return end\n    if drawings[part.Address] then\n        drawings[part.Address]:Remove()\n        drawings[part.Address] = nil\n        return true\n    end\n    return false\nend',
          breakdown: '<b>drawingVisibility</b> toggles <code>.Visible</code> without destroying the object — cheaper than creating a new line every time.<br><br><b>removeDrawing</b> calls <code>:Remove()</code> to destroy the Drawing object and sets the table entry to <code>nil</code> so it gets garbage collected. Always nil out references after removal to prevent memory leaks.'
        },
        {
          title: 'Manual Vector Math',
          explanation: 'These helper functions calculate vector magnitude (length) and normalize a vector to unit length. In executor environments, you sometimes can\'t rely on built-in <code>.Magnitude</code> property, so manual math is more portable.',
          code: 'local function magnitude(Vec3)\n    return math.sqrt(\n        Vec3.X * Vec3.X\n      + Vec3.Y * Vec3.Y\n      + Vec3.Z * Vec3.Z)\nend\n\nlocal function normalize(Vec3)\n    local mag = magnitude(Vec3)\n    if mag == 0 then\n        return Vector3.new(0, 0, 0)\n    end\n    return Vector3.new(\n        Vec3.X / mag,\n        Vec3.Y / mag,\n        Vec3.Z / mag)\nend',
          breakdown: '<b>Magnitude</b> is the Euclidean distance formula: √(x² + y² + z²). It gives the total speed when applied to a velocity vector.<br><br><b>Normalize</b> divides each component by the magnitude, producing a unit vector (length 1) that preserves direction. The <code>mag == 0</code> guard prevents division by zero when the vector is stationary.'
        },
        {
          title: 'Tracking Players & HumanoidRootParts',
          explanation: 'We need to keep a live map of every player\'s HumanoidRootPart (HRP). A background loop polls existing players every 2 seconds, while events handle joins and leaves instantly.',
          code: 'local hrps = {}\nspawn(function() while true do task.wait(2)\n    for _, v in pairs(players:GetPlayers()) do\n        local char = v and v.Character\n        local hrp = char and char.HumanoidRootPart\n        if hrp then\n            hrps[v.Address] = hrp\n        end\n        updateDrawing(hrp)\n    end\nend end)\n\nplayers.PlayerAdded:Connect(function(player)\n    player.CharacterAdded:Connect(function(char)\n        local hrp = char:WaitForChild(\n            "HumanoidRootPart", 5)\n        if hrp then\n            hrps[player.Address] = hrp\n            updateDrawing(hrp)\n        end\n    end)\nend)\n\nplayers.PlayerRemoving:Connect(function(player)\n    removeDrawing(hrps[player.Address])\n    hrps[player.Address] = nil\nend)',
          breakdown: '<b>Polling loop</b> (every 2s): catches any players whose characters respawned or were missed by events.<br><br><b>PlayerAdded → CharacterAdded</b>: fires when a new player joins and their character loads. <code>:WaitForChild("HumanoidRootPart", 5)</code> waits up to 5 seconds for the part to exist.<br><br><b>PlayerRemoving</b>: cleans up the drawing and removes the HRP reference so we don\'t try to read a destroyed part.'
        },
        {
          title: 'The Main Render Loop',
          explanation: 'Every frame, we read each player\'s position and velocity, calculate a scaled endpoint, project both to screen space, and update the Drawing line. The line length is proportional to speed — faster players get longer lines.',
          code: 'local function main()\n    while true do task.wait()\n        for _, v in pairs(hrps) do\n            local start = v and v.Position\n            local velocity = v\n                and v.AssemblyLinearVelocity\n            if start and velocity then\n                local speed = magnitude(velocity)\n                local lineScale = speed / 100\n                local endPoint = start\n                    + (velocity * lineScale)\n                updateDrawing(v,\n                    WorldToScreen(start),\n                    WorldToScreen(endPoint))\n            else\n                drawingVisibility(v, false)\n            end\n        end\n    end\nend\n\ntask.spawn(main)',
          breakdown: '<b>task.wait()</b> with no argument yields for one frame (~1/60s).<br><br><b>AssemblyLinearVelocity</b> is a Vector3 representing the part\'s movement in studs/second.<br><br><b>lineScale = speed / 100</b>: normalizes the line length so a player moving at 100 studs/s gets a line equal to their velocity vector. Slower players get shorter lines.<br><br><b>endPoint = start + velocity * lineScale</b>: places the line tip in the direction of movement.<br><br><b>WorldToScreen</b> converts 3D world positions to 2D screen coordinates for the Drawing line endpoints.'
        }
      ]
    },
    {
      id: 'draw-line-to-moving-part',
      title: 'Draw a Line to Moving Parts',
      author: 'starryskidder',
      difficulty: 'intermediate',
      description: 'Detect moving parts in the workspace and draw lines pointing to them. Learn change-detection patterns, workspace scanning, Drawing line management, and an optimized version using squared-distance checks.',
      tags: ['Drawing API', 'Change Detection', 'Workspace Scan', 'Optimization'],
      sections: [
        {
          title: 'Child-Count Change Detection',
          explanation: 'This proxy table pattern tracks whether a part\'s children have changed since the last check. It stores the child count per address and returns <code>true</code> when a change is detected. This is useful for detecting when new objects are added to or removed from a part.',
          code: 'local prx = {}\nlocal function childAdded(Instance)\n    if not prx[Instance.Address] then\n        prx[Instance.Address] = {\n            childrenCount = #Instance:GetChildren(),\n            instance = Instance\n        }\n        return nil  -- first seen\n    end\n\n    local childcount = #Instance:GetChildren()\n    if childcount\n        ~= prx[Instance.Address].childrenCount\n    then\n        prx[Instance.Address].childrenCount\n            = childcount\n        return true  -- changed\n    end\n\n    return false  -- no change\nend',
          breakdown: 'The function returns <b>three possible values</b>:<br><br><code>nil</code> — first time seeing this part, just register it.<br><code>true</code> — child count changed since last check.<br><code>false</code> — no change.<br><br>Using <b>Instance.Address</b> as the key ensures each part has a unique slot even if multiple parts share the same name. The table stores both the count and the instance reference for later use.'
        },
        {
          title: 'Position Change Detection',
          explanation: 'The core detection function: compares a part\'s current position to its previously recorded position. A small threshold (magnitude check) filters out physics micro-jitter so we only flag genuinely moving parts.',
          code: 'local function samePos(a, b)\n    if a and b then\n        return a.X == b.X\n           and a.Y == b.Y\n           and a.Z == b.Z\n    end\nend\n\nlocal function magnitude(v)\n    return math.sqrt(\n        v.X * v.X + v.Y * v.Y + v.Z * v.Z)\nend\n\nlocal prx2 = {}\nlocal function positionChanged(Instance)\n    if not Instance.Position then return end\n\n    if not prx2[Instance.Address] then\n        prx2[Instance.Address] = {\n            position = Instance.Position,\n            instance = Instance\n        }\n        return nil\n    end\n\n    local pos = Instance.Position\n    local newpos = prx2[Instance.Address].position\n\n    if magnitude(pos - newpos) < 0.05 then\n        return false\n    end\n\n    if not samePos(pos, newpos) then\n        prx2[Instance.Address].position = pos\n        return true\n    end\n\n    return false\nend',
          breakdown: '<b>samePos</b> does an exact component comparison because <code>==</code> on Vector3 userdata can be unreliable in some executors.<br><br><b>magnitude threshold (0.05)</b>: parts in Roblox can micro-jitter due to physics simulation. Without this threshold, nearly every part would appear to be "moving." The 0.05 stud cutoff filters this noise.<br><br>The function follows the same <b>nil/true/false</b> return pattern: <code>nil</code> = first registration, <code>true</code> = moved, <code>false</code> = stationary or jitter.'
        },
        {
          title: 'Scanning the Workspace',
          explanation: 'At startup, we scan every descendant in Workspace and collect all Parts and MeshParts into a flat array. Then we prime both detection caches so the first real check can detect changes.',
          code: 'local allparts = {}\nfor _, v in pairs(\n    game:GetService("Workspace")\n        :GetDescendants())\ndo\n    if v:IsA("Part")\n        or v:IsA("MeshPart")\n    then\n        table.insert(allparts, v)\n    end\nend\n\n-- Prime the caches\nfor _, v in pairs(allparts) do\n    childAdded(v)\nend\nfor _, v in pairs(allparts) do\n    positionChanged(v)\nend',
          breakdown: '<b>:GetDescendants()</b> returns every object nested inside Workspace at any depth — parts, models, meshes, etc.<br><br><b>:IsA("Part") or :IsA("MeshPart")</b> filters to only physical objects. Note: <code>:IsA("BasePart")</code> would catch both in one check (used in the optimized version later).<br><br><b>Priming the caches</b>: calling <code>childAdded</code> and <code>positionChanged</code> on every part returns <code>nil</code> (first registration) and records their initial state. The next call will have a baseline to compare against.'
        },
        {
          title: 'Drawing Line Management',
          explanation: 'Three functions handle the lifecycle of Drawing lines: create/update, toggle visibility, and remove. Each Drawing is indexed by the part\'s memory address for O(1) lookup.',
          code: 'local drawings = {}\nlocal function updateDrawing(part)\n    if not drawings[part.Address] then\n        local line = Drawing.new("Line")\n        line.From = Vector2.new(0, 0)\n        line.To = Vector2.new(0, 0)\n        line.Visible = true\n        drawings[part.Address] = line\n        return true\n    else\n        drawings[part.Address].To =\n            WorldToScreen(part.Position)\n        return false\n    end\nend\n\nlocal function drawingVisibility(part, state)\n    if drawings[part.Address] then\n        drawings[part.Address].Visible = state\n    end\nend\n\nlocal function removeDrawing(part)\n    if drawings[part.Address] then\n        drawings[part.Address]:Remove()\n        drawings[part.Address] = nil\n        return true\n    end\n    return false\nend',
          breakdown: '<b>updateDrawing</b>: on first call, creates a line at (0,0)→(0,0) and stores it. On subsequent calls, updates <code>.To</code> to the part\'s screen position via <code>WorldToScreen</code>. The <code>.From</code> stays at (0,0) — the line points from the top-left corner to the moving part.<br><br><b>drawingVisibility</b>: hides the line when the part stops moving (cheaper than destroying and recreating).<br><br><b>removeDrawing</b>: fully destroys the Drawing object and clears the reference.'
        },
        {
          title: 'The Main Detection Loop',
          explanation: 'Every frame, we iterate all parts and check if their position changed. Moving parts get a visible line; stationary parts get their line hidden. This creates a live radar effect showing all moving objects.',
          code: 'local function main()\n    while true do task.wait()\n        for _, v in pairs(allparts) do\n            if positionChanged(v) == true then\n                updateDrawing(v)\n            else\n                drawingVisibility(v, false)\n            end\n        end\n    end\nend\ntask.spawn(main)',
          breakdown: '<b>task.wait()</b> yields one frame — the loop runs at the game\'s frame rate.<br><br>The check <code>== true</code> is intentional: <code>positionChanged</code> returns <code>nil</code> on first call, <code>true</code> on movement, <code>false</code> on no change. Using <code>== true</code> ensures only genuine movement triggers a line update (not the initial <code>nil</code> registration).<br><br><b>task.spawn(main)</b> runs the loop in a separate coroutine so it doesn\'t block the rest of the script.'
        },
        {
          title: 'Optimized Version — Squared Distance',
          explanation: 'The script includes a ChatGPT-optimized version that eliminates the expensive <code>math.sqrt</code> call by comparing squared distances instead. It also uses numeric <code>for</code> loops and leaner data structures for better performance.',
          code: 'local EPS = 0.1\nlocal EPS2 = EPS * EPS  -- 0.01\n\nlocal function dist2(a, b)\n    local dx = a.X - b.X\n    local dy = a.Y - b.Y\n    local dz = a.Z - b.Z\n    return dx*dx + dy*dy + dz*dz\nend\n\nlocal function positionChanged(inst)\n    local pos = inst.Position\n    if pos == nil then return nil end\n\n    local addr = inst.Address\n    local oldPos = prx2[addr]\n\n    if oldPos == nil then\n        prx2[addr] = pos\n        return nil\n    end\n\n    if dist2(pos, oldPos) <= EPS2 then\n        return false\n    end\n\n    prx2[addr] = pos\n    return true\nend',
          breakdown: '<b>Squared distance trick</b>: instead of <code>sqrt(dx²+dy²+dz²) < 0.1</code>, we check <code>dx²+dy²+dz² < 0.01</code>. Same result, no square root — a big win when checking hundreds of parts per frame.<br><br><b>Leaner cache</b>: stores just the position directly (<code>prx2[addr] = pos</code>) instead of a table with <code>{position=..., instance=...}</code>. Fewer allocations = less GC pressure.<br><br><b>Numeric loops</b> (<code>for i = 1, #allparts</code>) are faster than <code>pairs()</code> in Luau because they avoid iterator function overhead.'
        }
      ]
    },
    {
      id: 'full-bright',
      title: 'Full Bright — Memory-Level Lighting',
      author: 'starryskidder',
      difficulty: 'advanced',
      description: 'Override Roblox lighting at the memory level to create a full-bright effect. Covers memory offsets, pointer chains, reading/writing floats and colors, and invalidating the renderer to force updates.',
      tags: ['Memory', 'Lighting', 'Offsets', 'Low-Level'],
      sections: [
        {
          title: 'Defining Memory Offsets',
          explanation: 'Memory offsets are fixed distances from the start of an object\'s data in RAM. Each Roblox property (Brightness, ClockTime, etc.) lives at a specific byte offset from the Lighting object\'s base address. These offsets change with each Roblox update, so they must be reverse-engineered regularly.',
          code: 'local brightness_offset = 0x120\nlocal clocktime_offset = 0x1B8\nlocal fogend_offset = 0x134\nlocal globalshadows_offset = 0x148\nlocal ambient_offset = 0xD8\nlocal outdoorambient_offset = 0x108\n\nlocal invalidatelighting_offset = 0x148\nlocal datamodeltorenderview_offset = 0x1D0',
          breakdown: 'Each <code>0x...</code> value is a <b>hexadecimal byte offset</b>. For example, <code>0x120</code> = 288 bytes from the start of the Lighting object\'s memory.<br><br><b>Property offsets</b> (brightness, clocktime, etc.) point to where Roblox stores each lighting property in the Lighting instance\'s internal C++ struct.<br><br><b>invalidatelighting_offset</b> tells the renderer to recalculate lighting after we change values.<br><br><b>datamodeltorenderview_offset</b> is used to walk from the DataModel to the RenderView — needed to trigger the invalidation.'
        },
        {
          title: 'Getting the Lighting Service',
          explanation: 'We grab the Lighting service normally through <code>game:GetService</code>. Even though we\'re doing memory-level writes, we still need the Lua reference to get the object\'s <code>.Address</code> — the base pointer for all our offset calculations.',
          code: 'local Lighting = game:GetService("Lighting")',
          breakdown: '<b>game:GetService("Lighting")</b> returns the Lighting singleton. In the memory approach, we don\'t use its Lua properties (like <code>Lighting.Brightness</code>) — instead we use <code>Lighting.Address</code> to get the raw memory pointer and add offsets to read/write the underlying C++ values directly. This bypasses any Lua-side anti-tamper checks.'
        },
        {
          title: 'Walking the Pointer Chain',
          explanation: 'To invalidate the renderer, we need the RenderView object. It\'s not directly accessible from Lua — we have to follow a chain of pointers through memory: base address → FakeDataModel → DataModel → RenderView.',
          code: 'local fdm = memory_read("uintptr_t",\n    getbase() + 0x7E83168)\nlocal dm = memory_read("uintptr_t",\n    fdm + 0x1C0)\nlocal RenderView = memory_read("uintptr_t",\n    dm + datamodeltorenderview_offset)',
          breakdown: '<b>getbase()</b> returns the base address of the Roblox executable in memory. All global offsets are relative to this.<br><br><b>Step 1</b>: <code>getbase() + 0x7E83168</code> reads a pointer to the FakeDataModel (FDM) — Roblox\'s top-level internal object.<br><br><b>Step 2</b>: <code>fdm + 0x1C0</code> reads the actual DataModel pointer from inside the FDM.<br><br><b>Step 3</b>: <code>dm + 0x1D0</code> follows the DataModel to the RenderView, which controls the rendering pipeline. Each <code>memory_read("uintptr_t", ...)</code> dereferences a pointer (reads the address stored at that location).'
        },
        {
          title: 'Reading Colors from Memory',
          explanation: 'Roblox stores Color3 values as three consecutive 32-bit floats (R, G, B) in memory. This function reads all three components from a given address and returns a Color3 object.',
          code: 'local function readColor(address)\n    local r = memory_read("float", address)\n    local g = memory_read("float",\n        address + 0x4)\n    local b = memory_read("float",\n        address + 0x8)\n    return Color3.new(r, g, b)\nend',
          breakdown: '<b>memory_read("float", addr)</b> reads 4 bytes as a 32-bit IEEE 754 float.<br><br>The three color channels are stored <b>contiguously</b>: R at offset +0x0, G at +0x4, B at +0x8 (each float is 4 bytes = 0x4 hex).<br><br><b>Color3.new(r, g, b)</b> expects values in the 0-1 range, which is how Roblox stores them internally. This is different from <code>Color3.fromRGB</code> which expects 0-255.'
        },
        {
          title: 'Writing Colors to Memory',
          explanation: 'The inverse of readColor — takes a Color3 (with 0-255 RGB values from <code>fromRGB</code>) and writes the normalized 0-1 floats back to memory.',
          code: 'local function writeColor(address, rgb)\n    memory_write("float", address,\n        rgb.R / 255)\n    memory_write("float", address + 0x4,\n        rgb.G / 255)\n    memory_write("float", address + 0x8,\n        rgb.B / 255)\nend',
          breakdown: '<b>rgb.R / 255</b> converts from the 0-255 range (used by <code>Color3.fromRGB</code>) back to the 0-1 range that the engine stores internally.<br><br><b>memory_write("float", addr, value)</b> writes a 32-bit float to the specified address. The three writes update R, G, and B at their consecutive memory locations.'
        },
        {
          title: 'Saving Original Values',
          explanation: 'Before overwriting anything, we save the current lighting values into a table. This allows restoring the original look later if the script provides a toggle-off feature.',
          code: 'local originalLighting = {\n    Brightness = memory_read("float",\n        Lighting.Address + brightness_offset),\n    ClockTime = memory_read("float",\n        Lighting.Address + clocktime_offset),\n    FogEnd = memory_read("float",\n        Lighting.Address + fogend_offset),\n    GlobalShadows = memory_read("byte",\n        Lighting.Address + globalshadows_offset),\n    Ambient = readColor(\n        Lighting.Address + ambient_offset),\n    OutdoorAmbient = readColor(\n        Lighting.Address + outdoorambient_offset)\n}',
          breakdown: 'Each read uses <code>Lighting.Address + offset</code> to locate the property in memory.<br><br><b>"float"</b> is used for numeric properties (Brightness, ClockTime, FogEnd) — 4-byte floating point.<br><br><b>"byte"</b> is used for GlobalShadows — it\'s a boolean stored as a single byte (0 = false, 1 = true).<br><br><b>readColor</b> handles Ambient and OutdoorAmbient which are Color3 values (3 consecutive floats). Saving originals is good practice so you can undo the effect cleanly.'
        },
        {
          title: 'Spoofing the Lighting',
          explanation: 'The main function writes fullbright values to every lighting property: max brightness, daytime clock, no fog, no shadows, and pure white ambient light. The final step invalidates the render cache to force an immediate visual update.',
          code: 'local spoofedLighting = {\n    Brightness = 1,\n    ClockTime = 14,        -- 2:00 PM\n    FogEnd = 100000,       -- no fog\n    GlobalShadows = 0,     -- false\n    Ambient = Color3.fromRGB(255,255,255),\n    OutdoorAmbient = Color3.fromRGB(255,255,255)\n}\n\nlocal function spoofLighting()\n    memory_write("float",\n        Lighting.Address + brightness_offset,\n        spoofedLighting.Brightness)\n    memory_write("float",\n        Lighting.Address + clocktime_offset,\n        spoofedLighting.ClockTime)\n    memory_write("float",\n        Lighting.Address + fogend_offset,\n        spoofedLighting.FogEnd)\n    memory_write("byte",\n        Lighting.Address + globalshadows_offset,\n        spoofedLighting.GlobalShadows)\n    writeColor(\n        Lighting.Address + ambient_offset,\n        spoofedLighting.Ambient)\n    writeColor(\n        Lighting.Address + outdoorambient_offset,\n        spoofedLighting.OutdoorAmbient)\n\n    -- Force renderer to recalculate\n    memory_write("byte",\n        RenderView + invalidatelighting_offset,\n        0)\nend\n\nspoofLighting()',
          breakdown: '<b>ClockTime = 14</b>: sets the in-game time to 2 PM (brightest daylight).<br><br><b>FogEnd = 100000</b>: pushes fog so far away it\'s invisible (default is usually a few hundred studs).<br><br><b>GlobalShadows = 0</b>: disables all shadow rendering for maximum visibility.<br><br><b>White Ambient + OutdoorAmbient</b>: ensures every surface is fully lit regardless of light sources.<br><br><b>Invalidating the RenderView</b>: writing 0 to the invalidation offset tells the rendering pipeline to recompute lighting on the next frame. Without this, your changes might not take effect until the next natural lighting update.'
        }
      ]
    }
  ];

  // ================================================================
  //  DOM References
  // ================================================================

  var listView = document.getElementById('tutorialListView');
  var articleView = document.getElementById('tutorialArticleView');
  var tutorialList = document.getElementById('tutorialList');
  var articleHeader = document.getElementById('articleHeader');
  var articleContent = document.getElementById('articleContent');
  var tocList = document.getElementById('tocList');
  var backToList = document.getElementById('backToList');

  var codeMirrorInstances = [];
  var currentTutorial = null;

  // ================================================================
  //  Helpers
  // ================================================================

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function copyToClipboard(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showCopied(btn); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopied(btn);
    }
  }

  function showCopied(btn) {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  }

  // ================================================================
  //  Render Tutorial List
  // ================================================================

  function renderList() {
    tutorialList.innerHTML = '';
    for (var i = 0; i < TUTORIALS.length; i++) {
      var t = TUTORIALS[i];
      var card = document.createElement('div');
      card.className = 'tutorial-card';
      card.setAttribute('data-idx', i);

      var tagsHTML = '';
      for (var j = 0; j < t.tags.length; j++) {
        tagsHTML += '<span class="tag-pill">' + escapeHTML(t.tags[j]) + '</span>';
      }

      card.innerHTML =
        '<div class="tutorial-card-top">' +
          '<div class="tutorial-card-icon">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' +
          '</div>' +
          '<div class="tutorial-card-info">' +
            '<div class="tutorial-card-title">' + escapeHTML(t.title) + '</div>' +
            '<div class="tutorial-card-meta">' +
              '<span class="script-author">@' + escapeHTML(t.author) + '</span>' +
              '<span class="difficulty-badge difficulty-' + t.difficulty + '">' +
                t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1) +
              '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tutorial-card-desc">' + escapeHTML(t.description) + '</div>' +
        '<div class="tutorial-card-tags">' + tagsHTML + '</div>';

      card.addEventListener('click', (function (idx) {
        return function () { openTutorial(idx); };
      })(i));

      tutorialList.appendChild(card);
    }
  }

  // ================================================================
  //  Open Tutorial Article
  // ================================================================

  function openTutorial(idx) {
    var t = TUTORIALS[idx];
    currentTutorial = t;

    // Clean up previous CodeMirror instances
    for (var c = 0; c < codeMirrorInstances.length; c++) {
      codeMirrorInstances[c].toTextArea();
    }
    codeMirrorInstances = [];

    // Fill header
    articleHeader.innerHTML =
      '<h1>' + escapeHTML(t.title) + '</h1>' +
      '<div class="article-header-meta">' +
        '<span class="script-author">@' + escapeHTML(t.author) + '</span>' +
        '<span class="difficulty-badge difficulty-' + t.difficulty + '">' +
          t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1) +
        '</span>' +
      '</div>' +
      '<p>' + escapeHTML(t.description) + '</p>';

    // Fill TOC
    tocList.innerHTML = '';
    for (var i = 0; i < t.sections.length; i++) {
      var s = t.sections[i];
      var slug = 'section-' + slugify(s.title);
      var li = document.createElement('li');
      li.innerHTML = '<a href="#' + slug + '" class="toc-link" data-idx="' + i + '">' +
        '<span style="color:var(--green-400);margin-right:6px;">' + (i + 1) + '.</span>' +
        escapeHTML(s.title) + '</a>';
      tocList.appendChild(li);
    }

    // Fill content sections
    articleContent.innerHTML = '';
    for (var i = 0; i < t.sections.length; i++) {
      var s = t.sections[i];
      var slug = 'section-' + slugify(s.title);

      var section = document.createElement('div');
      section.className = 'article-section';
      section.id = slug;

      var codeId = 'code-' + t.id + '-' + i;

      section.innerHTML =
        '<h2><span class="section-number">' + (i + 1) + '</span> ' + escapeHTML(s.title) + '</h2>' +
        '<div class="explanation">' + s.explanation + '</div>' +
        '<div class="code-block">' +
          '<div class="code-block-header">' +
            '<span>lua</span>' +
            '<button class="code-block-copy" data-code-idx="' + i + '">Copy</button>' +
          '</div>' +
          '<textarea id="' + codeId + '">' + escapeHTML(s.code) + '</textarea>' +
        '</div>' +
        '<div class="breakdown">' +
          '<div class="breakdown-title">How it works</div>' +
          '<p>' + s.breakdown + '</p>' +
        '</div>';

      articleContent.appendChild(section);
    }

    // Initialize CodeMirror for each code block
    setTimeout(function () {
      for (var i = 0; i < t.sections.length; i++) {
        var codeId = 'code-' + t.id + '-' + i;
        var ta = document.getElementById(codeId);
        if (ta) {
          var lines = t.sections[i].code.split('\n').length;
          var cm = CodeMirror.fromTextArea(ta, {
            mode: 'lua',
            theme: 'material-darker',
            lineNumbers: true,
            readOnly: true,
            viewportMargin: Infinity
          });
          cm.setSize(null, Math.max(lines * 22 + 16, 60));
          codeMirrorInstances.push(cm);
        }
      }
    }, 50);

    // Wire copy buttons
    var copyBtns = articleContent.querySelectorAll('.code-block-copy');
    for (var b = 0; b < copyBtns.length; b++) {
      copyBtns[b].addEventListener('click', (function (idx) {
        return function (e) {
          e.stopPropagation();
          copyToClipboard(t.sections[idx].code, this);
        };
      })(parseInt(copyBtns[b].getAttribute('data-code-idx'))));
    }

    // Show article view
    listView.style.display = 'none';
    articleView.classList.add('active');
    window.scrollTo(0, 0);

    // Setup TOC scroll tracking
    setupScrollTracking();
  }

  // ================================================================
  //  Close Article — Back to List
  // ================================================================

  function closeArticle() {
    articleView.classList.remove('active');
    listView.style.display = '';
    currentTutorial = null;
    window.scrollTo(0, 0);
  }

  backToList.addEventListener('click', function (e) {
    e.preventDefault();
    closeArticle();
  });

  // ================================================================
  //  TOC Scroll Tracking
  // ================================================================

  function setupScrollTracking() {
    var sections = articleContent.querySelectorAll('.article-section');
    var tocLinks = tocList.querySelectorAll('.toc-link');

    function updateActive() {
      var scrollPos = window.scrollY + 100;
      var activeIdx = 0;

      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= scrollPos) {
          activeIdx = i;
        }
      }

      for (var j = 0; j < tocLinks.length; j++) {
        tocLinks[j].classList.toggle('active', j === activeIdx);
      }
    }

    window.addEventListener('scroll', updateActive);
    updateActive();
  }

  // ================================================================
  //  TOC smooth scroll on click
  // ================================================================

  tocList.addEventListener('click', function (e) {
    var link = e.target.closest('.toc-link');
    if (!link) return;
    e.preventDefault();
    var href = link.getAttribute('href');
    var target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ================================================================
  //  Init
  // ================================================================

  renderList();

})();
