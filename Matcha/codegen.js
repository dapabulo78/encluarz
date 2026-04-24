// ============================================================
// Matcha Obfuscator — Lua Code Generator
// Converts a luaparse AST back into valid Lua source code.
// ============================================================

(function () {
  'use strict';

  // Lua operator precedence (higher = binds tighter)
  var PRECEDENCE = {
    'or':  1,
    'and': 2,
    '<':   3, '>': 3, '<=': 3, '>=': 3, '~=': 3, '==': 3,
    '..':  4,
    '+':   5, '-': 5,
    '*':   6, '/': 6, '%': 6,
    'not': 7, '#': 7, /* unary minus also 7 */
    '^':   8
  };

  // Right-associative operators
  var RIGHT_ASSOC = { '..': true, '^': true };

  // Lua keywords — used to detect ambiguous call-after-statement situations
  var KEYWORDS = [
    'and','break','do','else','elseif','end','false','for','function',
    'goto','if','in','local','nil','not','or','repeat','return','then',
    'true','until','while'
  ];

  // ---- Helpers ----

  function escapeString(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      switch (c) {
        case 0:   out += '\\0';  break;
        case 7:   out += '\\a';  break;
        case 8:   out += '\\b';  break;
        case 9:   out += '\\t';  break;
        case 10:  out += '\\n';  break;
        case 11:  out += '\\v';  break;
        case 12:  out += '\\f';  break;
        case 13:  out += '\\r';  break;
        case 34:  out += '\\"';  break;
        case 92:  out += '\\\\'; break;
        default:
          if (c < 32 || c > 126) {
            out += '\\' + c;
          } else {
            out += str.charAt(i);
          }
      }
    }
    return '"' + out + '"';
  }

  function needsParens(parentOp, childNode, isRight) {
    // Always parenthesize if child is an expression with an operator
    if (!childNode) return false;
    var childOp = null;
    if (childNode.type === 'BinaryExpression' || childNode.type === 'LogicalExpression') {
      childOp = childNode.operator;
    } else {
      return false;
    }
    var parentPrec = PRECEDENCE[parentOp] || 0;
    var childPrec = PRECEDENCE[childOp] || 0;
    if (childPrec < parentPrec) return true;
    if (childPrec === parentPrec) {
      if (isRight && !RIGHT_ASSOC[parentOp]) return true;
      if (!isRight && RIGHT_ASSOC[parentOp]) return true;
    }
    return false;
  }

  // ---- Code Generator ----

  function generate(ast) {
    if (!ast) return '';
    if (ast.type === 'Chunk') {
      return generateBody(ast.body);
    }
    return generateNode(ast);
  }

  function generateBody(body) {
    if (!body || body.length === 0) return '';
    var parts = [];
    for (var i = 0; i < body.length; i++) {
      var code = generateNode(body[i]);
      if (code !== '') parts.push(code);
    }
    // Use semicolons between statements to avoid ambiguity
    return parts.join(';');
  }

  function generateNode(node) {
    if (!node) return '';

    switch (node.type) {
      // ---- Statements ----

      case 'LocalStatement':
        return genLocalStatement(node);

      case 'AssignmentStatement':
        return genAssignmentStatement(node);

      case 'CallStatement':
        return generateNode(node.expression);

      case 'IfStatement':
        return genIfStatement(node);

      case 'WhileStatement':
        return 'while ' + generateNode(node.condition) + ' do ' +
               generateBody(node.body) + ' end';

      case 'DoStatement':
        return 'do ' + generateBody(node.body) + ' end';

      case 'RepeatStatement':
        return 'repeat ' + generateBody(node.body) + ' until ' +
               generateNode(node.condition);

      case 'ForNumericStatement':
        return genForNumericStatement(node);

      case 'ForGenericStatement':
        return genForGenericStatement(node);

      case 'ReturnStatement':
        if (!node.arguments || node.arguments.length === 0) return 'return';
        return 'return ' + node.arguments.map(generateNode).join(',');

      case 'BreakStatement':
        return 'break';

      case 'LabelStatement':
        // If this is a continue-marker label (__mcont_N__), skip it entirely —
        // Luau doesn't support ::label:: syntax; we emit native 'continue' instead.
        if (node.label && node.label.name && /^__mcont_\d+__$/.test(node.label.name)) {
          return '';
        }
        return '::' + node.label.name + '::';

      case 'GotoStatement':
        // If this is a continue-marker goto (__mcont_N__), emit Luau 'continue'
        if (node.label && node.label.name && /^__mcont_\d+__$/.test(node.label.name)) {
          return 'continue';
        }
        return 'goto ' + node.label.name;

      case 'FunctionDeclaration':
        return genFunctionDeclaration(node);

      // ---- Expressions ----

      case 'Identifier':
        return node.name;

      case 'NumericLiteral':
        return genNumericLiteral(node);

      case 'StringLiteral':
        return genStringLiteral(node);

      case 'BooleanLiteral':
        return node.value ? 'true' : 'false';

      case 'NilLiteral':
        return 'nil';

      case 'VarargLiteral':
        return '...';

      case 'BinaryExpression':
      case 'LogicalExpression':
        return genBinaryExpression(node);

      case 'UnaryExpression':
        return genUnaryExpression(node);

      case 'MemberExpression':
        return generateNode(node.base) + node.indexer + node.identifier.name;

      case 'IndexExpression':
        return generateNode(node.base) + '[' + generateNode(node.index) + ']';

      case 'CallExpression':
        return genCallExpression(node);

      case 'StringCallExpression':
        return generateNode(node.base) + ' ' + generateNode(node.argument);

      case 'TableCallExpression':
        return generateNode(node.base) + generateNode(node.arguments);

      case 'TableConstructorExpression':
        return genTableConstructor(node);

      // ---- Table Fields ----

      case 'TableKey':
        return '[' + generateNode(node.key) + ']=' + generateNode(node.value);

      case 'TableKeyString':
        return node.key.name + '=' + generateNode(node.value);

      case 'TableValue':
        return generateNode(node.value);

      // ---- Comment (no-op, strip) ----
      case 'Comment':
        return '';

      default:
        // Unknown node — return empty to avoid crashing
        console.warn('LuaCodeGen: Unknown node type: ' + node.type);
        return '';
    }
  }

  // ---- Statement Generators ----

  function genLocalStatement(node) {
    var names = node.variables.map(generateNode).join(',');
    var out = 'local ' + names;
    if (node.init && node.init.length > 0) {
      out += '=' + node.init.map(generateNode).join(',');
    }
    return out;
  }

  function genAssignmentStatement(node) {
    var vars = node.variables.map(generateNode).join(',');
    var vals = node.init.map(generateNode).join(',');
    return vars + '=' + vals;
  }

  function genIfStatement(node) {
    var out = '';
    for (var i = 0; i < node.clauses.length; i++) {
      var clause = node.clauses[i];
      if (clause.type === 'IfClause') {
        out += 'if ' + generateNode(clause.condition) + ' then ' +
               generateBody(clause.body);
      } else if (clause.type === 'ElseifClause') {
        out += ' elseif ' + generateNode(clause.condition) + ' then ' +
               generateBody(clause.body);
      } else if (clause.type === 'ElseClause') {
        out += ' else ' + generateBody(clause.body);
      }
    }
    out += ' end';
    return out;
  }

  function genForNumericStatement(node) {
    var out = 'for ' + generateNode(node.variable) + '=' +
              generateNode(node.start) + ',' + generateNode(node.end);
    if (node.step) {
      out += ',' + generateNode(node.step);
    }
    out += ' do ' + generateBody(node.body) + ' end';
    return out;
  }

  function genForGenericStatement(node) {
    var vars = node.variables.map(generateNode).join(',');
    var iters = node.iterators.map(generateNode).join(',');
    return 'for ' + vars + ' in ' + iters + ' do ' +
           generateBody(node.body) + ' end';
  }

  function genFunctionDeclaration(node) {
    var params = [];
    if (node.parameters) {
      for (var i = 0; i < node.parameters.length; i++) {
        params.push(generateNode(node.parameters[i]));
      }
    }
    var paramStr = '(' + params.join(',') + ')';
    var bodyStr = generateBody(node.body);

    // Named function (statement)
    if (node.identifier) {
      var prefix = node.isLocal ? 'local function ' : 'function ';
      return prefix + generateNode(node.identifier) + paramStr + ' ' + bodyStr + ' end';
    }

    // Anonymous function (expression)
    return 'function' + paramStr + ' ' + bodyStr + ' end';
  }

  // ---- Expression Generators ----

  /**
   * Extract the actual string value from a luaparse StringLiteral node.
   * luaparse v0.3.x sets value=null and stores the quoted source in raw.
   */
  function extractStringValue(node) {
    if (node.value !== null && node.value !== undefined) {
      return node.value;
    }
    // Parse from raw: strip surrounding quotes and unescape
    var raw = node.raw || '""';
    var quote = raw.charAt(0);
    if (quote === '"' || quote === "'") {
      var inner = raw.substring(1, raw.length - 1);
      // Unescape common sequences
      return inner
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\a/g, '\x07')
        .replace(/\\b/g, '\x08')
        .replace(/\\f/g, '\x0c')
        .replace(/\\v/g, '\x0b')
        .replace(/\\0/g, '\0')
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\(\d{1,3})/g, function (m, d) {
          return String.fromCharCode(parseInt(d, 10));
        });
    }
    // Long string [[...]] or [=[...]=]
    var match = raw.match(/^\[(=*)\[([\s\S]*)\]\1\]$/);
    if (match) {
      return match[2];
    }
    return raw;
  }

  function genStringLiteral(node) {
    // If raw is available (luaparse always provides it), use it directly
    // for faithful output; otherwise escape the value.
    if (node.raw !== null && node.raw !== undefined) {
      return node.raw;
    }
    if (node.value !== null && node.value !== undefined) {
      return escapeString(node.value);
    }
    return '""';
  }

  function genNumericLiteral(node) {
    // Use raw if available, otherwise value
    if (node.raw !== undefined && node.raw !== null) {
      return String(node.raw);
    }
    return String(node.value);
  }

  function genBinaryExpression(node) {
    var op = node.operator;
    var leftStr = generateNode(node.left);
    var rightStr = generateNode(node.right);

    // Add parens to children if needed for precedence
    if (needsParens(op, node.left, false)) {
      leftStr = '(' + leftStr + ')';
    }
    if (needsParens(op, node.right, true)) {
      rightStr = '(' + rightStr + ')';
    }

    // Space around operators for readability of keywords (and, or, not)
    return leftStr + ' ' + op + ' ' + rightStr;
  }

  function genUnaryExpression(node) {
    var op = node.operator;
    var argStr = generateNode(node.argument);

    // Parenthesize argument if it's a binary/logical expression
    if (node.argument.type === 'BinaryExpression' ||
        node.argument.type === 'LogicalExpression') {
      argStr = '(' + argStr + ')';
    }

    // 'not' and '-' need a space before identifiers/calls; '#' does not
    if (op === 'not') {
      return 'not ' + argStr;
    }
    if (op === '-') {
      // Handle double-negative: -(-x) should not become --x
      if (argStr.charAt(0) === '-') {
        return '-(' + argStr + ')';
      }
      return '-' + argStr;
    }
    // # operator
    return '#' + argStr;
  }

  function genCallExpression(node) {
    var base = generateNode(node.base);
    // In Lua grammar, only prefixexp can be called:
    //   prefixexp ::= var | functioncall | '(' exp ')'
    // A FunctionDeclaration (functiondef) is NOT a prefixexp, so it must
    // be wrapped in parens to be callable: (function() end)()
    if (node.base && node.base.type === 'FunctionDeclaration') {
      base = '(' + base + ')';
    }
    var args = node.arguments.map(generateNode).join(',');
    return base + '(' + args + ')';
  }

  function genTableConstructor(node) {
    if (!node.fields || node.fields.length === 0) return '{}';
    var fields = node.fields.map(generateNode).join(',');
    return '{' + fields + '}';
  }

  // ---- Public API ----

  window.LuaCodeGen = {
    generate: generate,
    generateNode: generateNode,
    generateBody: generateBody,
    escapeString: escapeString,
    extractStringValue: extractStringValue
  };

})();
