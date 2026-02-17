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
  var lang = 'ar';
  var companyImageSrc = null;
  var selectedMessageIndex = -1;
  var cardImage = null;

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function initState(optionalCompanyId) {
    companyId = optionalCompanyId || getQueryParam('company') || sessionStorage.getItem('card-company');
    lang = sessionStorage.getItem('card-lang') || 'ar';
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

  // Get font file path for a company, language, and weight (relative to HTML file)
  function getFontPath(companyId, lang, weight) {
    var fontPathMap = {
      '6degrees': {
        ar: { 
          light: 'assets/fonts/6D/01.%20Arabic%20Font/sst-arabic-light.ttf',
          medium: 'assets/fonts/6D/01.%20Arabic%20Font/sst-arabic-medium.ttf'
        },
        en: { 
          light: 'assets/fonts/6D/02.%20English%20Font/KonnectLight.otf',
          medium: 'assets/fonts/6D/02.%20English%20Font/KonnectMedium.otf'
        }
      },
      'burooj': {
        ar: { 
          light: 'assets/fonts/burooj/01.%20Arabic%20Font/alqabas-light.ttf',
          medium: 'assets/fonts/burooj/01.%20Arabic%20Font/alqabas-regular.ttf'
        },
        en: { 
          light: 'assets/fonts/burooj/02.%20English%20Font/RedHatDisplay-Light.ttf',
          medium: 'assets/fonts/burooj/02.%20English%20Font/RedHatDisplay-Medium.ttf'
        }
      },
      'buroojair': {
        ar: { 
          light: 'assets/fonts/burooj%20air/01.%20Arabic%20Font/NeoSansArabicLight.ttf',
          medium: 'assets/fonts/burooj%20air/01.%20Arabic%20Font/Neo_Sans_Medium.ttf'
        },
        en: { 
          light: 'assets/fonts/burooj%20air/02.%20English%20Font/helvetica-light-587ebe5a59211.ttf',
          medium: 'assets/fonts/burooj%20air/02.%20English%20Font/Helvetica-Bold.ttf'
        }
      },
      'deets': {
        ar: { 
          light: 'assets/fonts/deets/01.%20Arabic%20Font/ArbFONTS-FFShamelFamily-SansOneBook.ttf',
          medium: 'assets/fonts/deets/01.%20Arabic%20Font/ArbFONTS-FFShamelFamily-SansOneBold.ttf'
        },
        en: { 
          light: 'assets/fonts/deets/02.%20English%20Font/Urbane-Thin.ttf',
          medium: 'assets/fonts/deets/02.%20English%20Font/Urbane-Medium.ttf'
        }
      },
      'ec': {
        ar: { 
          light: 'assets/fonts/EC/01.%20Arabic%20Font/GE%20SS%20TWO%20LIGHT.ttf',
          medium: 'assets/fonts/EC/01.%20Arabic%20Font/GE%20SS%20TWO%20MEDIUM.otf'
        },
        en: { 
          light: 'assets/fonts/EC/02.%20English%20Font/Montserrat-Light.ttf',
          medium: 'assets/fonts/EC/02.%20English%20Font/Montserrat-Medium.ttf'
        }
      },
      'naqash': {
        ar: { 
          light: 'assets/fonts/naqsh/01.%20Arabic%20Font/riyad-bank-Regular.ttf',
          medium: 'assets/fonts/naqsh/01.%20Arabic%20Font/riyad-bank-Bold.ttf'
        },
        en: { 
          light: 'assets/fonts/naqsh/02.%20English%20Font/alfont_com_29LTZeyn-Regular.ttf',
          medium: 'assets/fonts/naqsh/02.%20English%20Font/alfont_com_29LTZeyn-Medium%20%281%29.ttf'
        }
      },
      'pe': {
        ar: { 
          light: 'assets/fonts/PE/01.%20Arabic%20Font/GE%20SS%20TWO%20LIGHT.ttf',
          medium: 'assets/fonts/PE/01.%20Arabic%20Font/GE%20SS%20TWO%20MEDIUM.otf'
        },
        en: { 
          light: 'assets/fonts/PE/02.%20English%20Font/Gotham-Font/Gotham-Light.otf',
          medium: 'assets/fonts/PE/02.%20English%20Font/Gotham-Font/GothamMedium.ttf'
        }
      }
    };
    
    var langKey = lang === 'ar' ? 'ar' : 'en';
    var weightKey = weight === 'light' ? 'light' : 'medium';
    
    if (fontPathMap[companyId] && fontPathMap[companyId][langKey] && fontPathMap[companyId][langKey][weightKey]) {
      return fontPathMap[companyId][langKey][weightKey];
    }
    
    return null;
  }

  // Get company-specific font family based on company ID, language, and weight
  function getCompanyFont(companyId, lang, weight) {
    // weight: 'light' for messages, 'medium' or 'bold' for names
    var fontMap = {
      '6degrees': {
        ar: { light: '6degrees-Arabic-Light', medium: '6degrees-Arabic-Medium' },
        en: { light: '6degrees-English-Light', medium: '6degrees-English-Medium' }
      },
      'burooj': {
        ar: { light: 'Burooj-Arabic-Light', medium: 'Burooj-Arabic-Regular' },
        en: { light: 'Burooj-English-Light', medium: 'Burooj-English-Medium' }
      },
      'buroojair': {
        ar: { light: 'BuroojAir-Arabic-Light', medium: 'BuroojAir-Arabic-Medium' },
        en: { light: 'BuroojAir-English-Light', medium: 'BuroojAir-English-Bold' }
      },
      'deets': {
        ar: { light: 'Deets-Arabic-Book', medium: 'Deets-Arabic-Bold' },
        en: { light: 'Deets-English-Thin', medium: 'Deets-English-Medium' }
      },
      'ec': {
        ar: { light: 'EC-Arabic-Light', medium: 'EC-Arabic-Medium' },
        en: { light: 'EC-English-Light', medium: 'EC-English-Medium' }
      },
      'naqash': {
        ar: { light: 'Naqash-Arabic-Regular', medium: 'Naqash-Arabic-Bold' },
        en: { light: 'Naqash-English-Regular', medium: 'Naqash-English-Medium' }
      },
      'pe': {
        ar: { light: 'PE-Arabic-Light', medium: 'PE-Arabic-Medium' },
        en: { light: 'PE-English-Light', medium: 'PE-English-Medium' }
      }
    };
    
    var langKey = lang === 'ar' ? 'ar' : 'en';
    var weightKey = weight === 'light' ? 'light' : 'medium';
    
    if (fontMap[companyId] && fontMap[companyId][langKey] && fontMap[companyId][langKey][weightKey]) {
      return fontMap[companyId][langKey][weightKey];
    }
    
    // Fallback to system fonts
    return 'Arial, sans-serif';
  }

  // Load fonts explicitly for canvas rendering
  var loadedFonts = {};
  function loadFontsForCompany(companyId, lang) {
    if (!companyId || !window.FontFace) return Promise.resolve();
    
    var msgFontFamily = getCompanyFont(companyId, lang, 'light');
    var nameFontFamily = getCompanyFont(companyId, lang, 'medium');
    var msgFontPath = getFontPath(companyId, lang, 'light');
    var nameFontPath = getFontPath(companyId, lang, 'medium');
    
    var promises = [];
    
    // Load message font if not already loaded
    if (msgFontPath && !loadedFonts[msgFontFamily]) {
      try {
        var msgFont = new FontFace(msgFontFamily, 'url(' + msgFontPath + ')');
        promises.push(msgFont.load().then(function(loadedFont) {
          document.fonts.add(loadedFont);
          loadedFonts[msgFontFamily] = true;
        }).catch(function(err) {
          console.warn('Failed to load font:', msgFontFamily, err);
        }));
      } catch (e) {
        console.warn('FontFace not supported or error:', e);
      }
    }
    
    // Load name font if not already loaded
    if (nameFontPath && !loadedFonts[nameFontFamily]) {
      try {
        var nameFont = new FontFace(nameFontFamily, 'url(' + nameFontPath + ')');
        promises.push(nameFont.load().then(function(loadedFont) {
          document.fonts.add(loadedFont);
          loadedFonts[nameFontFamily] = true;
        }).catch(function(err) {
          console.warn('Failed to load font:', nameFontFamily, err);
        }));
      } catch (e) {
        console.warn('FontFace not supported or error:', e);
      }
    }
    
    return Promise.all(promises).catch(function() {
      // Continue even if fonts fail to load
    });
  }

  function drawCard(context, forDownload) {
    if (!cardImage) return;
    // Check if image is loaded - either complete flag or has natural dimensions
    if (!cardImage.complete && cardImage.naturalWidth === 0) {
      return;
    }
    
    // Ensure canvas dimensions match (only set if different to avoid context reset)
    if (canvas.width !== imageWidth || canvas.height !== imageHeight) {
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      // Re-enable image smoothing after dimension change
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }
    
    context.clearRect(0, 0, imageWidth, imageHeight);
    // Draw image at exact canvas dimensions to prevent scaling artifacts
    try {
      context.drawImage(cardImage, 0, 0, imageWidth, imageHeight);
    } catch (e) {
      // Silently fail - image might not be ready
      return;
    }

    var messageText = getMessageText();
    var nameText = getName();

    // Reset all text properties after any canvas dimension changes
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic'; // Use default baseline for proper rendering
    // Use white text color for all companies
    context.fillStyle = '#FFFFFF';

    // Message: smaller font, possibly multi-line - use lighter font
    var is6degrees = companyId === '6degrees';
    var isNaqash = companyId === 'naqash';
    var isPE = companyId === 'pe';
    // Use company-specific fonts
    var msgFontFamily = getCompanyFont(companyId, lang, 'light');
    // Use same font size as naqash
    var msgFontSize = (is6degrees || isNaqash) ? '32pt' : '32pt'; // Same as naqash
    // Build font string - format: "size fontFamily" (using pt like naqash)
    var msgFont = msgFontSize + ' ' + msgFontFamily;
    // Set font - must be done after any canvas dimension changes
    context.font = msgFont;
    var maxMsgWidth = imageWidth - 120;
    var msgLines = wrapText(context, messageText, maxMsgWidth);
    // Lower positions for naqash and 6degrees cards - much lower near bottom
    var isDeets = companyId === 'deets';
    var isBuroojAir = companyId === 'buroojair';
    var isEC = companyId === 'ec';
    var msgY;
    if (isNaqash || isPE) {
      msgY = 1500; // Same position for naqash and PE
    } else if (is6degrees) {
      msgY = 1550; // Move message down a little for 6degrees
    } else if (isDeets) {
      msgY = 1400; // Move message up more for deets
    } else if (isEC) {
      msgY = 800; // Move message down a little for EC
    } else {
      msgY = 720;
    }
    // Use same line height as naqash
    var lineHeight = (is6degrees || isNaqash) ? 48 : 48; // Same as naqash
    msgLines.forEach(function(line, i) {
      context.fillText(line, imageWidth / 2, msgY + i * lineHeight);
    });

    // Name: below message - use heavier/bolder font
    // Use company-specific fonts
    var nameFontFamily = getCompanyFont(companyId, lang, 'medium');
    // Use same font size as naqash
    var nameFontSize = (is6degrees || isNaqash) ? '40pt' : '40pt'; // Same as naqash
    // Build font string - format: "size fontFamily" (using pt like naqash)
    var nameFont = nameFontSize + ' ' + nameFontFamily;
    // Set font - must be done after any canvas dimension changes
    context.font = nameFont;
    var nameY;
    if (isNaqash || isPE) {
      nameY = 1650; // Same position for naqash and PE
    } else if (is6degrees) {
      nameY = 1700; // Move name down a little for 6degrees
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
    // Always render, but try to wait for fonts if available
    if (!cardImage) {
      return;
    }
    // Check if image is complete or has natural dimensions (loaded)
    if (!cardImage.complete && cardImage.naturalWidth === 0) {
      // Image still loading, wait a bit
      setTimeout(function() {
        renderPreview();
      }, 100);
      return;
    }
    
    // Check if fonts are loaded before rendering
    function renderWithFonts() {
      if (document.fonts && document.fonts.check) {
        // Get the font families we need for this company
        var msgFontFamily = getCompanyFont(companyId, lang, 'light');
        var nameFontFamily = getCompanyFont(companyId, lang, 'medium');
        
        // Check if fonts are loaded (using a simple size check)
        try {
          var msgFontLoaded = document.fonts.check('12px ' + msgFontFamily);
          var nameFontLoaded = document.fonts.check('12px ' + nameFontFamily);
          
          // If fonts are loaded, render immediately
          if (msgFontLoaded && nameFontLoaded) {
            drawCard(ctx, false);
            return;
          }
        } catch (e) {
          // If check fails, proceed with rendering anyway
        }
      }
      
      // Render immediately (fonts may load later)
      drawCard(ctx, false);
      
      // Re-render when fonts are ready
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() {
          setTimeout(function() {
            drawCard(ctx, false);
          }, 200);
        }).catch(function() {
          // Ignore font loading errors
        });
      }
    }
    
    renderWithFonts();
  }

  function loadImage(src, callback) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() { 
      callback(null, img); 
    };
    img.onerror = function() { 
      callback(new Error('Failed to load image: ' + src)); 
    };
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
    if (!companyImageSrc) {
      showImageError(true);
      return;
    }
    
    // Load fonts first, then load image
    loadFontsForCompany(companyId, lang).then(function() {
      loadImage(companyImageSrc, function(err, img) {
        if (err || !img) {
          showImageError(true);
          return;
        }
        cardImage = img;
        
        // Wait for fonts to be ready before rendering
        function renderWhenReady() {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function() {
              // Small delay to ensure fonts are fully loaded
              setTimeout(function() {
                if (img.complete) {
                  renderPreview();
                } else {
                  img.onload = function() {
                    renderPreview();
                  };
                  setTimeout(function() {
                    renderPreview();
                  }, 500);
                }
              }, 200);
            }).catch(function() {
              // If fonts.ready fails, render anyway
              if (img.complete) {
                renderPreview();
              } else {
                img.onload = function() {
                  renderPreview();
                };
                setTimeout(function() {
                  renderPreview();
                }, 500);
              }
            });
          } else {
            // No font API, render immediately
            if (img.complete) {
              renderPreview();
            } else {
              img.onload = function() {
                renderPreview();
              };
              setTimeout(function() {
                renderPreview();
              }, 500);
            }
          }
        }
        
        renderWhenReady();
      });
    }).catch(function() {
      // If font loading fails, proceed anyway
      loadImage(companyImageSrc, function(err, img) {
        if (err || !img) {
          showImageError(true);
          return;
        }
        cardImage = img;
        if (img.complete) {
          renderPreview();
        } else {
          img.onload = function() {
            renderPreview();
          };
          setTimeout(function() {
            renderPreview();
          }, 500);
        }
      });
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
    
    // Download immediately - fonts will be used if available
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
    
    // Optionally re-download when fonts are ready (non-blocking)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function() {
        setTimeout(function() {
          drawCard(ctx, true);
          canvas.toBlob(function(blob) {
            if (blob) {
              var link2 = document.createElement('a');
              link2.download = fileName;
              link2.href = URL.createObjectURL(blob);
              link2.click();
              URL.revokeObjectURL(link2.href);
            }
          }, 'image/png');
        }, 100);
      }).catch(function() {
        // Ignore font loading errors
      });
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
      lang = sessionStorage.getItem('card-lang') || 'ar';
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
