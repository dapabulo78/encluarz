-- This Script is Part of the Prometheus Obfuscator by Levno_710
--
-- util.lua
--
-- This Script provides some utility functions for Prometheus.

local function lookupify(tb)
	local tb2 = {};
	for _, v in ipairs(tb) do
		tb2[v] = true
	end
	return tb2
end

local function unlookupify(tb)
	local tb2 = {};
	for v, _ in pairs(tb) do
		table.insert(tb2, v);
	end
	return tb2;
end

-- FIX: Lua pattern "." does NOT match null bytes (\0).
-- Iterating byte-by-byte ensures ALL bytes (including \0) are escaped.
-- Without this, encrypted strings containing null bytes were silently
-- truncated in the Lua source, which broke GitHub URL decryption at runtime.
local function escape(str)
	local result = {}
	for i = 1, #str do
		local byte = string.byte(str, i)
		if byte >= 32 and byte <= 126 and byte ~= 92 and byte ~= 34 and byte ~= 39 then
			result[i] = string.char(byte)
		elseif byte == 92 then
			result[i] = "\\\\"
		elseif byte == 10 then
			result[i] = "\\n"
		elseif byte == 13 then
			result[i] = "\\r"
		elseif byte == 34 then
			result[i] = "\\\""
		elseif byte == 39 then
			result[i] = "\\'"
		else
			result[i] = string.format("\\%03d", byte)
		end
	end
	return table.concat(result)
end

local function chararray(str)
	local tb = {};
	for i = 1, str:len(), 1 do
		table.insert(tb, str:sub(i, i));
	end
	return tb;
end

local function keys(tb)
	local keyset = {}
	local n=0
	for k, _ in pairs(tb) do
		n = n + 1
		keyset[n] = k
	end
	return keyset
end

local utf8char;
do
	local string_char = string.char
	function utf8char(cp)
	  if cp < 128 then
		return string_char(cp)
	  end
	  local suffix = cp % 64
	  local c4 = 128 + suffix
	  cp = (cp - suffix) / 64
	  if cp < 32 then
		return string_char(192 + cp, c4)
	  end
	  suffix = cp % 64
	  local c3 = 128 + suffix
	  cp = (cp - suffix) / 64
	  if cp < 16 then
		return string_char(224 + cp, c3, c4)
	  end
	  suffix = cp % 64
	  cp = (cp - suffix) / 64
	  return string_char(240 + cp, 128 + suffix, c3, c4)
	end
  end

local function shuffle(tb)
	for i = #tb, 2, -1 do
		local j = math.random(i)
		tb[i], tb[j] = tb[j], tb[i]
	end
	return tb
end

local function readonly(obj)
	local r = newproxy(true);
	getmetatable(r).__index = obj;
	return r;
end

return {
	lookupify = lookupify,
	unlookupify = unlookupify,
	escape = escape,
	chararray = chararray,
	keys = keys,
	shuffle = shuffle,
	utf8char = utf8char,
	readonly = readonly
}
