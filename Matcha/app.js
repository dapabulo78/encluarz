// ============================================================
// Matcha Obfuscator — Application / UI Logic
// Handles file upload, code editor input, obfuscation
// triggering, progress updates, error display, copy output,
// and file download.
// ============================================================

(function () {
  'use strict';

  // ---- DOM References ----

  // Tabs
  var tabUpload      = document.getElementById('tabUpload');
  var tabEditor      = document.getElementById('tabEditor');
  var paneUpload     = document.getElementById('paneUpload');
  var paneEditor     = document.getElementById('paneEditor');

  // Upload
  var uploadZone     = document.getElementById('uploadZone');
  var uploadContent  = document.getElementById('uploadContent');
  var fileInfo       = document.getElementById('fileInfo');
  var fileInput      = document.getElementById('fileInput');
  var fileName       = document.getElementById('fileName');
  var fileSize       = document.getElementById('fileSize');
  var fileRemove     = document.getElementById('fileRemove');

  // Buttons
  var btnObfuscate   = document.getElementById('btnObfuscate');
  var btnText        = document.getElementById('btnText');
  var btnSpinner     = document.getElementById('btnSpinner');
  var btnDownload    = document.getElementById('btnDownload');
  var btnCopy        = document.getElementById('btnCopy');
  var copyText       = document.getElementById('copyText');

  // Progress / Error
  var progressContainer = document.getElementById('progressContainer');
  var progressFill      = document.getElementById('progressFill');
  var progressText      = document.getElementById('progressText');
  var errorContainer    = document.getElementById('errorContainer');
  var errorMessage      = document.getElementById('errorMessage');

  // Results
  var resultsContainer = document.getElementById('resultsContainer');
  var statOriginal     = document.getElementById('statOriginal');
  var statObfuscated   = document.getElementById('statObfuscated');
  var statRatio        = document.getElementById('statRatio');
  var statTransforms   = document.getElementById('statTransforms');

  // Options
  var optRenameVars     = document.getElementById('optRenameVars');
  var optEncryptStrings = document.getElementById('optEncryptStrings');
  var optFlattenFlow    = document.getElementById('optFlattenFlow');
  var optDeadCode       = document.getElementById('optDeadCode');
  var optEncodeConsts   = document.getElementById('optEncodeConsts');

  // ---- State ----
  var activeTab      = 'upload';   // 'upload' | 'editor'
  var currentFile    = null;       // { name, size, content }
  var obfuscatedCode = null;       // string
  var downloadUrl    = null;       // blob URL

  // ---- CodeMirror Editors ----
  var cmInput = CodeMirror.fromTextArea(document.getElementById('inputEditor'), {
    mode:           'lua',
    theme:          'material-darker',
    lineNumbers:    true,
    indentUnit:     4,
    tabSize:        4,
    indentWithTabs: false,
    lineWrapping:   false,
    placeholder:    '-- Paste your Lua / Luau code here...',
    autofocus:      false
  });

  var cmOutput = CodeMirror.fromTextArea(document.getElementById('outputEditor'), {
    mode:           'lua',
    theme:          'material-darker',
    lineNumbers:    true,
    indentUnit:     4,
    tabSize:        4,
    indentWithTabs: false,
    lineWrapping:   false,
    readOnly:       true
  });

  // ---- Helpers ----

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function showError(msg) {
    errorContainer.style.display = 'block';
    errorMessage.textContent = msg;
    resultsContainer.style.display = 'none';
  }

  function hideError() {
    errorContainer.style.display = 'none';
  }

  function showProgress(text, percent) {
    progressContainer.style.display = 'block';
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
  }

  function hideProgress() {
    progressContainer.style.display = 'none';
    progressFill.style.width = '0%';
  }

  function setProcessing(processing) {
    btnObfuscate.disabled = processing;
    if (processing) {
      btnObfuscate.classList.add('processing');
      btnText.textContent = 'Processing...';
      btnSpinner.style.display = 'inline-block';
    } else {
      btnObfuscate.classList.remove('processing');
      btnText.textContent = 'Obfuscate';
      btnSpinner.style.display = 'none';
    }
  }

  /** Check if there's valid input (either a file or code in the editor) */
  function hasInput() {
    if (activeTab === 'upload') {
      return currentFile !== null;
    }
    return cmInput.getValue().trim().length > 0;
  }

  /** Get the source code to obfuscate from whatever input mode is active */
  function getSourceCode() {
    if (activeTab === 'upload' && currentFile) {
      return currentFile.content;
    }
    return cmInput.getValue();
  }

  /** Update the obfuscate button enabled state */
  function updateButtonState() {
    btnObfuscate.disabled = !hasInput();
  }

  // ---- Tab Switching ----

  function switchTab(tab) {
    activeTab = tab;

    // Update tab button styles
    tabUpload.classList.toggle('active', tab === 'upload');
    tabEditor.classList.toggle('active', tab === 'editor');

    // Show/hide panes
    paneUpload.classList.toggle('active', tab === 'upload');
    paneEditor.classList.toggle('active', tab === 'editor');

    // Refresh CodeMirror when becoming visible (fixes rendering)
    if (tab === 'editor') {
      setTimeout(function () { cmInput.refresh(); }, 10);
    }

    updateButtonState();
    hideError();
  }

  tabUpload.addEventListener('click', function () { switchTab('upload'); });
  tabEditor.addEventListener('click', function () { switchTab('editor'); });

  // Enable button when user types in the editor
  cmInput.on('change', function () {
    if (activeTab === 'editor') {
      updateButtonState();
    }
  });

  // ---- File Upload ----

  function handleFile(file) {
    var ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'lua' && ext !== 'luau' && ext !== 'txt') {
      showError('Invalid file type: ".' + ext + '". Please upload a .lua or .luau file.');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      currentFile = {
        name: file.name,
        size: file.size,
        content: e.target.result
      };

      uploadContent.style.display = 'none';
      fileInfo.style.display = 'flex';
      fileName.textContent = file.name;
      fileSize.textContent = formatBytes(file.size);
      uploadZone.classList.add('has-file');

      updateButtonState();
      hideError();
      resultsContainer.style.display = 'none';
    };
    reader.onerror = function () {
      showError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  }

  function removeFile() {
    currentFile = null;
    obfuscatedCode = null;
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      downloadUrl = null;
    }

    uploadContent.style.display = 'block';
    fileInfo.style.display = 'none';
    uploadZone.classList.remove('has-file');
    fileInput.value = '';

    updateButtonState();
    hideError();
    hideProgress();
    resultsContainer.style.display = 'none';
  }

  uploadZone.addEventListener('click', function (e) {
    if (e.target === fileRemove || e.target.closest('.file-remove')) return;
    if (!currentFile) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  fileRemove.addEventListener('click', function (e) {
    e.stopPropagation();
    removeFile();
  });

  uploadZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('dragover');
    var files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  });

  // ---- Obfuscation ----

  btnObfuscate.addEventListener('click', function () {
    var code = getSourceCode();
    if (!code || code.trim().length === 0) {
      showError(activeTab === 'upload'
        ? 'Please upload a .lua file first.'
        : 'Please paste some Lua code in the editor.');
      return;
    }

    hideError();
    resultsContainer.style.display = 'none';
    setProcessing(true);
    showProgress('Initializing...', 5);

    setTimeout(function () {
      try {
        var options = {
          renameVars:     optRenameVars.checked,
          encryptStrings: optEncryptStrings.checked,
          flattenFlow:    optFlattenFlow.checked,
          deadCode:       optDeadCode.checked,
          encodeConsts:   optEncodeConsts.checked
        };

        var result = LuaObfuscator.obfuscate(code, options, function (stage, percent) {
          showProgress(stage, percent);
        });

        obfuscatedCode = result.code;
        showResults(result.stats);

      } catch (err) {
        showError(err.message || 'An unexpected error occurred during obfuscation.');
        hideProgress();
      }

      setProcessing(false);
    }, 100);
  });

  // ---- Results Display ----

  function showResults(stats) {
    statOriginal.textContent = formatBytes(stats.originalSize);
    statObfuscated.textContent = formatBytes(stats.obfuscatedSize);
    statRatio.textContent = stats.ratio;
    statTransforms.textContent = stats.transformsApplied.length + ' applied';

    // Set the output CodeMirror editor content
    cmOutput.setValue(obfuscatedCode);
    // Refresh after making visible
    setTimeout(function () { cmOutput.refresh(); }, 10);

    // Reset copy button
    copyText.textContent = 'Copy Output';
    btnCopy.classList.remove('copied');

    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Copy Output -----

  btnCopy.addEventListener('click', function () {
    if (!obfuscatedCode) return;

    navigator.clipboard.writeText(obfuscatedCode).then(function () {
      copyText.textContent = 'Copied!';
      btnCopy.classList.add('copied');
      setTimeout(function () {
        copyText.textContent = 'Copy Output';
        btnCopy.classList.remove('copied');
      }, 2000);
    }).catch(function () {
      // Fallback for older browsers / insecure contexts
      var ta = document.createElement('textarea');
      ta.value = obfuscatedCode;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        copyText.textContent = 'Copied!';
        btnCopy.classList.add('copied');
        setTimeout(function () {
          copyText.textContent = 'Copy Output';
          btnCopy.classList.remove('copied');
        }, 2000);
      } catch (e) {
        copyText.textContent = 'Failed';
      }
      document.body.removeChild(ta);
    });
  });

  // ---- Download ----

  btnDownload.addEventListener('click', function () {
    if (!obfuscatedCode) return;

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    var blob = new Blob([obfuscatedCode], { type: 'text/plain;charset=utf-8' });
    downloadUrl = URL.createObjectURL(blob);

    var origName = (currentFile ? currentFile.name : null) || 'script.lua';
    var baseName = origName.replace(/\.[^.]+$/, '');
    var downloadName = baseName + '_obfuscated.lua';

    var a = document.createElement('a');
    a.href = downloadUrl;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // ---- Initial State ----
  updateButtonState();

})();
