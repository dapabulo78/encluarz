// ============================================================
// Matcha Scripts — Script Library Logic
// Renders script cards, handles search, and script viewer modal.
// ============================================================

(function () {
  'use strict';

  // ---- Script Manifest ----
  // Since this is a static site, we define the script list here.
  // Filenames follow the convention: "Script Name - author.lua"
  var SCRIPTS = [
    { file: 'Blox Fruits - myth4c.lua', size: '45.2 KB' },
    { file: 'Chinese Hat - myth4c.lua', size: '3.7 KB' },
    { file: 'Player_Velocity_Indicator - starryskidder.lua', size: '2.7 KB' },
    { file: 'draw a line to moving part - starryskidder.lua', size: '5.7 KB' },
    { file: 'full bright - starryskidder.lua', size: '2.4 KB' },
    { file: 'korbloxheadlessvisual - sxeaware.lua', size: '1.8 KB' },
    { file: 'matchalua - diamondreaper9.lua', size: '15.5 KB' },
    { file: 'pizza place dilivery autofarm - whymayko.lua', size: '3.4 KB' },
    { file: 'vd auto fix gens - c7.lua', size: '6.1 KB' }
  ];

  // Parse name and author from filename
  function parseFilename(filename) {
    var base = filename.replace(/\.lua$/, '');
    var dashIdx = base.lastIndexOf(' - ');
    if (dashIdx === -1) {
      return { name: base, author: 'unknown' };
    }
    return {
      name: base.substring(0, dashIdx),
      author: base.substring(dashIdx + 3)
    };
  }

  // ---- DOM References ----
  var grid = document.getElementById('scriptsGrid');
  var searchInput = document.getElementById('searchInput');
  var scriptsCount = document.getElementById('scriptsCount');
  var modalOverlay = document.getElementById('modalOverlay');
  var modalName = document.getElementById('modalName');
  var modalAuthor = document.getElementById('modalAuthor');
  var modalClose = document.getElementById('modalClose');
  var modalCopyBtn = document.getElementById('modalCopy');
  var modalDownloadBtn = document.getElementById('modalDownload');

  // ---- CodeMirror Modal Editor ----
  var modalEditor = null;
  var currentModalCode = '';
  var currentModalFile = '';

  function initModalEditor() {
    modalEditor = CodeMirror.fromTextArea(document.getElementById('modalEditor'), {
      mode: 'lua',
      theme: 'material-darker',
      lineNumbers: true,
      readOnly: true,
      lineWrapping: false,
      viewportMargin: Infinity
    });
  }

  // ---- Render Cards ----
  function renderCards(filter) {
    grid.innerHTML = '';
    var query = (filter || '').toLowerCase().trim();
    var visibleCount = 0;

    for (var i = 0; i < SCRIPTS.length; i++) {
      var script = SCRIPTS[i];
      var parsed = parseFilename(script.file);

      // Filter
      if (query) {
        var haystack = (parsed.name + ' ' + parsed.author).toLowerCase();
        if (haystack.indexOf(query) === -1) continue;
      }

      visibleCount++;
      var card = createCard(script, parsed, i);
      grid.appendChild(card);
    }

    // Update count
    scriptsCount.textContent = visibleCount + ' script' + (visibleCount !== 1 ? 's' : '');

    // Empty state
    if (visibleCount === 0) {
      var empty = document.createElement('div');
      empty.className = 'scripts-empty';
      empty.textContent = query ? 'No scripts matching "' + query + '"' : 'No scripts available.';
      grid.appendChild(empty);
    }
  }

  function createCard(script, parsed, index) {
    var card = document.createElement('div');
    card.className = 'script-card';
    card.innerHTML =
      '<div class="script-card-header">' +
        '<div class="script-icon">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' +
        '</div>' +
        '<div class="script-info">' +
          '<div class="script-name">' + escapeHTML(parsed.name) + '</div>' +
          '<div class="script-meta">' +
            '<span class="script-author">@' + escapeHTML(parsed.author) + '</span>' +
            '<span class="script-size">' + script.size + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="script-actions">' +
        '<button class="script-btn script-btn-view" data-idx="' + index + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
          'View' +
        '</button>' +
        '<button class="script-btn script-btn-copy" data-idx="' + index + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
          'Copy' +
        '</button>' +
      '</div>';

    // View button
    var viewBtn = card.querySelector('.script-btn-view');
    viewBtn.addEventListener('click', function () {
      openModal(script, parsed);
    });

    // Copy button
    var copyBtn = card.querySelector('.script-btn-copy');
    copyBtn.addEventListener('click', function () {
      fetchScript(script.file, function (code) {
        copyToClipboard(code, copyBtn);
      });
    });

    return card;
  }

  // ---- Fetch Script Content ----
  var scriptCache = {};

  function fetchScript(filename, callback) {
    if (scriptCache[filename]) {
      callback(scriptCache[filename]);
      return;
    }
    fetch('contents/scripts/' + encodeURIComponent(filename))
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load script');
        return res.text();
      })
      .then(function (text) {
        scriptCache[filename] = text;
        callback(text);
      })
      .catch(function (err) {
        console.error('Error fetching script:', err);
        callback('-- Error loading script: ' + err.message);
      });
  }

  // ---- Modal ----
  function openModal(script, parsed) {
    currentModalFile = script.file;
    modalName.textContent = parsed.name;
    modalAuthor.textContent = '@' + parsed.author;

    // Show modal with loading state
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (modalEditor) {
      modalEditor.setValue('-- Loading...');
    }

    fetchScript(script.file, function (code) {
      currentModalCode = code;
      if (modalEditor) {
        modalEditor.setValue(code);
        // Refresh after a tick so CodeMirror renders correctly
        setTimeout(function () { modalEditor.refresh(); }, 50);
      }
    });
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    currentModalCode = '';
    currentModalFile = '';
  }

  // ---- Clipboard ----
  function copyToClipboard(text, btnEl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopied(btnEl);
      });
    } else {
      // Fallback
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopied(btnEl);
    }
  }

  function showCopied(btn) {
    var origHTML = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
      'Copied!';
    setTimeout(function () {
      btn.classList.remove('copied');
      btn.innerHTML = origHTML;
    }, 2000);
  }

  // ---- Download ----
  function downloadScript() {
    if (!currentModalCode || !currentModalFile) return;
    var blob = new Blob([currentModalCode], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = currentModalFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Helpers ----
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---- Events ----
  searchInput.addEventListener('input', function () {
    renderCards(searchInput.value);
  });

  modalClose.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
      closeModal();
    }
  });

  modalCopyBtn.addEventListener('click', function () {
    if (currentModalCode) {
      copyToClipboard(currentModalCode, modalCopyBtn);
    }
  });

  modalDownloadBtn.addEventListener('click', downloadScript);

  // ---- Init ----
  initModalEditor();
  renderCards('');

})();
