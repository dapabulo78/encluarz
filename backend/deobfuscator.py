import re
import sys
import subprocess
import time
import os
import glob
import math
import tempfile


COMPOUND_ASSIGNMENT_OPERATORS = ("+=", "-=", "*=", "/=", "%=", "..=")


def _configure_text_streams():
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is None or not hasattr(stream, "reconfigure"):
            continue
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


def _find_compound_lhs_start(content, operator_index):
    idx = operator_index - 1
    while idx >= 0 and content[idx].isspace():
        idx -= 1
    while idx >= 0 and content[idx] == "]":
        bracket_depth = 1
        idx -= 1
        while idx >= 0 and bracket_depth > 0:
            if content[idx] == "]": bracket_depth += 1
            elif content[idx] == "[": bracket_depth -= 1
            idx -= 1
    while idx >= 0 and (content[idx].isalnum() or content[idx] == "_"):
        idx -= 1
    while idx >= 0 and content[idx] == ".":
        idx -= 1
        while idx >= 0 and content[idx] == "]":
            bracket_depth = 1
            idx -= 1
            while idx >= 0 and bracket_depth > 0:
                if content[idx] == "]": bracket_depth += 1
                elif content[idx] == "[": bracket_depth -= 1
                idx -= 1
        while idx >= 0 and (content[idx].isalnum() or content[idx] == "_"):
            idx -= 1
    return idx + 1


def _find_compound_rhs_end(content, rhs_start):
    idx = rhs_start
    length = len(content)
    bracket_depth = 0
    paren_depth = 0
    brace_depth = 0
    quote = None
    while idx < length and content[idx].isspace():
        idx += 1
    while idx < length:
        char = content[idx]
        if quote:
            if char == "\\": idx += 2; continue
            if char == quote: quote = None
            idx += 1; continue
        if char in ("'", '"'):
            quote = char; idx += 1; continue
        if char == "[": bracket_depth += 1
        elif char == "]": bracket_depth = max(0, bracket_depth - 1)
        elif char == "(": paren_depth += 1
        elif char == ")":
            if paren_depth == 0 and bracket_depth == 0 and brace_depth == 0: break
            paren_depth = max(0, paren_depth - 1)
        elif char == "{": brace_depth += 1
        elif char == "}":
            if brace_depth == 0 and bracket_depth == 0 and paren_depth == 0: break
            brace_depth = max(0, brace_depth - 1)
        elif bracket_depth == 0 and paren_depth == 0 and brace_depth == 0:
            if char in ";,\n\r": break
            if char.isspace(): break
        idx += 1
    return idx


def normalize_luau_syntax(content):
    replacements = []
    idx = 0
    while idx < len(content):
        matched_operator = None
        for operator in COMPOUND_ASSIGNMENT_OPERATORS:
            if content.startswith(operator, idx):
                matched_operator = operator
                break
        if not matched_operator:
            idx += 1
            continue
        lhs_start = _find_compound_lhs_start(content, idx)
        rhs_start = idx + len(matched_operator)
        rhs_end = _find_compound_rhs_end(content, rhs_start)
        lhs = content[lhs_start:idx].strip()
        rhs = content[rhs_start:rhs_end].strip()
        if lhs and rhs:
            replacements.append((lhs_start, rhs_end, f"{lhs} = {lhs} {matched_operator[:-1]} {rhs}"))
        idx = rhs_end
    if not replacements:
        return content
    rewritten = content
    for start, end, replacement in reversed(replacements):
        rewritten = rewritten[:start] + replacement + rewritten[end:]
    return rewritten


_configure_text_streams()


def deobfuscate_file(filepath):
    print(f"Processing {filepath}...", flush=True)

    if ".deobf." in filepath or ".report." in filepath:
        return None

    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}", flush=True)
        return None

    content = normalize_luau_syntax(content)

    match = re.search(r'local ([a-zA-Z0-9_]+)=\{"', content)
    if not match:
        print(f"Could not identify string table variable in {filepath}.", flush=True)
        return None
    var_name = match.group(1)

    mock_env_code = r"""
local real_type = type
local real_tonumber = tonumber
local real_unpack = unpack
local real_concat = table.concat
local real_tostring = tostring
local real_print = print
local _WAIT_COUNT = 0

local function type(v)
    local mt = getmetatable(v)
    if mt and mt.__is_mock_dummy then return "userdata" end
    return real_type(v)
end
local function typeof(v)
    local mt = getmetatable(v)
    if mt and mt.__is_mock_dummy then return "Instance" end
    return type(v)
end
local function tonumber(v, base)
    if type(v) == "userdata" then return 1 end
    return real_tonumber(v, base)
end
local function unpack(t, i, j)
    if real_type(t) == "table" then
        local looks_like_chunk = true
        for k, v in pairs(t) do
            if real_type(k) ~= "number" then looks_like_chunk = false break end
        end
        if looks_like_chunk and #t > 0 then
            local success, res = pcall(real_concat, t, ",")
            if success and res:match("http") then
                print("URL DETECTED IN UNPACK --> " .. res)
            end
        end
    end
    return real_unpack(t, i, j)
end
local function table_concat(t, sep, i, j)
    local res = real_concat(t, sep, i, j)
    if real_type(res) == "string" and res:match("http") then
        print("URL DETECTED IN CONCAT --> " .. res)
    end
    return res
end
local function escape_lua_string(s)
    local parts = {'"'}
    for i = 1, #s do
        local byte = string.byte(s, i)
        if byte == 92 then table.insert(parts, "\\\\")
        elseif byte == 34 then table.insert(parts, "\\\"")
        elseif byte == 10 then table.insert(parts, "\\n")
        elseif byte == 13 then table.insert(parts, "\\r")
        elseif byte == 9 then table.insert(parts, "\\t")
        elseif byte >= 32 and byte <= 126 then table.insert(parts, string.char(byte))
        else table.insert(parts, string.format("\\%03d", byte))
        end
    end
    table.insert(parts, '"')
    return table.concat(parts)
end
local function recursive_tostring(v, depth)
    if depth == nil then depth = 0 end
    if depth > 2 then return tostring(v) end
    if real_type(v) == "string" then return escape_lua_string(v)
    elseif real_type(v) == "number" then
        if v == math.floor(v) and v >= -2147483648 and v <= 2147483647 then
            return tostring(math.floor(v))
        end
        return tostring(v)
    elseif real_type(v) == "boolean" then return tostring(v)
    elseif v == nil then return "nil"
    elseif real_type(v) == "table" then
        if getmetatable(v) and getmetatable(v).__is_mock_dummy then return tostring(v) end
        local parts = {}
        local keys = {}
        for k in pairs(v) do table.insert(keys, k) end
        table.sort(keys, function(a,b) return tostring(a) < tostring(b) end)
        for _, k in ipairs(keys) do
            local val = v[k]
            local k_str = tostring(k)
            if real_type(k) == "string" then k_str = '["' .. k .. '"]' end
            table.insert(parts, k_str .. " = " .. recursive_tostring(val, depth + 1))
        end
        return "{" .. real_concat(parts, ", ") .. "}"
    elseif real_type(v) == "function" then return tostring(v)
    else return tostring(v)
    end
end
local function create_dummy(name)
    local d = {}
    local mt = {
        __is_mock_dummy = true,
        __index = function(_, k)
            print("ACCESSED --> " .. name .. "." .. k)
            if k == "HttpGet" or k == "HttpGetAsync" then
                return function(_, url, ...)
                    print("URL DETECTED --> " .. tostring(url))
                    return create_dummy("HttpGetResult")
                end
            end
            return create_dummy(name .. "." .. k)
        end,
        __newindex = function(_, k, v)
            print("PROP_SET --> " .. name .. "." .. k .. " = " .. recursive_tostring(v, 0))
        end,
        __call = function(_, ...)
            local args = {...}
            local arg_str = ""
            for i, v in ipairs(args) do
                if i > 1 then arg_str = arg_str .. ", " end
                arg_str = arg_str .. recursive_tostring(v)
            end
            local var_name = name:gsub("%.", "_") .. "_" .. math.random(100, 999)
            print("CALL_RESULT --> local " .. var_name .. " = " .. name .. "(" .. arg_str .. ")")
            if name == "task.wait" or name == "wait" then
                _WAIT_COUNT = _WAIT_COUNT + 1
                if _WAIT_COUNT > 10 then error("Too many waits!") end
            end
            for i, v in ipairs(args) do
                if real_type(v) == "function" then
                    print("--- ENTERING CLOSURE FOR " .. name .. " ---")
                    local ok, err = pcall(v, create_dummy("arg1"), create_dummy("arg2"))
                    if not ok then print("-- CLOSURE ERROR: " .. tostring(err)) end
                    print("--- EXITING CLOSURE FOR " .. name .. " ---")
                end
            end
            return create_dummy(var_name)
        end,
        __tostring = function() return name end,
        __concat = function(a, b) return tostring(a) .. tostring(b) end,
        __add = function(a, b) return create_dummy("("..tostring(a).."+"..tostring(b)..")") end,
        __sub = function(a, b) return create_dummy("("..tostring(a).."-"..tostring(b)..")") end,
        __mul = function(a, b) return create_dummy("("..tostring(a).."*"..tostring(b)..")") end,
        __div = function(a, b) return create_dummy("("..tostring(a).."/"..tostring(b)..")") end,
        __mod = function(a, b) return create_dummy("("..tostring(a).."%"..tostring(b)..")") end,
        __pow = function(a, b) return create_dummy("("..tostring(a).."^"..tostring(b)..")") end,
        __unm = function(a) return create_dummy("-"..tostring(a)) end,
        __lt = function(a, b) return false end,
        __le = function(a, b) return false end,
        __eq = function(a, b) return false end,
        __len = function(a) return 2 end,
    }
    setmetatable(d, mt)
    return d
end
local function mock_pairs(t)
    local mt = getmetatable(t)
    if mt and mt.__is_mock_dummy then
        local i = 0
        return function(...)
            i = i + 1
            if i <= 1 then return i, create_dummy(tostring(t).."_v"..i) end
            return nil
        end
    end
    return pairs(t)
end
local function mock_ipairs(t)
    local mt = getmetatable(t)
    if mt and mt.__is_mock_dummy then
        local i = 0
        return function(...)
            i = i + 1
            if i <= 1 then return i, create_dummy(tostring(t).."_v"..i) end
            return nil
        end
    end
    return ipairs(t)
end
local MockEnv = {}
local safe_globals = {
    ["string"]=string,
    ["table"]={["insert"]=table.insert,["remove"]=table.remove,["sort"]=table.sort,["concat"]=table_concat,["maxn"]=table.maxn},
    ["math"]=math,["pairs"]=mock_pairs,["ipairs"]=mock_ipairs,["select"]=select,
    ["unpack"]=unpack,["tonumber"]=tonumber,["tostring"]=tostring,["type"]=type,["typeof"]=typeof,
    ["pcall"]=pcall,["xpcall"]=xpcall,["getfenv"]=getfenv,["setmetatable"]=setmetatable,
    ["getmetatable"]=getmetatable,["error"]=error,["assert"]=assert,["next"]=next,
    ["print"]=function(...)
        local args={...}; local parts={}
        for i,v in ipairs(args) do table.insert(parts, tostring(v)) end
        print("TRACE_PRINT --> " .. table.concat(parts, "\t"))
    end,
    ["_VERSION"]=_VERSION,["rawset"]=rawset,["rawget"]=rawget,
    ["os"]=os,["io"]=io,["package"]=package,["debug"]=debug,
    ["dofile"]=dofile,["loadfile"]=loadfile,
    ["loadstring"]=function(s)
        print("LOADSTRING DETECTED: size=" .. tostring(#s))
        print("LOADSTRING CONTENT START"); print(s); print("LOADSTRING CONTENT END")
        return function() print("DUMMY FUNC CALLED") end
    end
}
setmetatable(MockEnv, {
    __index = function(t, k)
        if safe_globals[k] then return safe_globals[k] end
        if k == "game" then print("ACCESSED --> game"); return create_dummy("game") end
        if k == "getgenv" or k == "getrenv" or k == "getreg" then return function() return MockEnv end end
        local exploit_funcs = {
            "getgc","getinstances","getnilinstances","getloadedmodules","getconnections",
            "firesignal","fireclickdetector","firetouchinterest","isnetworkowner",
            "gethiddenproperty","sethiddenproperty","setsimulationradius",
            "rconsoleprint","rconsolewarn","rconsoleerr","rconsoleinfo","rconsolename","rconsoleclear",
            "consoleprint","consolewarn","consoleerr","consoleinfo","consolename","consoleclear",
            "warn","print","error","debug","clonefunction","hookfunction","newcclosure",
            "replaceclosure","restoreclosure","islclosure","iscclosure","checkcaller",
            "getnamecallmethod","setnamecallmethod","getrawmetatable","setrawmetatable",
            "setreadonly","isreadonly","iswindowactive","keypress","keyrelease",
            "mouse1click","mouse1press","mouse1release","mousescroll","mousemoverel","mousemoveabs",
            "hookmetamethod","getcallingscript","makefolder","writefile","readfile","appendfile",
            "loadfile","listfiles","isfile","isfolder","delfile","delfolder","dofile","bit","bit32",
            "Vector2","Vector3","CFrame","UDim2","Color3","Instance","Ray","Enum","BrickColor",
            "NumberRange","NumberSequence","ColorSequence","task","coroutine",
            "Delay","delay","Spawn","spawn","Wait","wait","workspace","Workspace","tick","time","elapsedTime","utf8"
        }
        for _, name in ipairs(exploit_funcs) do
            if k == name then print("ACCESSED --> " .. k); return create_dummy(k) end
        end
        print("ACCESSED (NIL) --> " .. k)
        return nil
    end,
    __newindex = function(t, k, v)
        local val_str = (real_type(v) == "string") and ('"' .. v .. '"') or tostring(v)
        print("SET GLOBAL --> " .. tostring(k) .. " = " .. val_str)
        rawset(t, k, v)
    end
})
safe_globals["_G"] = MockEnv
safe_globals["shared"] = MockEnv
"""

    idx_args = content.rfind("(getfenv")
    if idx_args == -1:
        idx_args = content.rfind("( getfenv")
    if idx_args == -1:
        idx_args = len(content)

    idx_ret = content.rfind("return(function", 0, idx_args)
    if idx_ret == -1:
        print(f"Could not find return(function injection point in {filepath}.", flush=True)
        return None

    dumper_code = f"""
    print("--- CONSTANTS START ---")
    if {var_name} then
        local sorted_keys = {{}}
        for k in pairs({var_name}) do table.insert(sorted_keys, k) end
        table.sort(sorted_keys)
        local out = "local Constants = {{"
        for i, k in ipairs(sorted_keys) do
            local v = {var_name}[k]
            local v_str = escape_lua_string(v)
            out = out .. " [" .. k .. "] = " .. v_str .. ","
        end
        out = out .. " }}"
        print(out)
    end
    print("--- CONSTANTS END ---")
    """

    new_content = mock_env_code + content[:idx_ret] + dumper_code + content[idx_ret:]

    if "getfenv and getfenv()or _ENV" in new_content:
        new_content = new_content.replace("getfenv and getfenv()or _ENV", "MockEnv")
    else:
        new_content = re.sub(r'getfenv\s+and\s+getfenv\(\)or\s+_ENV', 'MockEnv', new_content)

    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", suffix=".lua", delete=False
    ) as temp_handle:
        temp_file = temp_handle.name
        temp_handle.write(new_content)

    print(f"Executing lua trace for {filepath}...", flush=True)

    # ── Pakai lua5.1 system (Linux/Railway), bukan lua_bin/lua5.1.exe
    process = subprocess.Popen(
        ["lua5.1", temp_file, "1"],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )

    stdout_lines = []
    RELEVANT_PREFIXES = (
        "ACCESSED", "CALL_RESULT", "local Constants =",
        "URL DETECTED", "SET GLOBAL", "UNPACK CALLED",
        "CAPTURED CHUNK", "CLOSURE", "TRACE_PRINT",
        "PROP_SET", "LOADSTRING"
    )

    start_time = time.time()
    try:
        while True:
            if process.poll() is not None:
                break
            line = process.stdout.readline()
            if line:
                decoded_line = line.decode('utf-8', errors='replace').strip()
                stdout_lines.append(decoded_line)
            if time.time() - start_time > 20:
                print("Timeout reached.", flush=True)
                process.terminate()
                break
    except Exception as e:
        print(f"Error: {e}", flush=True)
        process.kill()

    out, err = process.communicate()
    if out:
        for line in out.decode('utf-8', errors='replace').splitlines():
            stdout_lines.append(line.strip())

    constants_str = ""
    trace_lines = []
    in_constants = False

    for line in stdout_lines:
        if line == "--- CONSTANTS START ---":
            in_constants = True; continue
        if line == "--- CONSTANTS END ---":
            in_constants = False; continue
        if in_constants:
            constants_str += line + "\n"
        elif any(prefix in line for prefix in RELEVANT_PREFIXES):
            trace_lines.append(line)

    # Tulis report ke file sementara (sejajar dengan input file)
    report_file = temp_file + ".report.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("--- DEOBFUSCATION REPORT ---\n")
        f.write(f"File: {filepath}\n\n")
        f.write("--- TRACE ---\n")
        for line in trace_lines:
            f.write(line + "\n")
        f.write("\n--- CONSTANTS ---\n")
        f.write(constants_str)

    # Jalankan trace_to_lua untuk convert ke Lua yang readable
    result_output = None
    try:
        # Import trace_to_lua dari folder yang sama dengan deobfuscator.py
        script_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, script_dir)
        import trace_to_lua
        import importlib
        importlib.reload(trace_to_lua)
        trace_to_lua.parse_trace(report_file)

        # Baca hasil .deobf.lua — letaknya sejajar dengan report_file
        deobf_file = report_file.replace(".report.txt", ".deobf.lua")
        if os.path.exists(deobf_file):
            with open(deobf_file, 'r', encoding='utf-8', errors='replace') as f:
                result_output = f.read()
            os.remove(deobf_file)
    except Exception as e:
        print(f"trace_to_lua error: {e}", flush=True)

    # Fallback: kalau .deobf.lua tidak ada, kembalikan constants + trace mentah
    if not result_output:
        result_output = "-- Deobfuscated via Trace Emulation\n\n"
        if constants_str.strip():
            result_output += "-- === String Constants ===\n"
            result_output += constants_str.strip() + "\n\n"
        if trace_lines:
            result_output += "-- === Execution Trace ===\n"
            result_output += "\n".join(trace_lines)

    # Cleanup semua file temp
    for f in [temp_file, report_file]:
        try:
            if os.path.exists(f):
                os.remove(f)
        except Exception:
            pass

    return result_output


def main():
    target = "obfuscated_scripts"
    if len(sys.argv) > 1:
        target = sys.argv[1]

    if os.path.isfile(target):
        result = deobfuscate_file(target)
        if result:
            print("\n=== RESULT ===")
            print(result)
    elif os.path.isdir(target):
        files = glob.glob(os.path.join(target, "*.lua"))
        for file in sorted(files):
            if "temp_deob" in file or ".report.txt" in file or ".deobf." in file:
                continue
            deobfuscate_file(file)
            print("-" * 40)
    else:
        print("Invalid path")


if __name__ == "__main__":
    main()
