(function() {
  'use strict';

  var canvas = document.getElementById('previewCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var imageWidth = 1080;
  var imageHeight = 1920;
  
  // Enable high-quality image smoothing for crisp logo rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // State
  var companyId = null;
  var lang = 'en';
  var companyImageSrc = null;
  var selectedMessageIndex = -1;
  var cardImage = null;

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function initState(optionalCompanyId) {
    companyId = optionalCompanyId || getQueryParam('company') || sessionStorage.getItem('card-company');
    lang = sessionStorage.getItem('card-lang') || 'en';
    if (!companyId || !window.COMPANIES_CONFIG) {
      if (window.location.pathname.indexOf('card.html') !== -1) window.location.href = 'index.html';
      return false;
    }
    var company = window.COMPANIES_CONFIG.find(function(c) { return c.id === companyId; });
    if (!company) {
      if (window.location.pathname.indexOf('card.html') !== -1) window.location.href = 'index.html';
      return false;
    }
    companyImageSrc = company.image;
    return true;
  }

  function applyUIStrings() {
    var u = window.UI_STRINGS && window.UI_STRINGS[lang] ? window.UI_STRINGS[lang] : window.UI_STRINGS.en;
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    var set = function(id, key) { var el = document.getElementById(id); if (el && u[key]) el.textContent = u[key]; };
    set('step1Title', 'step1Title');
    set('step2Title', 'step2Title');
    set('step3Title', 'step3Title');
    set('nextFrom1', 'next');
    set('nextFrom2', 'next');
    set('backTo1', 'back');
    set('backTo2', 'back');
    set('backToCardsFromStep1', 'back');
    set('downloadCard', 'download');
    set('stepTabLabel1', 'step1Tab');
    set('stepTabLabel2', 'step2Tab');
    set('stepTabLabel3', 'step3Tab');
    set('nameReminder', 'nameReminder');
    set('nameReminderGoToStep2', 'nameReminderAction');
    set('previewImageErrorBack', 'imageErrorAction');
    var ph = document.getElementById('nameInput');
    if (ph) ph.placeholder = u.namePlaceholder;
    var backLink = document.getElementById('backToLanding');
    if (backLink) backLink.textContent = lang === 'ar' ? 'العودة إلى البطاقات ←' : '← Back to cards';
  }

  function updateNextButtonState() {
    var next1 = document.getElementById('nextFrom1');
    if (next1) next1.disabled = selectedMessageIndex < 0;
  }

  function updateStep3Hints() {
    var reminder = document.getElementById('nameReminder');
    var goLink = document.getElementById('nameReminderGoToStep2');
    var empty = getName().trim() === '';
    if (reminder) {
      if (empty) reminder.removeAttribute('hidden');
      else reminder.setAttribute('hidden', '');
    }
    if (goLink) {
      if (empty) goLink.removeAttribute('hidden');
      else goLink.setAttribute('hidden', '');
    }
  }

  function announceStep(step) {
    var live = document.getElementById('cardFlowLive');
    if (live) {
      var u = window.UI_STRINGS && window.UI_STRINGS[lang] ? window.UI_STRINGS[lang] : (window.UI_STRINGS && window.UI_STRINGS.en) || {};
      var stepLabel = step === 1 ? u.step1Tab : (step === 2 ? u.step2Tab : u.step3Tab);
      live.textContent = (u.step || 'Step') + ' ' + step + ': ' + stepLabel;
    }
  }

  function currentStep() {
    var panels = document.querySelectorAll('.step-panel');
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].classList.contains('active')) return parseInt(panels[i].getAttribute('data-step'), 10);
    }
    return 1;
  }

  function focusFirstInStep(step) {
    setTimeout(function() {
      if (step === 1) {
        var firstOpt = document.querySelector('.message-option');
        if (firstOpt) firstOpt.focus();
        else {
          var next1 = document.getElementById('nextFrom1');
          if (next1) next1.focus();
        }
      } else if (step === 2) {
        var nameInput = document.getElementById('nameInput');
        if (nameInput) nameInput.focus();
      } else if (step === 3) {
        var downloadBtn = document.getElementById('downloadCard');
        if (downloadBtn) downloadBtn.focus();
      }
    }, 0);
  }

  function goToStep(step) {
    document.querySelectorAll('.step-panel').forEach(function(p) {
      p.classList.toggle('active', parseInt(p.getAttribute('data-step'), 10) === step);
    });
    document.querySelectorAll('.step-dot').forEach(function(d) {
      var dStep = parseInt(d.getAttribute('data-step'), 10);
      d.classList.remove('active');
      d.classList.remove('done');
      if (dStep === step) d.classList.add('active');
      else if (dStep < step) d.classList.add('done');
    });
    document.querySelectorAll('.step-tab').forEach(function(tab) {
      var tStep = parseInt(tab.getAttribute('data-step'), 10);
      tab.classList.remove('active');
      tab.classList.remove('done');
      if (tStep === step) tab.classList.add('active');
      else if (tStep < step) tab.classList.add('done');
      tab.setAttribute('aria-selected', tStep === step ? 'true' : 'false');
    });
    renderPreview();
    updateNextButtonState();
    if (step === 3) updateStep3Hints();
    focusFirstInStep(step);
    announceStep(step);
  }

  function renderMessageOptions() {
    var messages = (window.MESSAGES && window.MESSAGES[lang]) ? window.MESSAGES[lang] : window.MESSAGES.en;
    var container = document.getElementById('messageOptions');
    if (!container) return;
    container.innerHTML = '';
    messages.forEach(function(msg, i) {
      var div = document.createElement('div');
      div.className = 'message-option' + (i === selectedMessageIndex ? ' selected' : '');
      div.setAttribute('data-index', i);
      div.setAttribute('tabindex', '0');
      div.setAttribute('role', 'button');
      div.textContent = msg;
      function selectThis() {
        selectedMessageIndex = parseInt(div.getAttribute('data-index'), 10);
        container.querySelectorAll('.message-option').forEach(function(o) { o.classList.remove('selected'); });
        div.classList.add('selected');
        updateNextButtonState();
        renderPreview();
      }
      div.addEventListener('click', selectThis);
      div.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectThis();
        }
      });
      container.appendChild(div);
    });
  }

  function getMessageText() {
    var messages = (window.MESSAGES && window.MESSAGES[lang]) ? window.MESSAGES[lang] : window.MESSAGES.en;
    if (selectedMessageIndex < 0 || !messages.length) return '';
    return messages[selectedMessageIndex] || '';
  }

  function getName() {
    var el = document.getElementById('nameInput');
    return el ? el.value.trim() : '';
  }

  function drawCard(context, forDownload) {
    if (!cardImage || !cardImage.complete) return;
    context.clearRect(0, 0, imageWidth, imageHeight);
    // Draw image at exact canvas dimensions to prevent scaling artifacts
    context.drawImage(cardImage, 0, 0, imageWidth, imageHeight);

    var messageText = getMessageText();
    var nameText = getName();

    context.textAlign = 'center';
    context.fillStyle = '#FFFFFF';

    // Message: smaller font, possibly multi-line
    var msgFont = '32pt GESSTwoLight';
    context.font = msgFont;
    var maxMsgWidth = imageWidth - 120;
    var msgLines = wrapText(context, messageText, maxMsgWidth);
    // Lower positions for naqash card - much lower near bottom
    var isNaqash = companyId === 'naqash';
    var isDeets = companyId === 'deets';
    var isBuroojAir = companyId === 'buroojair';
    var isEC = companyId === 'ec';
    var msgY;
    if (isNaqash) {
      msgY = 1500;
    } else if (isDeets) {
      msgY = 1400; // Move message up more for deets
    } else if (isEC) {
      msgY = 800; // Move message down a little for EC
    } else {
      msgY = 720;
    }
    var lineHeight = 48;
    msgLines.forEach(function(line, i) {
      context.fillText(line, imageWidth / 2, msgY + i * lineHeight);
    });

    // Name: below message
    context.font = '40pt GESSTwoLight';
    var nameY;
    if (isNaqash) {
      nameY = 1650;
    } else if (isDeets) {
      nameY = 1550; // Move name up more for deets
    } else if (isBuroojAir) {
      // Reduce space between message and name for burooj air
      var lastMsgLineY = msgY + (msgLines.length - 1) * lineHeight;
      nameY = lastMsgLineY + 60; // Reduced from default 180px gap to 60px
    } else if (isEC) {
      nameY = 980; // Move name down a little for EC
    } else {
      nameY = 900;
    }
    context.fillText(nameText || '', imageWidth / 2, nameY);
  }

  function wrapText(context, text, maxWidth) {
    if (!text) return [''];
    var words = text.split(/\s+/);
    var lines = [];
    var current = '';
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var test = current ? current + ' ' + word : word;
      var m = context.measureText(test);
      if (m.width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) {
      var singleWidth = context.measureText(current).width;
      if (singleWidth > maxWidth) {
        var chunk = '';
        for (var j = 0; j < current.length; j++) {
          var next = chunk + current[j];
          if (context.measureText(next).width > maxWidth && chunk) {
            lines.push(chunk);
            chunk = current[j];
          } else {
            chunk = next;
          }
        }
        if (chunk) lines.push(chunk);
      } else {
        lines.push(current);
      }
    }
    return lines.length ? lines : [''];
  }

  function renderPreview() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function() { drawCard(ctx, false); });
    } else {
      drawCard(ctx, false);
    }
  }

  function loadImage(src, callback) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() { callback(null, img); };
    img.onerror = function() { callback(new Error('Failed to load image')); };
    img.src = src;
  }

  function showImageError(show) {
    var errEl = document.getElementById('previewImageError');
    var errText = document.getElementById('previewImageErrorText');
    var errBack = document.getElementById('previewImageErrorBack');
    if (!errEl) return;
    if (show) {
      var u = window.UI_STRINGS && window.UI_STRINGS[lang] ? window.UI_STRINGS[lang] : (window.UI_STRINGS && window.UI_STRINGS.en) || {};
      if (errText) errText.textContent = u.imageError || 'Image could not be loaded.';
      if (errBack) {
        errBack.textContent = u.imageErrorAction || 'Back to cards';
        if (errBack.tagName === 'BUTTON' && !errBack._boundBack) {
          errBack._boundBack = true;
          errBack.addEventListener('click', function() {
            if (window.goBackToCards) window.goBackToCards();
          });
        }
      }
      errEl.removeAttribute('hidden');
    } else {
      errEl.setAttribute('hidden', '');
    }
  }

  function initCanvas() {
    showImageError(false);
    loadImage(companyImageSrc, function(err, img) {
      if (err || !img) {
        showImageError(true);
        return;
      }
      cardImage = img;
      renderPreview();
    });
  }

  function downloadCard() {
    if (!cardImage || !cardImage.complete) return;
    var downloadBtn = document.getElementById('downloadCard');
    var originalText = '';
    if (downloadBtn) {
      originalText = downloadBtn.textContent;
      var u = window.UI_STRINGS && window.UI_STRINGS[lang] ? window.UI_STRINGS[lang] : (window.UI_STRINGS && window.UI_STRINGS.en) || {};
      downloadBtn.textContent = u.downloading || 'Downloading…';
      downloadBtn.disabled = true;
    }
    var doDownload = function() {
      drawCard(ctx, true);
      var nameInput = getName().replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
      var fileName = nameInput ? 'EidCard_' + nameInput + '.png' : 'EidCard.png';
      var link = document.createElement('a');
      link.download = fileName;
      canvas.toBlob(function(blob) {
        if (!blob) {
          if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = originalText;
          }
          return;
        }
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        if (downloadBtn) {
          downloadBtn.disabled = false;
          downloadBtn.textContent = originalText;
        }
        var u = window.UI_STRINGS && window.UI_STRINGS[lang] ? window.UI_STRINGS[lang] : (window.UI_STRINGS && window.UI_STRINGS.en) || {};
        var successEl = document.getElementById('downloadSuccessMsg');
        if (successEl) {
          successEl.textContent = u.downloadSuccess || 'Download started!';
          successEl.removeAttribute('hidden');
          setTimeout(function() { successEl.setAttribute('hidden', ''); }, 2500);
        }
      }, 'image/png');
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(doDownload);
    } else {
      doDownload();
    }
  }

  function bindStepEvents() {
    if (window._cardFlowEventsBound) return;
    window._cardFlowEventsBound = true;
    var next1 = document.getElementById('nextFrom1');
    var back1 = document.getElementById('backTo1');
    var next2 = document.getElementById('nextFrom2');
    var back2 = document.getElementById('backTo2');
    var downloadBtn = document.getElementById('downloadCard');
    var nameInput = document.getElementById('nameInput');
    document.querySelectorAll('.step-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var step = parseInt(this.getAttribute('data-step'), 10);
        goToStep(step);
      });
    });
    if (next1) next1.addEventListener('click', function() { goToStep(2); });
    if (back1) back1.addEventListener('click', function() { goToStep(1); });
    if (next2) next2.addEventListener('click', function() { goToStep(3); });
    if (back2) back2.addEventListener('click', function() { goToStep(2); });
    if (downloadBtn) downloadBtn.addEventListener('click', downloadCard);
    if (nameInput) nameInput.addEventListener('input', function() {
      if (currentStep() === 2 || currentStep() === 3) renderPreview();
      if (currentStep() === 3) updateStep3Hints();
    });
    var nameReminderGo = document.getElementById('nameReminderGoToStep2');
    if (nameReminderGo) nameReminderGo.addEventListener('click', function() { goToStep(2); });
  }

  var companyFromUrl = getQueryParam('company');
  if (companyFromUrl) {
    if (initState(companyFromUrl)) {
      applyUIStrings();
      renderMessageOptions();
      updateNextButtonState();
      goToStep(1);
      initCanvas();
      bindStepEvents();
    }
  } else {
    window.startCardFlow = function(selectedCompanyId) {
      if (!selectedCompanyId || !window.COMPANIES_CONFIG) return;
      var company = window.COMPANIES_CONFIG.find(function(c) { return c.id === selectedCompanyId; });
      if (!company) return;
      companyId = selectedCompanyId;
      companyImageSrc = company.image;
      lang = sessionStorage.getItem('card-lang') || 'en';
      selectedMessageIndex = -1;
      applyUIStrings();
      renderMessageOptions();
      updateNextButtonState();
      goToStep(1);
      initCanvas();
      bindStepEvents();
    };
  }
})();
