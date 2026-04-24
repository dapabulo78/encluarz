// ============================================================
// Matcha Obfuscator — Main Orchestrator
// Chains transforms together and manages the obfuscation
// pipeline. Includes Luau compatibility preprocessing.
// ============================================================

(function () {
  'use strict';

  // ================================================================
  //  Luau Preprocessor
  //  Converts Luau-specific syntax to standard Lua before parsing.
  // ================================================================

  function isAlphaNum_(ch) {
    if (!ch) return false;
    var c = ch.charCodeAt(0);
    return (c >= 48 && c <= 57) ||   // 0-9
           (c >= 65 && c <= 90) ||   // A-Z
           (c >= 97 && c <= 122) ||  // a-z
           c === 95;                 // _
  }

  /**
   * Preprocess Luau source into standard Lua compatible code.
   * - Replaces `continue` with `__MATCHA_CONTINUE__()` (resolved in AST fixup)
   * - Expands compound assignments (+=, -=, *=, /=, %=, ^=, ..=)
   * - Strips Luau `type` declarations
   * Respects string literals and comments (won't modify inside them).
   */
  function preprocessLuau(code) {
    var result = '';
    var i = 0;
    var len = code.length;

    while (i < len) {
      // === Skip double-quoted strings ===
      if (code[i] === '"') {
        var start = i;
        i++;
        while (i < len && code[i] !== '"') {
          if (code[i] === '\\') i++;
          i++;
        }
        if (i < len) i++;
        result += code.substring(start, i);
        continue;
      }

      // === Skip single-quoted strings ===
      if (code[i] === "'") {
        var start = i;
        i++;
        while (i < len && code[i] !== "'") {
          if (code[i] === '\\') i++;
          i++;
        }
        if (i < len) i++;
        result += code.substring(start, i);
        continue;
      }

      // === Skip long strings [[ ]] or [=[ ]=] ===
      if (code[i] === '[') {
        var eqCnt = 0;
        var j = i + 1;
        while (j < len && code[j] === '=') { eqCnt++; j++; }
        if (j < len && code[j] === '[') {
          var closer = ']' + '='.repeat(eqCnt) + ']';
          var ci = code.indexOf(closer, j + 1);
          if (ci >= 0) {
            result += code.substring(i, ci + closer.length);
            i = ci + closer.length;
            continue;
          }
        }
      }

      // === Skip comments ===
      if (code[i] === '-' && i + 1 < len && code[i + 1] === '-') {
        // Check for long comment --[[ or --[=[
        if (i + 2 < len && code[i + 2] === '[') {
          var eqCnt = 0;
          var j = i + 3;
          while (j < len && code[j] === '=') { eqCnt++; j++; }
          if (j < len && code[j] === '[') {
            var closer = ']' + '='.repeat(eqCnt) + ']';
            var ci = code.indexOf(closer, j + 1);
            if (ci >= 0) {
              result += code.substring(i, ci + closer.length);
              i = ci + closer.length;
              continue;
            }
          }
        }
        // Single-line comment: pass through to end of line
        var eol = code.indexOf('\n', i);
        if (eol < 0) eol = len;
        result += code.substring(i, eol);
        i = eol;
        continue;
      }

      // === Replace Luau 'continue' keyword with a marker call ===
      if (i + 8 <= len && code.substring(i, i + 8) === 'continue') {
        var before = i > 0 ? code[i - 1] : ' ';
        var after = i + 8 < len ? code[i + 8] : ' ';
        if (!isAlphaNum_(before) && !isAlphaNum_(after)) {
          result += '__MATCHA_CONTINUE__()';
          i += 8;
          continue;
        }
      }

      // === Expand compound assignments ===
      // +=, -=, *=, /=, %=, ^=
      if ('+-*/%^'.indexOf(code[i]) >= 0 && i + 1 < len && code[i + 1] === '=') {
        var op = code[i];
        var lhs = extractLHSFromResult(result);
        if (lhs !== null) {
          result = result.substring(0, result.length - lhs.length);
          result += lhs + ' = ' + lhs + ' ' + op + ' ';
          i += 2;
          continue;
        }
      }
      // ..= compound concat
      if (code[i] === '.' && i + 2 < len && code[i + 1] === '.' && code[i + 2] === '=') {
        var lhs = extractLHSFromResult(result);
        if (lhs !== null) {
          result = result.substring(0, result.length - lhs.length);
          result += lhs + ' = ' + lhs + ' .. ';
          i += 3;
          continue;
        }
      }

      // === Strip Luau 'type' declarations ===
      if (i + 4 <= len && code.substring(i, i + 4) === 'type') {
        var before = i > 0 ? code[i - 1] : '\n';
        var after = i + 4 < len ? code[i + 4] : ' ';
        if (!isAlphaNum_(before) && !isAlphaNum_(after)) {
          var j = i + 4;
          while (j < len && (code[j] === ' ' || code[j] === '\t')) j++;
          if (j < len && isAlphaNum_(code[j])) {
            var eol = code.indexOf('\n', i);
            if (eol < 0) eol = len;
            result += '--[[type stripped]]';
            i = eol;
            continue;
          }
        }
      }

      // Default: copy character
      result += code[i];
      i++;
    }

    return result;
  }

  /**
   * Extract the left-hand side expression from the end of the result string.
   * Used for compound assignment expansion.
   */
  function extractLHSFromResult(result) {
    var end = result.length;
    var j = end - 1;
    while (j >= 0 && (result[j] === ' ' || result[j] === '\t')) j--;
    if (j < 0) return null;

    var exprEnd = j + 1;

    // Handle ] for index expressions
    if (result[j] === ']') {
      var depth = 1;
      j--;
      while (j >= 0 && depth > 0) {
        if (result[j] === ']') depth++;
        if (result[j] === '[') depth--;
        j--;
      }
    }

    // Walk backward through identifier chars and dots/colons
    while (j >= 0 && (isAlphaNum_(result[j]) || result[j] === '.' || result[j] === ':')) {
      j--;
    }

    var exprStart = j + 1;
    if (exprStart >= exprEnd) return null;

    var lhs = result.substring(exprStart, exprEnd).trim();
    if (lhs.length === 0) return null;
    if (!isAlphaNum_(lhs[0]) || (lhs[0] >= '0' && lhs[0] <= '9')) return null;

    return lhs;
  }

  // ================================================================
  //  AST Fixup for continue
  //  After parsing, walk the AST to replace __MATCHA_CONTINUE__()
  //  calls with goto/label pairs in the enclosing loop body.
  // ================================================================

  function isContinueMarker(node) {
    return node &&
           node.type === 'CallStatement' &&
           node.expression &&
           node.expression.type === 'CallExpression' &&
           node.expression.base &&
           node.expression.base.type === 'Identifier' &&
           node.expression.base.name === '__MATCHA_CONTINUE__';
  }

  function fixupContinueGotos(ast) {
    var counter = 0;

    function processNode(node, loopStack) {
      if (!node || typeof node !== 'object') return;

      var isLoop = node.type === 'WhileStatement' ||
                   node.type === 'ForNumericStatement' ||
                   node.type === 'ForGenericStatement' ||
                   node.type === 'RepeatStatement';

      var loopInfo = null;
      if (isLoop) {
        loopInfo = { labelName: null };
        loopStack.push(loopInfo);
      }

      // Process all child properties
      var keys = Object.keys(node);
      for (var k = 0; k < keys.length; k++) {
        var prop = keys[k];
        if (prop === 'type' || prop === 'raw' || prop === 'value' ||
            prop === 'name' || prop === 'indexer' || prop === 'operator' ||
            prop === 'isLocal' || prop === 'inParens') continue;

        var child = node[prop];

        if (Array.isArray(child)) {
          for (var ci = 0; ci < child.length; ci++) {
            if (isContinueMarker(child[ci])) {
              // Replace with goto statement
              if (loopStack.length > 0) {
                var currentLoop = loopStack[loopStack.length - 1];
                if (!currentLoop.labelName) {
                  counter++;
                  currentLoop.labelName = '__mcont_' + counter + '__';
                }
                child[ci] = {
                  type: 'GotoStatement',
                  label: { type: 'Identifier', name: currentLoop.labelName }
                };
              }
            } else if (child[ci] && typeof child[ci] === 'object') {
              processNode(child[ci], loopStack);
            }
          }
        } else if (child && typeof child === 'object' && child.type) {
          processNode(child, loopStack);
        }
      }

      // After processing children, append label at end of loop body
      if (isLoop && loopInfo.labelName) {
        if (Array.isArray(node.body)) {
          node.body.push({
            type: 'LabelStatement',
            label: { type: 'Identifier', name: loopInfo.labelName }
          });
        }
      }

      if (isLoop) {
        loopStack.pop();
      }
    }

    processNode(ast, []);
  }

  // ================================================================
  //  Main obfuscation entry point
  // ================================================================

  /**
   * @param {string} code  - Raw Lua/Luau source code
   * @param {Object} options - Which transforms to enable
   * @param {boolean} options.renameVars     - Variable renaming
   * @param {boolean} options.encryptStrings - XOR string encryption
   * @param {boolean} options.flattenFlow    - Control flow flattening
   * @param {boolean} options.deadCode       - Dead code insertion
   * @param {boolean} options.encodeConsts   - Numeric constant encoding
   * @param {function} [onProgress]          - Progress callback (stage, percent)
   * @returns {{ code: string, stats: Object }}
   */
  function obfuscate(code, options, onProgress) {
    options = options || {};
    onProgress = onProgress || function () {};

    var originalSize = code.length;
    var transformsApplied = [];

    // ---- Stage 0: Luau Preprocessing ----
    onProgress('Preprocessing Luau syntax...', 5);
    code = preprocessLuau(code);

    // ---- Stage 1: Parse ----
    onProgress('Parsing Lua source...', 10);

    var ast;
    try {
      ast = luaparse.parse(code, {
        luaVersion: '5.2',   // 5.2 for goto/label support
        comments: false,     // strip comments
        scope: true,         // track scopes for variable renaming
        wait: false
      });
    } catch (err) {
      var msg = 'Parse error';
      if (err.line !== undefined) {
        msg += ' at line ' + err.line;
        if (err.column !== undefined) {
          msg += ', column ' + err.column;
        }
      }
      msg += ': ' + (err.message || String(err));
      throw new Error(msg);
    }

    // ---- Stage 1b: Fixup continue markers → goto/label ----
    fixupContinueGotos(ast);

    // ---- Stage 2: Apply transforms ----

    // 2a. Variable Renaming (first — establishes naming scheme)
    if (options.renameVars !== false) {
      onProgress('Renaming variables...', 25);
      try {
        ast = LuaTransforms.renameVariables(ast);
        transformsApplied.push('Variable Renaming');
      } catch (e) {
        console.error('Variable renaming failed:', e);
      }
    }

    // 2b. Constant Encoding
    if (options.encodeConsts !== false) {
      onProgress('Encoding constants...', 40);
      try {
        ast = LuaTransforms.encodeConstants(ast);
        transformsApplied.push('Constant Encoding');
      } catch (e) {
        console.error('Constant encoding failed:', e);
      }
    }

    // 2c. Dead Code Insertion
    if (options.deadCode !== false) {
      onProgress('Inserting dead code...', 55);
      try {
        ast = LuaTransforms.insertDeadCode(ast);
        transformsApplied.push('Dead Code Insertion');
      } catch (e) {
        console.error('Dead code insertion failed:', e);
      }
    }

    // 2d. Control Flow Flattening
    if (options.flattenFlow !== false) {
      onProgress('Flattening control flow...', 70);
      try {
        ast = LuaTransforms.flattenControlFlow(ast);
        transformsApplied.push('Control Flow Flattening');
      } catch (e) {
        console.error('Control flow flattening failed:', e);
      }
    }

    // 2e. String Encryption (last — encrypts ALL strings)
    if (options.encryptStrings !== false) {
      onProgress('Encrypting strings...', 85);
      try {
        ast = LuaTransforms.encryptStrings(ast);
        transformsApplied.push('String Encryption');
      } catch (e) {
        console.error('String encryption failed:', e);
      }
    }

    // ---- Stage 3: Generate output ----
    onProgress('Generating output...', 95);

    var output;
    try {
      output = LuaCodeGen.generate(ast);
    } catch (e) {
      throw new Error('Code generation failed: ' + (e.message || String(e)));
    }

    // Add header comment
    output = '-- Obfuscated with encluarz\n' +
             '-- encluarz\n' + output;

    onProgress('Complete!', 100);

    var obfuscatedSize = output.length;

    return {
      code: output,
      stats: {
        originalSize: originalSize,
        obfuscatedSize: obfuscatedSize,
        ratio: (obfuscatedSize / originalSize).toFixed(2) + 'x',
        transformsApplied: transformsApplied
      }
    };
  }

  // ---- Public API ----

  window.LuaObfuscator = {
    obfuscate: obfuscate,
    preprocessLuau: preprocessLuau,
    version: '1.0.0'
  };

})();
