-- Load Naska UI
local _naskaSrc = game:HttpGet("https://raw.githubusercontent.com/edutuu9/mycutelittlerankauilib/refs/heads/main/naska.lua")
_naskaSrc = _naskaSrc:gsub("%s*return%s+ui%s*$", "")
loadstring(_naskaSrc .. "\n_G.__naska_ui = ui")()
local ui = _G.__naska_ui
local RunService
do
    local _RS_table = {}
    local Render_Step_Priority_Bindings = {}
    local Thread_Execution_Active_State = true
    local Performance_Last_Tick_Timestamp = os.clock()
    local Metrics_Accumulated_Frame_Counter = 0
    local Cache_Sorted_Binding_Registry = {}
    local Cache_Validated_Bind_Count = 0
    local Error_Handling_Max_Threshold_Limit = 10
    local Error_Tracking_Current_Count = 0
    local function Signal()
        local SignalObject = {}
        SignalObject.ActiveConnections = {}
        function SignalObject:Connect(CallbackFunction)
            local ConnectionObject = {Function = CallbackFunction, Connected = true}
            table.insert(SignalObject.ActiveConnections, ConnectionObject)
            return {
                Disconnect = function()
                    ConnectionObject.Connected = false
                    ConnectionObject.Function = nil
                end
            }
        end
        function SignalObject:Fire(...)
            local ConnectionIndex = 1
            while ConnectionIndex <= #SignalObject.ActiveConnections do
                local ConnectionObject = SignalObject.ActiveConnections[ConnectionIndex]
                if ConnectionObject.Connected then
                    local ExecutionSuccess, ExecutionError = pcall(ConnectionObject.Function, ...)
                    if not ExecutionSuccess then
                        Error_Tracking_Current_Count = Error_Tracking_Current_Count + 1
                        if Error_Tracking_Current_Count >= Error_Handling_Max_Threshold_Limit then
                            warn(string.format("[RunService] Maximum errors reached (%d), shutting down", Error_Handling_Max_Threshold_Limit))
                            Thread_Execution_Active_State = false
                            return
                        end
                    end
                    ConnectionIndex = ConnectionIndex + 1
                else
                    table.remove(SignalObject.ActiveConnections, ConnectionIndex)
                end
            end
        end
        function SignalObject:Wait()
            local CurrentThread = coroutine.running()
            local WaitConnection
            WaitConnection = SignalObject:Connect(function(...)
                if WaitConnection then
                    WaitConnection:Disconnect()
                end
                task.spawn(CurrentThread, ...)
            end)
            return coroutine.yield()
        end
        return SignalObject
    end
    _RS_table.Heartbeat = Signal()
    _RS_table.RenderStepped = Signal()
    _RS_table.Stepped = Signal()
    function _RS_table:BindToRenderStep(BindName, BindPriority, BindFunction)
        if type(BindName) ~= "string" or type(BindFunction) ~= "function" then
            return
        end
        Render_Step_Priority_Bindings[BindName] = {Priority = BindPriority or 0, Function = BindFunction}
    end
    function _RS_table:UnbindFromRenderStep(BindName)
        Render_Step_Priority_Bindings[BindName] = nil
    end
    function _RS_table:IsRunning()
        return Thread_Execution_Active_State
    end
    task.spawn(function()
        while Thread_Execution_Active_State do
            local Loop_Execution_Success = pcall(function()
                local Timing_Current_Frame_Timestamp = os.clock()
                local Timing_Delta_Frame_Interval = math.min(Timing_Current_Frame_Timestamp - Performance_Last_Tick_Timestamp, 1)
                Performance_Last_Tick_Timestamp = Timing_Current_Frame_Timestamp
                Metrics_Accumulated_Frame_Counter = Metrics_Accumulated_Frame_Counter + 1
                if Thread_Execution_Active_State then
                    _RS_table.Stepped:Fire(Timing_Current_Frame_Timestamp, Timing_Delta_Frame_Interval)
                end
                if Thread_Execution_Active_State then
                    local Binding_Active_Count_Snapshot = 0
                    for _ in pairs(Render_Step_Priority_Bindings) do
                        Binding_Active_Count_Snapshot = Binding_Active_Count_Snapshot + 1
                    end
                    if Binding_Active_Count_Snapshot ~= Cache_Validated_Bind_Count then
                        Cache_Sorted_Binding_Registry = {}
                        for Bind_Name, Bind_Data in pairs(Render_Step_Priority_Bindings) do
                            if Bind_Data and type(Bind_Data.Function) == "function" then
                                table.insert(Cache_Sorted_Binding_Registry, Bind_Data)
                            end
                        end
                        table.sort(Cache_Sorted_Binding_Registry, function(Bind_A, Bind_B)
                            return Bind_A.Priority < Bind_B.Priority
                        end)
                        Cache_Validated_Bind_Count = Binding_Active_Count_Snapshot
                    end
                    for Bind_Index = 1, #Cache_Sorted_Binding_Registry do
                        if not Thread_Execution_Active_State then
                            break
                        end
                        local Binding_Current_Execution_Target = Cache_Sorted_Binding_Registry[Bind_Index]
                        if Binding_Current_Execution_Target and Binding_Current_Execution_Target.Function then
                            pcall(Binding_Current_Execution_Target.Function, Timing_Delta_Frame_Interval)
                        end
                    end
                end
                if Thread_Execution_Active_State then
                    _RS_table.RenderStepped:Fire(Timing_Delta_Frame_Interval)
                end
                if Thread_Execution_Active_State then
                    _RS_table.Heartbeat:Fire(Timing_Delta_Frame_Interval)
                end
            end)
            if not Loop_Execution_Success then
                Error_Tracking_Current_Count = Error_Tracking_Current_Count + 1
                if Error_Tracking_Current_Count >= Error_Handling_Max_Threshold_Limit then
                    Thread_Execution_Active_State = false
                    break
                end
            else
                Error_Tracking_Current_Count = math.max(0, Error_Tracking_Current_Count - 1)
            end
            if Thread_Execution_Active_State then
                task.wait()
            end
        end
    end)
    RunService = _RS_table
end
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local mouse = player:GetMouse()
local camera = workspace.CurrentCamera
local SPACE = 0x20
local CONFIG = {
    bhop = {
        enabled = false,
        key = nil,
        velThreshold = 1,
        jumpDelay = 0.01,
        tickRate = 0.01,
        autoStrafe = false,
        strafeSens = 2,
    },
    autofarm = {
        enabled = false,
        skyX = -7.570,
        skyY = 380.103,
        skyZ = 86.898,
        collectionTime = 0.3,
        safetyInterval = 0.5,
        safeRadius = 40,
        botRetryDelay = 2,
        safetyEnabled = true,
    },
    coneHat = {
        enabled = false,
        fps = 60,
        segments = 24,
        radius = 1.8,
        height = 1.3,
        yOffset = 0.6,
        color = Color3.new(0, 0, 0),
        zindex = 5,
    },
    nextbotEsp = {
        enabled = false,
        showBox = true,
        showName = true,
        showDist = true,
        showLine = false,
        fillBox = false,
        fillOpacity = 0.15,
        boxColor = Color3.fromRGB(255, 60, 60),
        nameColor = Color3.fromRGB(255, 255, 255),
        distColor = Color3.fromRGB(255, 200, 0),
        lineColor = Color3.fromRGB(255, 60, 60),
        thickness = 1,
        maxDist = 500,
        minBoxSize = 20,
    },
}
local nextbotDrawings = {}
local function ClearAllNextbotESP()
    for _, entry in pairs(nextbotDrawings) do
        if entry.box then entry.box:Remove() end
        if entry.fill then entry.fill:Remove() end
        if entry.label then entry.label:Remove() end
        if entry.dist then entry.dist:Remove() end
        if entry.line then entry.line:Remove() end
    end
    nextbotDrawings = {}
end
local function HideAllESP()
    for _, entry in pairs(nextbotDrawings) do
        if entry.box then entry.box.Visible = false end
        if entry.fill then entry.fill.Visible = false end
        if entry.label then entry.label.Visible = false end
        if entry.dist then entry.dist.Visible = false end
        if entry.line then entry.line.Visible = false end
    end
end
local playerNamesCache = {}
Players.PlayerAdded:Connect(function(p) playerNamesCache[p.Name] = true end)
Players.PlayerRemoving:Connect(function(p) playerNamesCache[p.Name] = nil end)
for _, p in ipairs(Players:GetPlayers()) do playerNamesCache[p.Name] = true end
local playersFolder = nil
local _seen = {}
local cachedChildren = {}
local cachedChildCount = -1
local screenCX, screenCY = 960, 540
local function RebuildChildrenCache()
    if not playersFolder then return end
    cachedChildren = playersFolder:GetChildren()
    cachedChildCount = #cachedChildren
end
local function SetVisible(obj, v)
    if obj.Visible ~= v then obj.Visible = v end
end
local function SetText(obj, t)
    if obj.Text ~= t then obj.Text = t end
end
local function SetPos2(obj, x, y)
    local p = obj.Position
    if p.X ~= x or p.Y ~= y then
        obj.Position = Vector2.new(x, y)
    end
end
local function SetSize2(obj, w, h)
    local s = obj.Size
    if s.X ~= w or s.Y ~= h then
        obj.Size = Vector2.new(w, h)
    end
end
print("Script loaded successfully")
