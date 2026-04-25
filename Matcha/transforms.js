// ============================================================
// Matcha Obfuscator — Obfuscation Transforms
// Implements 5 Luraph-style source-level transforms on a
// luaparse AST.
// ============================================================

(function () {
  'use strict';

  // ================================================================
  //  Utilities
  // ================================================================

  var _nameCounter = 0;

  function resetNameCounter() { _nameCounter = 0; }

  /** Generate an obfuscated identifier like _0x1a3f */
  function obfName() {
    var n = _nameCounter++;
    return '_0x' + n.toString(16);
  }

  /** Random integer in [min, max] inclusive */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Shuffle array in-place (Fisher-Yates) */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /** Deep-clone a plain object / AST node */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /** Walk every node in an AST, calling visitor(node, parent, key) */
  function walkAST(node, visitor, parent, key) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        walkAST(node[i], visitor, node, i);
      }
      return;
    }
    if (node.type) {
      visitor(node, parent, key);
    }
    var keys = Object.keys(node);
    for (var k = 0; k < keys.length; k++) {
      var prop = keys[k];
      if (prop === 'type' || prop === 'raw' || prop === 'value' ||
          prop === 'name' || prop === 'indexer' || prop === 'operator' ||
          prop === 'isLocal' || prop === 'inParens') continue;
      var child = node[prop];
      if (child && typeof child === 'object') {
        walkAST(child, visitor, node, prop);
      }
    }
  }

  // ================================================================
  //  AST Node Constructors
  // ================================================================

  function mkIdentifier(name) {
    return { type: 'Identifier', name: name };
  }

  function mkNumeric(value) {
    return { type: 'NumericLiteral', value: value, raw: String(value) };
  }

  function mkString(value) {
    return { type: 'StringLiteral', value: value, raw: '"' + value + '"' };
  }

  function mkBool(value) {
    return { type: 'BooleanLiteral', value: value, raw: value ? 'true' : 'false' };
  }

  function mkNil() {
    return { type: 'NilLiteral', value: null, raw: 'nil' };
  }

  function mkBinary(op, left, right) {
    return { type: 'BinaryExpression', operator: op, left: left, right: right };
  }

  function mkLogical(op, left, right) {
    return { type: 'LogicalExpression', operator: op, left: left, right: right };
  }

  function mkUnary(op, arg) {
    return { type: 'UnaryExpression', operator: op, argument: arg };
  }

  function mkCall(base, args) {
    return { type: 'CallExpression', base: base, arguments: args };
  }

  function mkCallStatement(expr) {
    return { type: 'CallStatement', expression: expr };
  }

  function mkLocal(names, inits) {
    return {
      type: 'LocalStatement',
      variables: names.map(function (n) { return typeof n === 'string' ? mkIdentifier(n) : n; }),
      init: inits || []
    };
  }

  function mkAssign(vars, inits) {
    return {
      type: 'AssignmentStatement',
      variables: vars.map(function (v) { return typeof v === 'string' ? mkIdentifier(v) : v; }),
      init: inits
    };
  }

  function mkIf(condition, body, elseBody) {
    var clauses = [{ type: 'IfClause', condition: condition, body: body }];
    if (elseBody) {
      clauses.push({ type: 'ElseClause', body: elseBody });
    }
    return { type: 'IfStatement', clauses: clauses };
  }

  function mkWhile(condition, body) {
    return { type: 'WhileStatement', condition: condition, body: body };
  }

  function mkDo(body) {
    return { type: 'DoStatement', body: body };
  }

  function mkReturn(args) {
    return { type: 'ReturnStatement', arguments: args || [] };
  }

  function mkMember(base, id, indexer) {
    return {
      type: 'MemberExpression',
      base: typeof base === 'string' ? mkIdentifier(base) : base,
      identifier: typeof id === 'string' ? mkIdentifier(id) : id,
      indexer: indexer || '.'
    };
  }

  function mkIndex(base, index) {
    return {
      type: 'IndexExpression',
      base: typeof base === 'string' ? mkIdentifier(base) : base,
      index: index
    };
  }

  function mkTable(fields) {
    return { type: 'TableConstructorExpression', fields: fields || [] };
  }

  function mkTableValue(val) {
    return { type: 'TableValue', value: val };
  }

  function mkTableKeyString(key, val) {
    return { type: 'TableKeyString', key: mkIdentifier(key), value: val };
  }

  function mkFunction(params, body, isLocal, identifier) {
    return {
      type: 'FunctionDeclaration',
      parameters: params.map(function (p) { return typeof p === 'string' ? mkIdentifier(p) : p; }),
      body: body,
      isLocal: !!isLocal,
      identifier: identifier ? (typeof identifier === 'string' ? mkIdentifier(identifier) : identifier) : null
    };
  }

  // ================================================================
  //  Transform 1: Variable Renaming
  // ================================================================

  function renameVariables(ast) {
    resetNameCounter();
    var mapping = {}; // originalName -> newName
    var scopeStack = [{}]; // stack of { name: true } sets

    function currentScope() { return scopeStack[scopeStack.length - 1]; }
    function pushScope() { scopeStack.push({}); }
    function popScope() { scopeStack.pop(); }

    function declareLocal(name) {
      var newName = obfName();
      mapping[name] = newName;
      currentScope()[name] = true;
    }

    function isLocal(name) {
      for (var i = scopeStack.length - 1; i >= 0; i--) {
        if (scopeStack[i][name]) return true;
      }
      return false;
    }

    // Pass 1: Collect all local declarations and build mapping
    function collectDeclarations(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(collectDeclarations);
        return;
      }

      switch (node.type) {
        case 'LocalStatement':
          if (node.variables) {
            node.variables.forEach(function (v) {
              if (v.type === 'Identifier' && !mapping[v.name]) {
                declareLocal(v.name);
              }
            });
          }
          break;

        case 'FunctionDeclaration':
          // Local function name
          if (node.isLocal && node.identifier && node.identifier.type === 'Identifier') {
            if (!mapping[node.identifier.name]) {
              declareLocal(node.identifier.name);
            }
          }
          // Parameters
          if (node.parameters) {
            node.parameters.forEach(function (p) {
              if (p.type === 'Identifier' && !mapping[p.name]) {
                declareLocal(p.name);
              }
            });
          }
          break;

        case 'ForNumericStatement':
          if (node.variable && node.variable.type === 'Identifier' && !mapping[node.variable.name]) {
            declareLocal(node.variable.name);
          }
          break;

        case 'ForGenericStatement':
          if (node.variables) {
            node.variables.forEach(function (v) {
              if (v.type === 'Identifier' && !mapping[v.name]) {
                declareLocal(v.name);
              }
            });
          }
          break;
      }

      // Recurse into child properties
      var keys = Object.keys(node);
      for (var i = 0; i < keys.length; i++) {
        var prop = keys[i];
        if (prop === 'type') continue;
        var child = node[prop];
        if (child && typeof child === 'object') {
          collectDeclarations(child);
        }
      }
    }

    collectDeclarations(ast);

    // Pass 2: Rename all matching Identifier nodes
    function renameNode(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(renameNode);
        return;
      }

      if (node.type === 'Identifier' && mapping[node.name]) {
        node.name = mapping[node.name];
      }

      // Don't rename table key strings (object-like keys stay readable)
      if (node.type === 'TableKeyString') {
        // Only recurse into value, skip key
        renameNode(node.value);
        return;
      }

      // Don't rename member expression identifiers (properties)
      if (node.type === 'MemberExpression') {
        renameNode(node.base);
        // node.identifier is a property access — don't rename
        return;
      }

      // Don't rename label/goto names
      if (node.type === 'LabelStatement' || node.type === 'GotoStatement') {
        return;
      }

      var keys = Object.keys(node);
      for (var i = 0; i < keys.length; i++) {
        var prop = keys[i];
        if (prop === 'type' || prop === 'name' || prop === 'raw' ||
            prop === 'value' || prop === 'indexer' || prop === 'operator' ||
            prop === 'isLocal' || prop === 'inParens') continue;
        var child = node[prop];
        if (child && typeof child === 'object') {
          renameNode(child);
        }
      }
    }

    renameNode(ast);
    return ast;
  }

  // ================================================================
  //  Transform 2: String Encryption (XOR)
  // ================================================================

  function encryptStrings(ast) {
    // Generate a random XOR key (8-16 bytes)
    var keyLen = randInt(8, 16);
    var key = [];
    for (var i = 0; i < keyLen; i++) {
      key.push(randInt(1, 255)); // avoid 0 to prevent null bytes
    }

    var decryptFuncName = '_' + obfName() + 'd';
    var encryptedStrings = [];
    var stringIndex = 0;

    // Walk AST and collect string literals to encrypt
    function processNode(node, parent, propName) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) {
          processNode(node[i], node, i);
        }
        return;
      }

      if (node.type === 'StringLiteral' && parent) {
        // Encrypt the string value (luaparse v0.3.x stores value in raw)
        var str = LuaCodeGen.extractStringValue(node);
        if (!str || str.length === 0) return; // skip empty strings
        var encrypted = '';
        for (var c = 0; c < str.length; c++) {
          var charCode = str.charCodeAt(c);
          var xored = charCode ^ key[c % key.length];
          encrypted += String.fromCharCode(xored);
        }

        // Store encrypted string and its index
        encryptedStrings.push(encrypted);
        var idx = stringIndex++;

        // Replace this node with a call: _decrypt(idx)
        // We'll replace properties on the parent
        var replacement = mkCall(mkIdentifier(decryptFuncName), [mkNumeric(idx + 1)]); // 1-indexed for Lua
        if (typeof propName === 'number') {
          parent[propName] = replacement;
        } else if (propName) {
          parent[propName] = replacement;
        }
        return;
      }

      // Special handling: don't descend into property names in certain node types
      var keys = Object.keys(node);
      for (var k = 0; k < keys.length; k++) {
        var prop = keys[k];
        if (prop === 'type' || prop === 'raw' || prop === 'name' ||
            prop === 'indexer' || prop === 'operator' || prop === 'isLocal' ||
            prop === 'inParens') continue;
        // Don't encrypt table key string names
        if (node.type === 'TableKeyString' && prop === 'key') continue;
        if (node.type === 'MemberExpression' && prop === 'identifier') continue;
        if (node.type === 'LabelStatement' && prop === 'label') continue;
        if (node.type === 'GotoStatement' && prop === 'label') continue;

        var child = node[prop];
        if (child && typeof child === 'object') {
          processNode(child, node, prop);
        }
      }
    }

    processNode(ast, null, null);

    // If no strings were found, return as-is
    if (encryptedStrings.length === 0) return ast;

    // Build the encrypted string table entries
    var tableFields = encryptedStrings.map(function (enc) {
      return mkTableValue(mkString(enc));
    });

    // Build the decryption function and inject at top of chunk
    // Lua code equivalent:
    // local _strs = {"\xAB\xCD...", "\xEF\x12...", ...}
    // local _key = {k1, k2, ...}
    // local function _decrypt(i)
    //   local s = _strs[i]
    //   local o = {}
    //   for j = 1, #s do
    //     local b = string.byte(s, j)
    //     local k = _key[((j - 1) % #_key) + 1]
    //     local x = 0
    //     local a, c = b, k
    //     local r, p = 0, 1
    //     for q = 0, 7 do
    //       local u, v = a % 2, c % 2
    //       if u ~= v then r = r + p end
    //       a = (a - u) / 2
    //       c = (c - v) / 2
    //       p = p * 2
    //     end
    //     o[j] = string.char(r)
    //   end
    //   return table.concat(o)
    // end

    var strsName = '_' + obfName() + 's';
    var keyName = '_' + obfName() + 'k';

    // Build key table
    var keyFields = key.map(function (k) { return mkTableValue(mkNumeric(k)); });

    // We'll build the decryption function as AST nodes
    var jVar = '_' + obfName() + 'j';
    var sVar = '_' + obfName() + 'e';
    var oVar = '_' + obfName() + 'o';
    var bVar = '_' + obfName() + 'b';
    var kVar = '_' + obfName() + 'c';
    var rVar = '_' + obfName() + 'r';
    var pVar = '_' + obfName() + 'p';
    var aVar = '_' + obfName() + 'a';
    var cVar = '_' + obfName() + 'f';
    var qVar = '_' + obfName() + 'q';
    var uVar = '_' + obfName() + 'u';
    var vVar = '_' + obfName() + 'v';
    var iParam = '_' + obfName() + 'i';

    // Instead of building a complex AST for the XOR function,
    // we'll generate the decryption code as a string and parse it.
    // This is simpler and less error-prone.
    var decryptCode =
      'local ' + strsName + '={' +
      encryptedStrings.map(function (enc) {
        var escaped = '';
        for (var c = 0; c < enc.length; c++) {
          var code = enc.charCodeAt(c);
          escaped += '\\' + code;
        }
        return '"' + escaped + '"';
      }).join(',') +
      '};' +
      'local ' + keyName + '={' + key.join(',') + '};' +
      'local function ' + decryptFuncName + '(' + iParam + ') ' +
        'local ' + sVar + '=' + strsName + '[' + iParam + '];' +
        'local ' + oVar + '={};' +
        'for ' + jVar + '=1,#' + sVar + ' do ' +
          'local ' + bVar + '=string.byte(' + sVar + ',' + jVar + ');' +
          'local ' + kVar + '=' + keyName + '[((' + jVar + '-1)%#' + keyName + ')+1];' +
          'local ' + aVar + ',' + cVar + '=' + bVar + ',' + kVar + ';' +
          'local ' + rVar + ',' + pVar + '=0,1;' +
          'for ' + qVar + '=0,7 do ' +
            'local ' + uVar + ',' + vVar + '=' + aVar + '%2,' + cVar + '%2;' +
            'if ' + uVar + '~=' + vVar + ' then ' + rVar + '=' + rVar + '+' + pVar + ' end;' +
            aVar + '=(' + aVar + '-' + uVar + ')/2;' +
            cVar + '=(' + cVar + '-' + vVar + ')/2;' +
            pVar + '=' + pVar + '*2 ' +
          'end;' +
          oVar + '[' + jVar + ']=string.char(' + rVar + ') ' +
        'end;' +
        'return table.concat(' + oVar + ') ' +
      'end';

    // Parse the decryption code and prepend to the chunk body
    try {
      var decryptAST = luaparse.parse(decryptCode);
      // Prepend the decryption infrastructure to the chunk
      ast.body = decryptAST.body.concat(ast.body);
    } catch (e) {
      console.error('Failed to parse decrypt function:', e);
      // Fallback: don't encrypt strings
    }

    return ast;
  }

  // ================================================================
  //  Transform 3: Control Flow Flattening
  // ================================================================

  function flattenControlFlow(ast) {
    var _flattenDepth = 0;
    var MAX_FLATTEN_DEPTH = 1;

    function flattenBody(body) {
      if (!body || body.length < 3) return body;
      if (_flattenDepth >= MAX_FLATTEN_DEPTH) return body;

      _flattenDepth++;

      var stateVar = obfName();
      var statements = body.slice(); // copy

      // --- Hoist local declarations ---
      // Local variables declared inside if/elseif cases would be scoped
      // only to that case block. We must declare them BEFORE the state
      // machine so they remain visible across all states.
      var hoistedLocals = []; // list of identifier name strings to hoist
      for (var h = 0; h < statements.length; h++) {
        var s = statements[h];
        if (s.type === 'LocalStatement') {
          // Collect variable names to hoist
          var varNames = [];
          for (var v = 0; v < s.variables.length; v++) {
            var varNode = s.variables[v];
            var name = varNode.name || varNode;
            hoistedLocals.push(name);
            varNames.push(varNode);
          }
          // Convert LocalStatement → AssignmentStatement (init stays)
          if (s.init && s.init.length > 0) {
            statements[h] = {
              type: 'AssignmentStatement',
              variables: varNames,
              init: s.init
            };
          } else {
            // local x  with no init — just hoist, replace with a no-op
            // Use a harmless assignment: x = nil
            statements[h] = {
              type: 'AssignmentStatement',
              variables: varNames,
              init: varNames.map(function() { return mkNil(); })
            };
          }
        } else if (s.type === 'FunctionDeclaration' && s.isLocal && s.identifier) {
          // local function foo() ... end → hoist foo, convert to assignment
          var fnName = s.identifier.name || s.identifier;
          hoistedLocals.push(fnName);
          // Convert to: foo = function(...) ... end (non-local)
          statements[h] = {
            type: 'AssignmentStatement',
            variables: [s.identifier],
            init: [{
              type: 'FunctionDeclaration',
              parameters: s.parameters,
              body: s.body,
              isLocal: false,
              identifier: null
            }]
          };
        }
      }

      // Assign each statement a random state number
      var stateNumbers = [];
      for (var i = 0; i < statements.length; i++) {
        stateNumbers.push(i * 7 + randInt(1, 5)); // spread out numbers
      }
      // Shuffle the ordering in the switch but keep the transition chain intact
      var exitState = (statements.length) * 7 + randInt(10, 20);

      // Build if-elseif chain for the state machine
      // Randomize the order of cases in the generated code
      var caseOrder = [];
      for (var i = 0; i < statements.length; i++) caseOrder.push(i);
      shuffle(caseOrder);

      var clauses = [];
      for (var ci = 0; ci < caseOrder.length; ci++) {
        var idx = caseOrder[ci];
        var stmt = statements[idx];
        var nextState = (idx < statements.length - 1) ? stateNumbers[idx + 1] : exitState;

        // Each case: the original statement + state transition
        var caseBody = [];

        // Handle return/break specially — they don't need state transition
        if (stmt.type === 'ReturnStatement') {
          caseBody.push(stmt);
        } else if (stmt.type === 'BreakStatement') {
          caseBody.push(stmt);
        } else {
          caseBody.push(stmt);
          caseBody.push(mkAssign([stateVar], [mkNumeric(nextState)]));
        }

        var clauseType = (ci === 0) ? 'IfClause' : 'ElseifClause';
        clauses.push({
          type: clauseType,
          condition: mkBinary('==', mkIdentifier(stateVar), mkNumeric(stateNumbers[idx])),
          body: caseBody
        });
      }

      // Add else clause to break out of the while loop
      clauses.push({
        type: 'ElseClause',
        body: [{ type: 'BreakStatement' }]
      });

      var ifNode = { type: 'IfStatement', clauses: clauses };
      var whileNode = mkWhile(mkBool(true), [ifNode]);

      // Build the output: hoisted locals, then state var, then the while loop
      var result = [];
      if (hoistedLocals.length > 0) {
        result.push(mkLocal(hoistedLocals, []));
      }
      result.push(mkLocal([stateVar], [mkNumeric(stateNumbers[0])]));
      result.push(whileNode);

      _flattenDepth--;
      return result;
    }

    // Apply flattening to function bodies and the chunk body
    function processNode(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(processNode);
        return;
      }

      // Flatten bodies
      if (node.type === 'FunctionDeclaration' && node.body && node.body.length >= 3) {
        // First process children
        processNode(node.body);
        // Then flatten this body
        node.body = flattenBody(node.body);
      }
      if (node.type === 'Chunk' && node.body && node.body.length >= 3) {
        processNode(node.body);
        node.body = flattenBody(node.body);
      }

      // Recurse into all child nodes
      var keys = Object.keys(node);
      for (var i = 0; i < keys.length; i++) {
        var prop = keys[i];
        if (prop === 'type' || prop === 'body') continue; // already handled body
        var child = node[prop];
        if (child && typeof child === 'object' && !Array.isArray(child) && child.type) {
          processNode(child);
        }
      }
    }

    processNode(ast);
    return ast;
  }

  // ================================================================
  //  Transform 4: Dead Code Insertion
  // ================================================================

  function insertDeadCode(ast) {
    function generateDeadStatement() {
      var kind = randInt(0, 4);
      switch (kind) {
        case 0:
          // local _deadN = math.random() * 0
          return mkLocal(
            [obfName()],
            [mkBinary('*', mkCall(mkMember('math', 'random'), []), mkNumeric(0))]
          );

        case 1:
          // if false then local _x = nil end
          return mkIf(mkBool(false), [
            mkLocal([obfName()], [mkNil()])
          ]);

        case 2:
          // do local _x = 0 end
          return mkDo([mkLocal([obfName()], [mkNumeric(randInt(0, 999))])]);

        case 3:
          // local _x = (42 + 0) * 1
          return mkLocal(
            [obfName()],
            [mkBinary('*', mkBinary('+', mkNumeric(randInt(1, 100)), mkNumeric(0)), mkNumeric(1))]
          );

        case 4:
          // if (1 > 2) then local _x = nil end
          return mkIf(
            mkBinary('>', mkNumeric(1), mkNumeric(2)),
            [mkLocal([obfName()], [mkNil()])]
          );

        default:
          return mkLocal([obfName()], [mkNumeric(0)]);
      }
    }

    function isBlockTerminator(stmt) {
      return stmt && (stmt.type === 'ReturnStatement' ||
                      stmt.type === 'BreakStatement' ||
                      stmt.type === 'GotoStatement');
    }

    function processBody(body) {
      if (!body || body.length === 0) return body;
      var newBody = [];
      for (var i = 0; i < body.length; i++) {
        var stmt = body[i];
        // Don't insert dead code after a block terminator (return/break/goto)
        // — in Lua, return must be the last statement in a block
        var prevIsTerminal = newBody.length > 0 &&
                             isBlockTerminator(newBody[newBody.length - 1]);
        if (!prevIsTerminal && Math.random() < 0.3) {
          newBody.push(generateDeadStatement());
        }
        newBody.push(stmt);
      }
      // Only append dead code at the end if the last statement isn't a terminator
      var lastStmt = newBody[newBody.length - 1];
      if (!isBlockTerminator(lastStmt) && Math.random() < 0.2) {
        newBody.push(generateDeadStatement());
      }
      return newBody;
    }

    function processNode(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(processNode);
        return;
      }

      // Insert dead code into statement bodies
      var bodyKeys = ['body'];
      for (var b = 0; b < bodyKeys.length; b++) {
        var key = bodyKeys[b];
        if (node[key] && Array.isArray(node[key])) {
          // First recurse into children
          processNode(node[key]);
          // Then insert dead code
          node[key] = processBody(node[key]);
        }
      }

      // Handle if-statement clauses
      if (node.type === 'IfStatement' && node.clauses) {
        for (var i = 0; i < node.clauses.length; i++) {
          var clause = node.clauses[i];
          if (clause.body && Array.isArray(clause.body)) {
            processNode(clause.body);
            clause.body = processBody(clause.body);
          }
        }
      }

      // Recurse
      var keys = Object.keys(node);
      for (var k = 0; k < keys.length; k++) {
        var prop = keys[k];
        if (prop === 'type' || prop === 'body' || prop === 'clauses') continue;
        var child = node[prop];
        if (child && typeof child === 'object' && !Array.isArray(child) && child.type) {
          processNode(child);
        }
      }
    }

    processNode(ast);
    return ast;
  }

  // ================================================================
  //  Transform 5: Constant Encoding
  // ================================================================

  function encodeConstants(ast) {
    // Track depth to avoid encoding constants we inject
    var _encoding = false;

    function encodeNumber(value) {
      // Only encode integers; skip floats, very large numbers, 0, negatives for simplicity
      if (!Number.isInteger(value) || value < 0 || value > 100000) {
        return null;
      }
      if (value === 0) {
        // 0 = (1 - 1)
        return mkBinary('-', mkNumeric(1), mkNumeric(1));
      }
      if (value === 1) {
        // 1 = (2 - 1)
        return mkBinary('-', mkNumeric(2), mkNumeric(1));
      }

      var strategy = randInt(0, 2);
      switch (strategy) {
        case 0: {
          // a + b = value
          var a = randInt(1, value);
          var b = value - a;
          return mkBinary('+', mkNumeric(a), mkNumeric(b));
        }
        case 1: {
          // a * b + c = value (find factors)
          var divisor = randInt(2, 10);
          var quotient = Math.floor(value / divisor);
          var remainder = value - (quotient * divisor);
          if (quotient > 0) {
            return mkBinary('+',
              mkBinary('*', mkNumeric(quotient), mkNumeric(divisor)),
              mkNumeric(remainder)
            );
          }
          // Fallback to addition
          var a2 = randInt(1, value);
          return mkBinary('+', mkNumeric(a2), mkNumeric(value - a2));
        }
        case 2: {
          // (a + b) - c = value
          var c = randInt(1, 50);
          var total = value + c;
          var a3 = randInt(1, total - 1);
          var b3 = total - a3;
          return mkBinary('-',
            mkBinary('+', mkNumeric(a3), mkNumeric(b3)),
            mkNumeric(c)
          );
        }
        default:
          return null;
      }
    }

    function processNode(node, parent, propName) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) {
          processNode(node[i], node, i);
        }
        return;
      }

      if (node.type === 'NumericLiteral' && parent && !_encoding) {
        var encoded = encodeNumber(node.value);
        if (encoded) {
          _encoding = true;
          if (typeof propName === 'number') {
            parent[propName] = encoded;
          } else if (propName) {
            parent[propName] = encoded;
          }
          _encoding = false;
          return;
        }
      }

      var keys = Object.keys(node);
      for (var k = 0; k < keys.length; k++) {
        var prop = keys[k];
        if (prop === 'type' || prop === 'raw' || prop === 'name' ||
            prop === 'indexer' || prop === 'operator' || prop === 'isLocal' ||
            prop === 'inParens') continue;
        var child = node[prop];
        if (child && typeof child === 'object') {
          processNode(child, node, prop);
        }
      }
    }

    processNode(ast, null, null);
    return ast;
  }

  // ================================================================
  //  Public API
  // ================================================================

  window.LuaTransforms = {
    renameVariables: renameVariables,
    encryptStrings: encryptStrings,
    flattenControlFlow: flattenControlFlow,
    insertDeadCode: insertDeadCode,
    encodeConstants: encodeConstants,

    // Expose utilities for testing
    _utils: {
      obfName: obfName,
      resetNameCounter: resetNameCounter,
      randInt: randInt,
      deepClone: deepClone,
      walkAST: walkAST,
      mkIdentifier: mkIdentifier,
      mkNumeric: mkNumeric,
      mkString: mkString,
      mkBool: mkBool,
      mkCall: mkCall,
      mkLocal: mkLocal,
      mkBinary: mkBinary,
      mkIf: mkIf
    }
  };

})();
