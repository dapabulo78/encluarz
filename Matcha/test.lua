-- Test Lua script for Matcha Obfuscator
local function greet(name)
    local message = "Hello, " .. name .. "!"
    print(message)
    return message
end

local result = greet("World")

for i = 1, 10 do
    local value = i * 2
    print("Value: " .. tostring(value))
end

local data = {
    name = "Matcha",
    version = 1,
    active = true
}

if data.active then
    print("Active: " .. data.name)
else
    print("Inactive")
end

local function calculate(a, b, op)
    if op == "add" then
        return a + b
    elseif op == "sub" then
        return a - b
    elseif op == "mul" then
        return a * b
    else
        return 0
    end
end

local sum = calculate(10, 20, "add")
print("Sum: " .. tostring(sum))
