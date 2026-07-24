/* ============================================
   SendInvite - script.js (Premium Edition)
   ============================================ */
(function () {
  'use strict';

  var state = {
    category: 'birthday',
    templateIndex: 0,
    eventName: '',
    hostName: '',
    eventDate: '',
    eventVenue: '',
    eventMessage: '',
  };

  var customState = {
    bgColor: '#6C63FF',
    bgImage: null,
    heading: 'You\'re Invited!',
    font: 'Playfair Display',
    fontColor: '#FFFFFF',
    fontSize: 42,
    date: '',
    venue: '',
    desc: '',
    descColor: '#E0E0E0',
  };

  /* --- Seeded Random --- */
  function seededRandom(seed) {
    var s = seed;
    return function () {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /* --- Drawing Helpers --- */
  function drawStar(ctx, cx, cy, innerR, outerR, points) {
    var angle = Math.PI / points;
    ctx.beginPath();
    for (var i = 0; i < 2 * points; i++) {
      var r = i % 2 === 0 ? outerR : innerR;
      var x = cx + r * Math.sin(i * angle);
      var y = cy - r * Math.cos(i * angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawHeart(ctx, cx, cy, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha || 0.5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy + size / 4);
    ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + size / 4);
    ctx.bezierCurveTo(cx - size / 2, cy + size / 2, cx, cy + size * 0.7, cx, cy + size);
    ctx.bezierCurveTo(cx, cy + size * 0.7, cx + size / 2, cy + size / 2, cx + size / 2, cy + size / 4);
    ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + size / 4);
    ctx.fill();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function roundRectStroke(ctx, x, y, w, h, r) {
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
  }

  function drawOrnateFrame(ctx, w, h, m1, m2, color, alpha) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha || 0.4;
    ctx.lineWidth = 1.5;
    roundRectStroke(ctx, m1, m1, w - m1 * 2, h - m1 * 2, 4);
    ctx.lineWidth = 0.8;
    roundRectStroke(ctx, m2, m2, w - m2 * 2, h - m2 * 2, 2);
    ctx.restore();
  }

  function drawCornerOrnaments(ctx, w, h, m, color, alpha) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha || 0.35;
    ctx.lineWidth = 1.5;
    var s = 18;
    var corners = [
      { x: m, y: m, sx: 1, sy: 1 },
      { x: w - m, y: m, sx: -1, sy: 1 },
      { x: m, y: h - m, sx: 1, sy: -1 },
      { x: w - m, y: h - m, sx: -1, sy: -1 },
    ];
    corners.forEach(function (c) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.sx, c.sy);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 0.6, s * 0.1, s * 0.8, s * 0.4, s, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 0.1, s * 0.6, s * 0.4, s * 0.8, s, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.45, s * 0.45, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawDiamondDivider(ctx, cx, y, halfW, color, alpha) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha || 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, y);
    ctx.lineTo(cx - 8, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, y);
    ctx.lineTo(cx + halfW, y);
    ctx.stroke();
    ctx.globalAlpha = (alpha || 0.4) + 0.1;
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
    ctx.restore();
  }

  /* --- Divider: Dots --- */
  function drawDotsDivider(ctx, cx, y, halfW, color, alpha) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha || 0.4;
    ctx.beginPath(); ctx.moveTo(cx - halfW, y); ctx.lineTo(cx - 6, y); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 6, y); ctx.lineTo(cx + halfW, y); ctx.stroke();
    for (var d = -2; d <= 2; d++) {
      ctx.beginPath(); ctx.arc(cx + d * 6, y + (d % 2 === 0 ? 0 : -3), 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* --- Divider: Stars --- */
  function drawStarsDivider(ctx, cx, y, halfW, color, alpha) {
    ctx.save();
    ctx.fillStyle = color; ctx.strokeStyle = color;
    ctx.globalAlpha = alpha || 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - halfW, y); ctx.lineTo(cx - 14, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 14, y); ctx.lineTo(cx + halfW, y); ctx.stroke();
    ctx.save(); ctx.translate(cx - 8, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-2.5, -2.5, 5, 5); ctx.restore();
    ctx.save(); ctx.translate(cx, y); drawStar(ctx, cx - cx + 0, y - y, 2, 5, 5); ctx.restore();
    ctx.save(); ctx.translate(cx + 8, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-2.5, -2.5, 5, 5); ctx.restore();
    ctx.restore();
  }

  /* --- Divider: Hearts --- */
  function drawHeartsDivider(ctx, cx, y, halfW, color, alpha) {
    ctx.save();
    ctx.fillStyle = color; ctx.strokeStyle = color;
    ctx.globalAlpha = alpha || 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - halfW, y); ctx.lineTo(cx - 14, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 14, y); ctx.lineTo(cx + halfW, y); ctx.stroke();
    drawHeart(ctx, cx, y - 1, 6, color, alpha || 0.4);
    ctx.restore();
  }

  /* --- Divider: Wave --- */
  function drawWaveDivider(ctx, cx, y, halfW, color, alpha) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    ctx.globalAlpha = alpha || 0.4;
    ctx.beginPath();
    for (var i = -halfW; i <= halfW; i += 2) {
      var py = y + Math.sin((i / halfW) * Math.PI * 3) * 5;
      if (i === -halfW) ctx.moveTo(cx + i, py); else ctx.lineTo(cx + i, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* --- Divider: Line (minimal) --- */
  function drawLineDivider(ctx, cx, y, halfW, color, alpha) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.globalAlpha = alpha || 0.3;
    ctx.beginPath(); ctx.moveTo(cx - halfW, y); ctx.lineTo(cx + halfW, y); ctx.stroke();
    ctx.restore();
  }

  function drawFlourishDivider(ctx, cx, y, halfW, color, alpha) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha || 0.35;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, y);
    ctx.bezierCurveTo(cx - halfW * 0.5, y - 10, cx - halfW * 0.2, y + 10, cx - 6, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + halfW, y);
    ctx.bezierCurveTo(cx + halfW * 0.5, y - 10, cx + halfW * 0.2, y + 10, cx + 6, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCrescentMoon(ctx, cx, cy, r, color, bgColor) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(cx + r * 0.35, cy - r * 0.15, r * 0.82, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawDiya(ctx, cx, cy, scale, colors) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    var glow = ctx.createRadialGradient(0, -12, 2, 0, -12, 30);
    glow.addColorStop(0, colors.glowInner);
    glow.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-30, -42, 60, 60);
    ctx.fillStyle = colors.flameOuter;
    ctx.beginPath();
    ctx.ellipse(0, -12, 5, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.flameInner;
    ctx.beginPath();
    ctx.ellipse(0, -10, 3, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.body;
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.rim;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLocationPin(ctx, cx, cy, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.35, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.45, cy - size * 0.15);
    ctx.lineTo(cx, cy + size * 0.55);
    ctx.lineTo(cx + size * 0.45, cy - size * 0.15);
    ctx.fill();
    ctx.fillStyle = ctx.canvas.backgroundColor || '#1a1c29';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.35, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var lines = 0;
    for (var i = 0; i < words.length; i++) {
      var testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, y);
        line = words[i] + ' ';
        y += lineHeight;
        lines++;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, y);
    lines++;
    return { lines: lines, endY: y + lineHeight };
  }

  function measureWrappedText(ctx, text, maxWidth, fontSize) {
    var words = text.split(' ');
    var line = '';
    var count = 1;
    for (var i = 0; i < words.length; i++) {
      var testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        line = words[i] + ' ';
        count++;
      } else {
        line = testLine;
      }
    }
    return count * fontSize * 1.4;
  }

  function fitFontSize(ctx, text, maxWidth, minSize, maxSize, fontPostfix) {
    var size = maxSize;
    while (size > minSize) {
      ctx.font = size + 'px ' + (fontPostfix || '');
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    return size;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  /* ==========================================
     BACKGROUND IMAGES - Loaded from Unsplash
     ========================================== */
  var BG_IMAGES = {};
  var bgImagesLoaded = 0;
  var bgImagesTotal = 0;
  var bgImagesReady = false;

  function loadBgImage(key, url) {
    bgImagesTotal++;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      BG_IMAGES[key] = img;
      bgImagesLoaded++;
      if (bgImagesLoaded >= bgImagesTotal) {
        bgImagesReady = true;
        renderTemplateThumbnails();
        renderTemplateCard();
      }
    };
    img.onerror = function () {
      bgImagesLoaded++;
      if (bgImagesLoaded >= bgImagesTotal) {
        bgImagesReady = true;
        renderTemplateThumbnails();
        renderTemplateCard();
      }
    };
    img.src = url;
  }

  /* Helper: draw image as cover-fit on canvas */
  function drawCoverImage(ctx, img, w, h) {
    var iw = img.width, ih = img.height;
    var ir = iw / ih, cr = w / h;
    var dw, dh, dx, dy;
    if (ir > cr) { dh = h; dw = h * ir; dx = (w - dw) / 2; dy = 0; }
    else { dw = w; dh = w / ir; dx = 0; dy = (h - dh) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* Helper: draw cover image + overlay + ornaments */
  function drawImageBg(ctx, img, w, h, overlayColor) {
    if (img) {
      drawCoverImage(ctx, img, w, h);
    }
    ctx.fillStyle = overlayColor || 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, w, h);
  }

  /* Load all 60 template background images */
  /* Birthday */
  loadBgImage('birthday_0', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80');
  loadBgImage('birthday_1', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&q=80');
  loadBgImage('birthday_2', 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=1200&q=80');
  loadBgImage('birthday_3', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80');
  loadBgImage('birthday_4', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80');
  loadBgImage('birthday_5', 'https://images.unsplash.com/photo-1464349153735-7db50ed83c22?w=1200&q=80');
  /* Wedding */
  loadBgImage('wedding_0', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80');
  loadBgImage('wedding_1', 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80');
  loadBgImage('wedding_2', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&q=80');
  loadBgImage('wedding_3', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80');
  loadBgImage('wedding_4', 'https://images.unsplash.com/photo-1505937723767-3d51c615dad8?w=1200&q=80');
  loadBgImage('wedding_5', 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=1200&q=80');
  /* Party */
  loadBgImage('party_0', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80');
  loadBgImage('party_1', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80');
  loadBgImage('party_2', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80');
  loadBgImage('party_3', 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=1200&q=80');
  loadBgImage('party_4', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&q=80');
  loadBgImage('party_5', 'https://images.unsplash.com/photo-1519543504908-630e29224ab2?w=1200&q=80');
  /* Formal */
  loadBgImage('formal_0', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80');
  loadBgImage('formal_1', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80');
  loadBgImage('formal_2', 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=1200&q=80');
  loadBgImage('formal_3', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80');
  loadBgImage('formal_4', 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1200&q=80');
  loadBgImage('formal_5', 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=1200&q=80');
  /* Festival */
  loadBgImage('festival_0', 'https://images.unsplash.com/photo-1561715385-a1596d8b77b5?w=1200&q=80');
  loadBgImage('festival_1', 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=1200&q=80');
  loadBgImage('festival_2', 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=1200&q=80');
  loadBgImage('festival_3', 'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?w=1200&q=80');
  loadBgImage('festival_4', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&q=80');
  loadBgImage('festival_5', 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=1200&q=80');
  /* Baby Shower */
  loadBgImage('babyshower_0', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&q=80');
  loadBgImage('babyshower_1', 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=1200&q=80');
  loadBgImage('babyshower_2', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200&q=80');
  loadBgImage('babyshower_3', 'https://images.unsplash.com/photo-1522771930-78957f8b3f3b?w=1200&q=80');
  loadBgImage('babyshower_4', 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=1200&q=80');
  loadBgImage('babyshower_5', 'https://images.unsplash.com/photo-1590691566903-692bf5ca7493?w=1200&q=80');
  /* Graduation */
  loadBgImage('graduation_0', 'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?w=1200&q=80');
  loadBgImage('graduation_1', 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1200&q=80');
  loadBgImage('graduation_2', 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80');
  loadBgImage('graduation_3', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80');
  loadBgImage('graduation_4', 'https://images.unsplash.com/photo-1564585222527-c2777e5bc031?w=1200&q=80');
  loadBgImage('graduation_5', 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&q=80');
  /* Anniversary */
  loadBgImage('anniversary_0', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&q=80');
  loadBgImage('anniversary_1', 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=1200&q=80');
  loadBgImage('anniversary_2', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80');
  loadBgImage('anniversary_3', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80');
  loadBgImage('anniversary_4', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200&q=80');
  loadBgImage('anniversary_5', 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80');
  /* Business */
  loadBgImage('business_0', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80');
  loadBgImage('business_1', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80');
  loadBgImage('business_2', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80');
  loadBgImage('business_3', 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80');
  loadBgImage('business_4', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80');
  loadBgImage('business_5', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80');
  /* Housewarming */
  loadBgImage('housewarming_0', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80');
  loadBgImage('housewarming_1', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80');
  loadBgImage('housewarming_2', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80');
  loadBgImage('housewarming_3', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&q=80');
  loadBgImage('housewarming_4', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80');
  loadBgImage('housewarming_5', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80');

  /* ==========================================
     PREMIUM TEMPLATES (30 total)
     Each draw() renders bg image + overlay + ornate frame
     ========================================== */
  var TEMPLATES = {

    birthday: [
      { name: 'Royal Confetti', design: { headingFont: '"Playfair Display", serif', bodyFont: '"Montserrat", sans-serif', messageFont: 'italic "Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(0,0,0,0.35)', shadowBlur: 8, panelRadius: 16, panelTint: 0.3, textTransform: 'none', headingMax: 52, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['birthday_0'], w, h, 'rgba(76,29,149,0.35)');
        drawOrnateFrame(ctx, w, h, 22, 30, '#d4a853', 0.5);
        drawCornerOrnaments(ctx, w, h, 22, '#d4a853', 0.45);
        ctx.globalAlpha = 1;
      }},
      { name: 'Midnight Gold', design: { headingFont: '"Cinzel", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: '700', divider: 'dots', shadowColor: 'rgba(212,168,83,0.5)', shadowBlur: 10, panelRadius: 12, panelTint: 0.25, textTransform: 'uppercase', headingMax: 48, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['birthday_1'], w, h, 'rgba(15,15,45,0.5)');
        var rng = seededRandom(77);
        ctx.fillStyle = '#d4a853';
        for (var i = 0; i < 30; i++) {
          ctx.globalAlpha = 0.06 + rng() * 0.12;
          drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 3, 4);
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 20, 28, '#d4a853', 0.5);
        drawCornerOrnaments(ctx, w, h, 20, '#d4a853', 0.4);
        ctx.globalAlpha = 1;
      }},
      { name: 'Pastel Dreams', design: { headingFont: '"Dancing Script", cursive', bodyFont: '"Poppins", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: '700', divider: 'line', shadowColor: 'rgba(180,120,160,0.3)', shadowBlur: 6, panelRadius: 20, panelTint: 0.15, textTransform: 'none', headingMax: 56, bodyAlpha: 0.8 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['birthday_2'], w, h, 'rgba(253,242,248,0.25)');
        var rng = seededRandom(123);
        var pastel = ['#f9a8d4','#c4b5fd','#93c5fd','#86efac','#fcd34d','#fdba74'];
        for (var j = 0; j < 30; j++) {
          ctx.fillStyle = pastel[Math.floor(rng() * pastel.length)];
          ctx.globalAlpha = 0.2 + rng() * 0.25;
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 2 + rng() * 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
        roundRectStroke(ctx, 24, 24, w - 48, h - 48, 6); ctx.globalAlpha = 1;
      }},
      { name: 'Neon Burst', design: { headingFont: '"Orbitron", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'wave', shadowColor: 'rgba(131,56,236,0.5)', shadowBlur: 14, panelRadius: 8, panelTint: 0.35, textTransform: 'uppercase', headingMax: 44, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['birthday_3'], w, h, 'rgba(10,10,30,0.55)');
        var neon = ['#ff006e','#00f5d4','#fee440','#8338ec'];
        var rng = seededRandom(301);
        for (var i = 0; i < 6; i++) {
          ctx.strokeStyle = neon[i % neon.length]; ctx.lineWidth = 2; ctx.globalAlpha = 0.2;
          ctx.shadowColor = neon[i % neon.length]; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 20 + rng() * 40, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#8338ec', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Candy Pop', design: { headingFont: '"Pacifico", cursive', bodyFont: '"Poppins", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'stars', shadowColor: 'rgba(255,107,107,0.35)', shadowBlur: 8, panelRadius: 24, panelTint: 0.2, textTransform: 'none', headingMax: 50, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['birthday_4'], w, h, 'rgba(255,182,193,0.3)');
        var rng = seededRandom(405);
        var colors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd'];
        for (var i = 0; i < 40; i++) {
          ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
          ctx.globalAlpha = 0.15 + rng() * 0.2;
          var sz = 2 + rng() * 6;
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, sz, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.25;
        roundRectStroke(ctx, 20, 20, w - 40, h - 40, 8); ctx.globalAlpha = 1;
      }},
      { name: 'Champagne Toast', design: { headingFont: '"Great Vibes", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'flourish', shadowColor: 'rgba(251,191,36,0.4)', shadowBlur: 10, panelRadius: 14, panelTint: 0.28, textTransform: 'none', headingMax: 58, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['birthday_5'], w, h, 'rgba(45,27,78,0.45)');
        var rng = seededRandom(510);
        ctx.fillStyle = '#fbbf24';
        for (var i = 0; i < 25; i++) {
          ctx.globalAlpha = 0.08 + rng() * 0.15;
          drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 4, 5);
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 20, 28, '#fbbf24', 0.4);
        drawCornerOrnaments(ctx, w, h, 20, '#fbbf24', 0.35);
        ctx.globalAlpha = 1;
      }},
    ],

    wedding: [
      { name: 'Romantic Rose', design: { headingFont: '"Great Vibes", cursive', bodyFont: '"Cormorant Garamond", serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'hearts', shadowColor: 'rgba(194,132,110,0.35)', shadowBlur: 8, panelRadius: 12, panelTint: 0.2, textTransform: 'none', headingMax: 60, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['wedding_0'], w, h, 'rgba(253,242,248,0.3)');
        drawFlourishDivider(ctx, w / 2, 50, w * 0.15, '#c2846e', 0.3);
        drawOrnateFrame(ctx, w, h, 22, 30, '#c2846e', 0.35);
        drawCornerOrnaments(ctx, w, h, 22, '#c2846e', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Classic Gold', design: { headingFont: '"Cinzel", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(201,168,76,0.4)', shadowBlur: 10, panelRadius: 10, panelTint: 0.22, textTransform: 'uppercase', headingMax: 46, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['wedding_1'], w, h, 'rgba(10,10,30,0.45)');
        drawOrnateFrame(ctx, w, h, 20, 28, '#c9a84c', 0.5);
        drawCornerOrnaments(ctx, w, h, 20, '#c9a84c', 0.45);
        ctx.globalAlpha = 0.35;
        drawHeart(ctx, w / 2, 56, 12, '#c9a84c', 0.35);
        drawHeart(ctx, w / 2, h - 68, 12, '#c9a84c', 0.35);
        ctx.globalAlpha = 1;
      }},
      { name: 'Soft Floral', design: { headingFont: '"Dancing Script", cursive', bodyFont: '"Poppins", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: '700', divider: 'line', shadowColor: 'rgba(184,134,11,0.3)', shadowBlur: 6, panelRadius: 18, panelTint: 0.12, textTransform: 'none', headingMax: 54, bodyAlpha: 0.8 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['wedding_2'], w, h, 'rgba(255,253,247,0.2)');
        ctx.strokeStyle = '#b8860b'; ctx.globalAlpha = 0.25; ctx.lineWidth = 1.5;
        roundRectStroke(ctx, 24, 24, w - 48, h - 48, 5); ctx.globalAlpha = 1;
      }},
      { name: 'Garden Party', design: { headingFont: '"Cormorant Garamond", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(34,197,94,0.3)', shadowBlur: 8, panelRadius: 14, panelTint: 0.2, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['wedding_3'], w, h, 'rgba(22,78,40,0.3)');
        var rng = seededRandom(601);
        ctx.fillStyle = '#86efac'; ctx.globalAlpha = 0.08;
        for (var i = 0; i < 20; i++) {
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 3 + rng() * 6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 22, 30, '#22c55e', 0.3);
        drawCornerOrnaments(ctx, w, h, 22, '#22c55e', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'Lace & Pearls', design: { headingFont: '"Playfair Display", serif', bodyFont: '"Cormorant Garamond", serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'dots', shadowColor: 'rgba(212,168,83,0.3)', shadowBlur: 6, panelRadius: 6, panelTint: 0.15, textTransform: 'none', headingMax: 48, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['wedding_4'], w, h, 'rgba(255,253,245,0.25)');
        var rng = seededRandom(650);
        ctx.fillStyle = '#fef3c7'; ctx.globalAlpha = 0.12;
        for (var i = 0; i < 30; i++) {
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 1.5 + rng() * 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#d4a853'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.3;
        roundRectStroke(ctx, 22, 22, w - 44, h - 44, 4); ctx.globalAlpha = 1;
      }},
      { name: 'Sunset Vow', design: { headingFont: '"Italiana", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'hearts', shadowColor: 'rgba(234,88,12,0.35)', shadowBlur: 8, panelRadius: 12, panelTint: 0.22, textTransform: 'uppercase', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['wedding_5'], w, h, 'rgba(180,83,9,0.3)');
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(251,191,36,0.12)');
        grad.addColorStop(0.5, 'rgba(234,88,12,0.08)');
        grad.addColorStop(1, 'rgba(154,52,18,0.15)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
        drawOrnateFrame(ctx, w, h, 20, 28, '#fbbf24', 0.35);
        drawCornerOrnaments(ctx, w, h, 20, '#fbbf24', 0.3);
        ctx.globalAlpha = 1;
      }},
    ],

    party: [
      { name: 'Electric Neon', design: { headingFont: '"Orbitron", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'wave', shadowColor: 'rgba(0,245,212,0.45)', shadowBlur: 14, panelRadius: 6, panelTint: 0.4, textTransform: 'uppercase', headingMax: 44, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['party_0'], w, h, 'rgba(10,10,20,0.4)');
        var neonColors = ['#ff006e', '#00f5d4', '#fee440', '#8338ec', '#fb5607'];
        var rng = seededRandom(201);
        for (var i = 0; i < 5; i++) {
          ctx.strokeStyle = neonColors[i]; ctx.lineWidth = 2; ctx.globalAlpha = 0.25;
          ctx.shadowColor = neonColors[i]; ctx.shadowBlur = 18;
          ctx.beginPath();
          var y1 = 40 + rng() * (h - 80), y2 = 40 + rng() * (h - 80);
          ctx.moveTo(-10, y1);
          ctx.bezierCurveTo(w * 0.25, y1 + (rng() - 0.5) * 80, w * 0.75, y2 + (rng() - 0.5) * 80, w + 10, y2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        ctx.strokeStyle = '#8338ec'; ctx.lineWidth = 2; ctx.globalAlpha = 0.2;
        ctx.shadowColor = '#8338ec'; ctx.shadowBlur = 10;
        roundRectStroke(ctx, 16, 16, w - 32, h - 32, 6);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }},
      { name: 'Retro Sunrise', design: { headingFont: '"Bebas Neue", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'line', shadowColor: 'rgba(255,107,53,0.35)', shadowBlur: 8, panelRadius: 4, panelTint: 0.3, textTransform: 'uppercase', headingMax: 52, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['party_1'], w, h, 'rgba(255,107,53,0.2)');
        ctx.save(); ctx.translate(w / 2, h / 2); ctx.globalAlpha = 0.1; ctx.fillStyle = '#fff';
        for (var i = 0; i < 36; i++) {
          ctx.save(); ctx.rotate((i * Math.PI * 2) / 36);
          ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(12, -w * 0.55); ctx.lineTo(-12, -w * 0.55);
          ctx.closePath(); ctx.fill(); ctx.restore();
        }
        ctx.restore(); ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.2; ctx.lineWidth = 2;
        roundRectStroke(ctx, 20, 20, w - 40, h - 40, 4); ctx.globalAlpha = 1;
      }},
      { name: 'Tropical Night', design: { headingFont: '"Pacifico", cursive', bodyFont: '"Poppins", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'dots', shadowColor: 'rgba(212,168,83,0.3)', shadowBlur: 8, panelRadius: 10, panelTint: 0.25, textTransform: 'none', headingMax: 52, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['party_2'], w, h, 'rgba(6,78,59,0.35)');
        drawOrnateFrame(ctx, w, h, 20, 28, '#d4a853', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'Disco Fever', design: { headingFont: '"Orbitron", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'stars', shadowColor: 'rgba(255,0,110,0.4)', shadowBlur: 12, panelRadius: 6, panelTint: 0.38, textTransform: 'uppercase', headingMax: 42, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['party_3'], w, h, 'rgba(30,10,60,0.5)');
        var rng = seededRandom(701);
        var disco = ['#ff006e','#00f5d4','#fee440','#8338ec','#fb5607','#3a86ff'];
        for (var i = 0; i < 50; i++) {
          ctx.fillStyle = disco[Math.floor(rng() * disco.length)];
          ctx.globalAlpha = 0.06 + rng() * 0.1;
          var sz = 1 + rng() * 4;
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, sz, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ff006e'; ctx.lineWidth = 2; ctx.globalAlpha = 0.2;
        ctx.shadowColor = '#ff006e'; ctx.shadowBlur = 12;
        roundRectStroke(ctx, 18, 18, w - 36, h - 36, 6);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }},
      { name: 'Cocktail Hour', design: { headingFont: '"Dancing Script", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: '700', divider: 'hearts', shadowColor: 'rgba(251,191,36,0.35)', shadowBlur: 8, panelRadius: 14, panelTint: 0.25, textTransform: 'none', headingMax: 56, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['party_4'], w, h, 'rgba(30,20,50,0.4)');
        var rng = seededRandom(750);
        ctx.fillStyle = '#fbbf24'; ctx.globalAlpha = 0.1;
        for (var i = 0; i < 15; i++) {
          drawStar(ctx, rng() * w, rng() * h, 1, 3 + rng() * 5, 5);
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 20, 28, '#fbbf24', 0.3);
        drawCornerOrnaments(ctx, w, h, 20, '#fbbf24', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'Rooftop Bash', design: { headingFont: '"Bebas Neue", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'wave', shadowColor: 'rgba(56,189,248,0.4)', shadowBlur: 10, panelRadius: 8, panelTint: 0.3, textTransform: 'uppercase', headingMax: 54, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['party_5'], w, h, 'rgba(15,23,42,0.45)');
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(56,189,248,0.08)');
        grad.addColorStop(0.5, 'rgba(139,92,246,0.06)');
        grad.addColorStop(1, 'rgba(244,63,94,0.1)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
        drawOrnateFrame(ctx, w, h, 18, 26, '#38bdf8', 0.3);
        ctx.globalAlpha = 1;
      }},
    ],

    formal: [
      { name: 'Black Tie', design: { headingFont: '"Cinzel", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 8, panelRadius: 10, panelTint: 0.3, textTransform: 'uppercase', headingMax: 46, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['formal_0'], w, h, 'rgba(17,24,39,0.45)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#9ca3af', 0.4);
        ctx.fillStyle = '#9ca3af'; ctx.globalAlpha = 0.35;
        [[26,26],[w-26,26],[26,h-26],[w-26,h-26]].forEach(function(c) {
          ctx.save(); ctx.translate(c[0],c[1]); ctx.rotate(Math.PI/4); ctx.fillRect(-3.5,-3.5,7,7); ctx.restore();
        });
        ctx.globalAlpha = 1;
      }},
      { name: 'Ivory Elegance', design: { headingFont: '"Cormorant Garamond", serif', bodyFont: '"Cormorant Garamond", serif', messageFont: '"Poppins", sans-serif', headingWeight: '600', divider: 'flourish', shadowColor: 'rgba(120,53,15,0.25)', shadowBlur: 6, panelRadius: 8, panelTint: 0.12, textTransform: 'none', headingMax: 50, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['formal_1'], w, h, 'rgba(255,253,245,0.2)');
        drawOrnateFrame(ctx, w, h, 24, 32, '#78350f', 0.3);
        drawCornerOrnaments(ctx, w, h, 24, '#78350f', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Royal Navy', design: { headingFont: '"Cinzel", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'diamond', shadowColor: 'rgba(212,168,83,0.4)', shadowBlur: 10, panelRadius: 12, panelTint: 0.28, textTransform: 'uppercase', headingMax: 44, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['formal_2'], w, h, 'rgba(12,31,56,0.4)');
        drawOrnateFrame(ctx, w, h, 20, 28, '#d4a853', 0.35);
        drawCornerOrnaments(ctx, w, h, 20, '#d4a853', 0.3);
        ctx.fillStyle = '#d4a853'; ctx.globalAlpha = 0.2; ctx.save();
        ctx.translate(w / 2, 40); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore();
        ctx.globalAlpha = 1;
      }},
      { name: 'Crystal Chandelier', design: { headingFont: '"Playfair Display", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'dots', shadowColor: 'rgba(199,210,254,0.35)', shadowBlur: 10, panelRadius: 14, panelTint: 0.25, textTransform: 'none', headingMax: 50, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['formal_3'], w, h, 'rgba(20,20,40,0.4)');
        var rng = seededRandom(801);
        ctx.fillStyle = '#e0e7ff'; ctx.globalAlpha = 0.08;
        for (var i = 0; i < 35; i++) {
          var sz = 1 + rng() * 3;
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, sz, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 22, 30, '#c7d2fe', 0.35);
        drawCornerOrnaments(ctx, w, h, 22, '#c7d2fe', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Wine & Dine', design: { headingFont: '"Cormorant Garamond", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: '600', divider: 'hearts', shadowColor: 'rgba(220,38,38,0.25)', shadowBlur: 8, panelRadius: 10, panelTint: 0.25, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['formal_4'], w, h, 'rgba(80,20,20,0.4)');
        var rng = seededRandom(850);
        ctx.fillStyle = '#fecaca'; ctx.globalAlpha = 0.06;
        for (var i = 0; i < 20; i++) {
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 2 + rng() * 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 20, 28, '#fca5a5', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Monochrome', design: { headingFont: '"Cinzel", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Montserrat", sans-serif', headingWeight: 'bold', divider: 'line', shadowColor: 'rgba(0,0,0,0.35)', shadowBlur: 6, panelRadius: 6, panelTint: 0.28, textTransform: 'uppercase', headingMax: 46, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['formal_5'], w, h, 'rgba(20,20,20,0.45)');
        drawOrnateFrame(ctx, w, h, 20, 28, '#d4d4d8', 0.4);
        drawCornerOrnaments(ctx, w, h, 20, '#d4d4d8', 0.35);
        ctx.fillStyle = '#d4d4d8'; ctx.globalAlpha = 0.25; ctx.save();
        ctx.translate(w / 2, 40); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore();
        ctx.globalAlpha = 1;
      }},
    ],

    festival: [
      { name: 'Eid Elegance', design: { headingFont: '"Amiri", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(251,191,36,0.4)', shadowBlur: 10, panelRadius: 12, panelTint: 0.28, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['festival_0'], w, h, 'rgba(13,61,56,0.4)');
        drawCrescentMoon(ctx, w / 2, 70, 24, '#fbbf24', BG_IMAGES['festival_0'] ? 'rgba(13,61,56,0.8)' : '#0d3d38');
        ctx.fillStyle = '#fbbf24'; ctx.globalAlpha = 0.8; drawStar(ctx, w / 2 + 34, 60, 3, 7, 5);
        ctx.globalAlpha = 0.15; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1;
        for (var a = 1; a <= 4; a++) { ctx.beginPath(); ctx.arc(w / 2, h + 50, 40 * a, Math.PI, 0); ctx.stroke(); }
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.25); ctx.globalAlpha = 1;
      }},
      { name: 'Diwali', design: { headingFont: '"Cormorant Garamond", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'stars', shadowColor: 'rgba(249,115,22,0.4)', shadowBlur: 10, panelRadius: 10, panelTint: 0.3, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['festival_1'], w, h, 'rgba(124,45,18,0.35)');
        var diyas = [w * 0.2, w * 0.5, w * 0.8];
        diyas.forEach(function(dx) {
          drawDiya(ctx, dx, h - 70, 1.2, { glowInner: 'rgba(251,191,36,0.5)', flameOuter: '#fbbf24', flameInner: '#f97316', body: '#d97706', rim: '#b45309' });
        });
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.2); ctx.globalAlpha = 1;
      }},
      { name: 'Christmas', design: { headingFont: '"Playfair Display", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'hearts', shadowColor: 'rgba(220,38,38,0.3)', shadowBlur: 8, panelRadius: 12, panelTint: 0.25, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['festival_2'], w, h, 'rgba(153,27,27,0.3)');
        var rng = seededRandom(1301);
        ctx.fillStyle = '#fef3c7'; ctx.globalAlpha = 0.12;
        for (var i = 0; i < 20; i++) {
          drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 3, 5);
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#dc2626', 0.3);
        drawCornerOrnaments(ctx, w, h, 18, '#22c55e', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Holi Colors', design: { headingFont: '"Pacifico", cursive', bodyFont: '"Poppins", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'wave', shadowColor: 'rgba(139,92,246,0.35)', shadowBlur: 10, panelRadius: 18, panelTint: 0.2, textTransform: 'none', headingMax: 52, bodyAlpha: 0.85 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['festival_3'], w, h, 'rgba(30,10,40,0.35)');
        var rng = seededRandom(1401);
        var holi = ['#f43f5e','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
        for (var i = 0; i < 60; i++) {
          ctx.fillStyle = holi[Math.floor(rng() * holi.length)];
          ctx.globalAlpha = 0.08 + rng() * 0.15;
          var sz = 3 + rng() * 10;
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, sz, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.2;
        roundRectStroke(ctx, 20, 20, w - 40, h - 40, 6); ctx.globalAlpha = 1;
      }},
      { name: 'Lantern Festival', design: { headingFont: '"Italiana", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'dots', shadowColor: 'rgba(251,191,36,0.35)', shadowBlur: 8, panelRadius: 12, panelTint: 0.28, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['festival_4'], w, h, 'rgba(15,15,40,0.45)');
        var rng = seededRandom(1450);
        var lanterns = ['#fbbf24','#f97316','#ef4444','#f59e0b'];
        for (var i = 0; i < 8; i++) {
          ctx.fillStyle = lanterns[Math.floor(rng() * lanterns.length)];
          ctx.globalAlpha = 0.06 + rng() * 0.1;
          var lx = rng() * w, ly = rng() * h * 0.6;
          ctx.beginPath(); ctx.ellipse(lx, ly, 6 + rng() * 8, 10 + rng() * 14, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.3);
        drawCornerOrnaments(ctx, w, h, 18, '#fbbf24', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'New Year Glow', design: { headingFont: '"Bebas Neue", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'stars', shadowColor: 'rgba(251,191,36,0.4)', shadowBlur: 12, panelRadius: 8, panelTint: 0.32, textTransform: 'uppercase', headingMax: 56, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['festival_5'], w, h, 'rgba(10,10,30,0.5)');
        var rng = seededRandom(1500);
        ctx.fillStyle = '#fbbf24';
        for (var i = 0; i < 40; i++) {
          ctx.globalAlpha = 0.05 + rng() * 0.12;
          drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 4, Math.floor(rng() * 2) + 4);
        }
        ctx.globalAlpha = 1;
        var fireworkColors = ['#f43f5e','#3b82f6','#22c55e','#fbbf24','#8b5cf6'];
        for (var f = 0; f < 3; f++) {
          var fx = w * 0.2 + rng() * w * 0.6, fy = h * 0.15 + rng() * h * 0.35;
          ctx.strokeStyle = fireworkColors[Math.floor(rng() * fireworkColors.length)];
          ctx.lineWidth = 1.5; ctx.globalAlpha = 0.15;
          for (var r = 0; r < 12; r++) {
            var angle = (r / 12) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(fx, fy);
            ctx.lineTo(fx + Math.cos(angle) * (20 + rng() * 25), fy + Math.sin(angle) * (20 + rng() * 25));
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.3);
        ctx.globalAlpha = 1;
      }},
    ],
    /* ==========================================
       BABY SHOWER / GENDER REVEAL
       ========================================== */
    babyshower: [
      { name: 'Pink Dreams', design: { headingFont: '"Sacramento", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'hearts', shadowColor: 'rgba(236,72,153,0.35)', shadowBlur: 8, panelRadius: 20, panelTint: 0.25, textTransform: 'none', headingMax: 56, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['babyshower_0'], w, h, 'rgba(190,120,160,0.25)');
        var rng = seededRandom(1601);
        ctx.fillStyle = '#f9a8d4'; ctx.globalAlpha = 0.15;
        for (var i = 0; i < 12; i++) { drawHeart(ctx, rng() * w, rng() * h, 6 + rng() * 10, '#f9a8d4', 0.12); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#f9a8d4', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Blue Bliss', design: { headingFont: '"Dancing Script", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'stars', shadowColor: 'rgba(59,130,246,0.35)', shadowBlur: 8, panelRadius: 16, panelTint: 0.28, textTransform: 'none', headingMax: 54, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['babyshower_1'], w, h, 'rgba(100,140,200,0.25)');
        var rng = seededRandom(1651);
        ctx.fillStyle = '#93c5fd'; ctx.globalAlpha = 0.12;
        for (var i = 0; i < 25; i++) { drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 3, 5); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#93c5fd', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Stork Special', design: { headingFont: '"Playfair Display", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(251,191,36,0.3)', shadowBlur: 8, panelRadius: 14, panelTint: 0.3, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['babyshower_2'], w, h, 'rgba(180,150,120,0.2)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.3);
        drawCornerOrnaments(ctx, w, h, 18, '#ec4899', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Pastel Balloons', design: { headingFont: '"Pacifico", cursive', bodyFont: '"Poppins", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'wave', shadowColor: 'rgba(168,85,247,0.3)', shadowBlur: 8, panelRadius: 18, panelTint: 0.22, textTransform: 'none', headingMax: 52, bodyAlpha: 0.88 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['babyshower_3'], w, h, 'rgba(150,120,180,0.2)');
        var rng = seededRandom(1680);
        var pastel = ['#f9a8d4','#93c5fd','#86efac','#fde68a','#c4b5fd'];
        for (var i = 0; i < 15; i++) {
          ctx.fillStyle = pastel[Math.floor(rng() * pastel.length)];
          ctx.globalAlpha = 0.08 + rng() * 0.12;
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 6 + rng() * 10, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }},
      { name: 'Gender Reveal', design: { headingFont: '"Bebas Neue", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'diamond', shadowColor: 'rgba(236,72,153,0.3)', shadowBlur: 10, panelRadius: 10, panelTint: 0.3, textTransform: 'uppercase', headingMax: 58, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['babyshower_4'], w, h, 'rgba(100,80,130,0.25)');
        var leftX = w * 0.25, rightX = w * 0.75, cy = h * 0.2;
        ctx.fillStyle = '#ec4899'; ctx.globalAlpha = 0.25; drawStar(ctx, leftX, cy, 6, 14, 5);
        ctx.fillStyle = '#3b82f6'; ctx.globalAlpha = 0.25; drawStar(ctx, rightX, cy, 6, 14, 5);
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#a855f7', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'Little Prince', design: { headingFont: '"Cormorant Garamond", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'dots', shadowColor: 'rgba(217,119,6,0.3)', shadowBlur: 8, panelRadius: 14, panelTint: 0.28, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['babyshower_5'], w, h, 'rgba(140,120,100,0.2)');
        drawCrescentMoon(ctx, w * 0.8, 65, 18, '#fbbf24', 'rgba(140,120,100,0.5)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.25);
        ctx.globalAlpha = 1;
      }},
    ],
    /* ==========================================
       GRADUATION / FAREWELL
       ========================================== */
    graduation: [
      { name: 'Academic Gold', design: { headingFont: '"Cinzel", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(217,119,6,0.4)', shadowBlur: 10, panelRadius: 12, panelTint: 0.32, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['graduation_0'], w, h, 'rgba(30,30,10,0.4)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#d97706', 0.35);
        drawCornerOrnaments(ctx, w, h, 18, '#fbbf24', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Campus Vibes', design: { headingFont: '"Montserrat", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: '700', divider: 'line', shadowColor: 'rgba(37,99,235,0.3)', shadowBlur: 8, panelRadius: 10, panelTint: 0.3, textTransform: 'uppercase', headingMax: 48, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['graduation_1'], w, h, 'rgba(30,58,138,0.3)');
        var rng = seededRandom(1751);
        ctx.fillStyle = '#fbbf24'; ctx.globalAlpha = 0.1;
        for (var i = 0; i < 20; i++) { drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 3, 5); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'Summa Cum Laude', design: { headingFont: '"Playfair Display", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'diamond', shadowColor: 'rgba(251,191,36,0.35)', shadowBlur: 10, panelRadius: 14, panelTint: 0.3, textTransform: 'none', headingMax: 48, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['graduation_2'], w, h, 'rgba(20,40,20,0.3)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Farewell Class', design: { headingFont: '"Great Vibes", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'hearts', shadowColor: 'rgba(244,63,94,0.3)', shadowBlur: 8, panelRadius: 16, panelTint: 0.25, textTransform: 'none', headingMax: 56, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['graduation_3'], w, h, 'rgba(88,20,30,0.3)');
        var rng = seededRandom(1780);
        ctx.fillStyle = '#fda4af'; ctx.globalAlpha = 0.15;
        for (var i = 0; i < 10; i++) { drawHeart(ctx, rng() * w, rng() * h, 6 + rng() * 8, '#fda4af', 0.12); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#fda4af', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Honor Roll', design: { headingFont: '"Orbitron", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'stars', shadowColor: 'rgba(251,191,36,0.4)', shadowBlur: 12, panelRadius: 8, panelTint: 0.35, textTransform: 'uppercase', headingMax: 46, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['graduation_4'], w, h, 'rgba(10,10,30,0.45)');
        var rng = seededRandom(1810);
        ctx.fillStyle = '#fbbf24';
        for (var i = 0; i < 30; i++) {
          ctx.globalAlpha = 0.06 + rng() * 0.1;
          drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 4, 5);
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'New Beginnings', design: { headingFont: '"Italiana", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'wave', shadowColor: 'rgba(59,130,246,0.3)', shadowBlur: 8, panelRadius: 14, panelTint: 0.28, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['graduation_5'], w, h, 'rgba(20,30,60,0.35)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#60a5fa', 0.25);
        drawCornerOrnaments(ctx, w, h, 18, '#fbbf24', 0.25);
        ctx.globalAlpha = 1;
      }},
    ],
    /* ==========================================
       ANNIVERSARY / ENGAGEMENT
       ========================================== */
    anniversary: [
      { name: 'Eternal Rose', design: { headingFont: '"Great Vibes", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'hearts', shadowColor: 'rgba(220,38,38,0.35)', shadowBlur: 10, panelRadius: 18, panelTint: 0.25, textTransform: 'none', headingMax: 58, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['anniversary_0'], w, h, 'rgba(127,29,29,0.3)');
        var rng = seededRandom(1901);
        ctx.fillStyle = '#fca5a5'; ctx.globalAlpha = 0.15;
        for (var i = 0; i < 12; i++) { drawHeart(ctx, rng() * w, rng() * h, 6 + rng() * 10, '#fca5a5', 0.12); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#fca5a5', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Golden Years', design: { headingFont: '"Playfair Display", serif', bodyFont: '"Montserrat", sans-serif', messageFont: 'italic "Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(217,119,6,0.4)', shadowBlur: 10, panelRadius: 12, panelTint: 0.3, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['anniversary_1'], w, h, 'rgba(60,40,10,0.3)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.35);
        drawCornerOrnaments(ctx, w, h, 18, '#fbbf24', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Diamond Bond', design: { headingFont: '"Cinzel", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'diamond', shadowColor: 'rgba(147,197,253,0.3)', shadowBlur: 8, panelRadius: 10, panelTint: 0.32, textTransform: 'none', headingMax: 48, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['anniversary_2'], w, h, 'rgba(20,30,60,0.35)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#93c5fd', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'Enchanted', design: { headingFont: '"Sacramento", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'stars', shadowColor: 'rgba(168,85,247,0.3)', shadowBlur: 8, panelRadius: 20, panelTint: 0.22, textTransform: 'none', headingMax: 58, bodyAlpha: 0.88 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['anniversary_3'], w, h, 'rgba(40,10,60,0.3)');
        var rng = seededRandom(1930);
        ctx.fillStyle = '#c4b5fd'; ctx.globalAlpha = 0.1;
        for (var i = 0; i < 20; i++) { drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 3, 5); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#c4b5fd', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'Love Story', design: { headingFont: '"Dancing Script", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'hearts', shadowColor: 'rgba(236,72,153,0.35)', shadowBlur: 10, panelRadius: 16, panelTint: 0.25, textTransform: 'none', headingMax: 54, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['anniversary_4'], w, h, 'rgba(80,20,40,0.3)');
        var rng = seededRandom(1950);
        ctx.fillStyle = '#f9a8d4'; ctx.globalAlpha = 0.15;
        for (var i = 0; i < 10; i++) { drawHeart(ctx, rng() * w, rng() * h, 6 + rng() * 8, '#f9a8d4', 0.12); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#f9a8d4', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Silver Celebration', design: { headingFont: '"Cormorant Garamond", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'line', shadowColor: 'rgba(209,213,219,0.3)', shadowBlur: 8, panelRadius: 12, panelTint: 0.3, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['anniversary_5'], w, h, 'rgba(30,30,40,0.35)');
        var rng = seededRandom(1960);
        ctx.fillStyle = '#e5e7eb'; ctx.globalAlpha = 0.08;
        for (var i = 0; i < 25; i++) { drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 3, 5); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#d1d5db', 0.25);
        ctx.globalAlpha = 1;
      }},
    ],
    /* ==========================================
       BUSINESS / CONFERENCE
       ========================================== */
    business: [
      { name: 'Corporate Elite', design: { headingFont: '"Bebas Neue", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'line', shadowColor: 'rgba(37,99,235,0.3)', shadowBlur: 8, panelRadius: 6, panelTint: 0.35, textTransform: 'uppercase', headingMax: 54, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['business_0'], w, h, 'rgba(15,23,42,0.4)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#60a5fa', 0.2);
        ctx.globalAlpha = 1;
      }},
      { name: 'Summit Stage', design: { headingFont: '"Montserrat", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: '700', divider: 'diamond', shadowColor: 'rgba(251,191,36,0.3)', shadowBlur: 8, panelRadius: 8, panelTint: 0.32, textTransform: 'uppercase', headingMax: 46, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['business_1'], w, h, 'rgba(20,30,50,0.35)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'Network Night', design: { headingFont: '"Orbitron", sans-serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'dots', shadowColor: 'rgba(34,197,94,0.3)', shadowBlur: 8, panelRadius: 10, panelTint: 0.3, textTransform: 'uppercase', headingMax: 44, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['business_2'], w, h, 'rgba(10,30,20,0.35)');
        var rng = seededRandom(2050);
        ctx.fillStyle = '#22c55e'; ctx.globalAlpha = 0.08;
        for (var i = 0; i < 15; i++) {
          ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 2 + rng() * 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#22c55e', 0.2);
        ctx.globalAlpha = 1;
      }},
      { name: 'Keynote', design: { headingFont: '"Playfair Display", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(217,119,6,0.3)', shadowBlur: 8, panelRadius: 12, panelTint: 0.3, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['business_3'], w, h, 'rgba(20,30,50,0.3)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.25);
        drawCornerOrnaments(ctx, w, h, 18, '#fbbf24', 0.2);
        ctx.globalAlpha = 1;
      }},
      { name: 'Startup Spark', design: { headingFont: '"Italiana", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'wave', shadowColor: 'rgba(168,85,247,0.3)', shadowBlur: 8, panelRadius: 14, panelTint: 0.28, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['business_4'], w, h, 'rgba(30,15,50,0.35)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#a855f7', 0.2);
        ctx.globalAlpha = 1;
      }},
      { name: 'Boardroom', design: { headingFont: '"Cinzel", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(148,163,184,0.3)', shadowBlur: 8, panelRadius: 8, panelTint: 0.35, textTransform: 'none', headingMax: 48, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['business_5'], w, h, 'rgba(15,23,42,0.4)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#94a3b8', 0.2);
        ctx.globalAlpha = 1;
      }},
    ],
    /* ==========================================
       HOUSEWARMING / INAUGURATION
       ========================================== */
    housewarming: [
      { name: 'Welcome Home', design: { headingFont: '"Playfair Display", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(34,197,94,0.3)', shadowBlur: 8, panelRadius: 16, panelTint: 0.28, textTransform: 'none', headingMax: 52, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['housewarming_0'], w, h, 'rgba(20,40,20,0.3)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#22c55e', 0.3);
        drawCornerOrnaments(ctx, w, h, 18, '#86efac', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'New Keys', design: { headingFont: '"Dancing Script", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'hearts', shadowColor: 'rgba(217,119,6,0.3)', shadowBlur: 8, panelRadius: 18, panelTint: 0.25, textTransform: 'none', headingMax: 54, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['housewarming_1'], w, h, 'rgba(60,40,10,0.3)');
        var rng = seededRandom(2150);
        ctx.fillStyle = '#fde68a'; ctx.globalAlpha = 0.12;
        for (var i = 0; i < 10; i++) { drawHeart(ctx, rng() * w, rng() * h, 6 + rng() * 8, '#fde68a', 0.1); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Garden Party', design: { headingFont: '"Great Vibes", cursive', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'stars', shadowColor: 'rgba(34,197,94,0.35)', shadowBlur: 10, panelRadius: 20, panelTint: 0.22, textTransform: 'none', headingMax: 58, bodyAlpha: 0.88 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['housewarming_2'], w, h, 'rgba(20,40,20,0.3)');
        var rng = seededRandom(2180);
        ctx.fillStyle = '#86efac'; ctx.globalAlpha = 0.1;
        for (var i = 0; i < 20; i++) { drawStar(ctx, rng() * w, rng() * h, 1, 2 + rng() * 3, 5); }
        ctx.globalAlpha = 1;
        drawOrnateFrame(ctx, w, h, 18, 26, '#86efac', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'Grand Opening', design: { headingFont: '"Cinzel", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'diamond', shadowColor: 'rgba(217,119,6,0.35)', shadowBlur: 10, panelRadius: 10, panelTint: 0.32, textTransform: 'none', headingMax: 48, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['housewarming_3'], w, h, 'rgba(40,30,10,0.35)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#fbbf24', 0.3);
        ctx.globalAlpha = 1;
      }},
      { name: 'Cozy Nest', design: { headingFont: '"Pacifico", cursive', bodyFont: '"Poppins", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'normal', divider: 'wave', shadowColor: 'rgba(234,179,8,0.3)', shadowBlur: 8, panelRadius: 18, panelTint: 0.22, textTransform: 'none', headingMax: 52, bodyAlpha: 0.88 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['housewarming_4'], w, h, 'rgba(40,30,15,0.3)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#fde68a', 0.25);
        ctx.globalAlpha = 1;
      }},
      { name: 'House Blessing', design: { headingFont: '"Cormorant Garamond", serif', bodyFont: '"Montserrat", sans-serif', messageFont: '"Poppins", sans-serif', headingWeight: 'bold', divider: 'flourish', shadowColor: 'rgba(134,239,172,0.3)', shadowBlur: 8, panelRadius: 14, panelTint: 0.28, textTransform: 'none', headingMax: 50, bodyAlpha: 0.9 }, draw: function (ctx, w, h) {
        drawImageBg(ctx, BG_IMAGES['housewarming_5'], w, h, 'rgba(20,40,25,0.3)');
        drawOrnateFrame(ctx, w, h, 18, 26, '#22c55e', 0.25);
        drawCornerOrnaments(ctx, w, h, 18, '#fbbf24', 0.2);
        ctx.globalAlpha = 1;
      }},
    ],
  };

  /* --- AI Messages --- */
  var AI_MESSAGES = {
    birthday: [
      "You're officially invited to the biggest celebration of the year! Join us for an unforgettable birthday bash filled with joy, laughter, and cake!",
      "It's time to party! Come celebrate another amazing year of life with us. Your presence is the best gift we could ask for!",
      "Round up your best vibes \u2014 we're throwing a birthday celebration and it wouldn't be complete without you!",
      "Birthdays are better with friends. We'd love to have you join us for an evening of fun, food, and festivities!",
    ],
    wedding: [
      "Two hearts, one love. We joyfully invite you to share in our happiness as we begin our forever together.",
      "With hearts full of love and joy, we invite you to witness and celebrate the union of two souls in matrimony.",
      "Together with their families, the happy couple requests the honor of your presence at their wedding celebration.",
      "Love is in the air! Please join us for a magical evening as we tie the knot and celebrate our love story.",
    ],
    party: [
      "Good vibes, great company, and an unforgettable night await. You're invited to the party of the season!",
      "Clear your schedule and bring your dancing shoes \u2014 it's going to be an epic night you won't want to miss!",
      "We're turning up the fun and you're on the guest list. Get ready for an amazing night of celebration!",
      "This is your official invitation to let loose, have fun, and make memories that last a lifetime!",
    ],
    formal: [
      "We cordially invite you to an evening of elegance, fine dining, and distinguished company.",
      "The pleasure of your company is requested at a formal dinner affair. Black tie optional.",
      "Join us for an exquisite evening of culinary excellence and refined conversation.",
      "You are warmly invited to attend a sophisticated evening gathering in your honor.",
    ],
    festival: [
      "May this festive season bring joy, peace, and prosperity to you and your loved ones. Celebrate with us!",
      "Wishing you a blessed and joyful festival! Come, let's celebrate together with warmth and happiness.",
      "As the festive lights shine bright, we invite you to join us in celebrating this special occasion with love and joy.",
      "On this auspicious occasion, we extend our warmest wishes and invite you to share in the celebrations.",
    ],
    babyshower: [
      "A little one is on the way! Join us for a joyful baby shower celebration filled with love, laughter, and warm wishes.",
      "We're expecting! Come shower the parents-to-be with love and blessings at our upcoming baby shower.",
      "Tiny hands, tiny feet, love so sweet. You're invited to our baby shower to celebrate this wonderful blessing!",
      "A bundle of joy is almost here! Help us celebrate this special milestone at our baby shower party.",
    ],
    graduation: [
      "The tassels are worth the hassle! Join us in celebrating this milestone achievement at our graduation ceremony.",
      "From late nights to bright futures — you're invited to celebrate our graduate's incredible journey and new beginnings.",
      "They did it! Come honor our graduate as they step into a new chapter of life and achievement.",
      "Class is dismissed, but the celebration is just beginning! Join us for a farewell graduation party.",
    ],
    anniversary: [
      "Love grows stronger with each passing year. Join us as we celebrate another beautiful year together.",
      "Two hearts, one incredible journey. You're invited to our anniversary celebration filled with love and memories.",
      "Cheers to the years of love, laughter, and happily ever after. Celebrate our special day with us!",
      "Our love story continues! Join us for an evening of romance and celebration as we mark this special milestone.",
    ],
    business: [
      "You're cordially invited to an exclusive business event featuring industry leaders, innovative ideas, and great networking.",
      "Join us for a professional gathering where ideas spark, connections form, and the future takes shape.",
      "Save the date for an inspiring conference bringing together the brightest minds in the industry.",
      "An evening of innovation, collaboration, and excellence awaits. You're invited to our business event.",
    ],
    housewarming: [
      "Our new home is ready and so are we! Come celebrate this exciting new chapter at our housewarming party.",
      "Home sweet home! Join us for a cozy housewarming celebration as we settle into our beautiful new space.",
      "We've moved in and the door is open! Come share in our joy at our housewarming celebration.",
      "A new address, a new beginning. You're warmly invited to our housewarming — the first of many gatherings to come.",
    ],
  };

  /* ==========================================
     TEXT COLOR PER CATEGORY/TEMPLATE
     ========================================== */
  function getTextColor(category, templateIndex) {
    var colors = {
      birthday: ['#ffffff','#ffffff','#3d1f00','#ffffff','#5a1a3a','#ffffff'],
      wedding: ['#2d1b4e','#1a0a2e','#3d2b1a','#0a2e1a','#3d2b1a','#4a1a00'],
      party:   ['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#e0f0ff'],
      formal:  ['#e0e0e0','#4a3520','#ffffff','#e0e0e0','#f5e6d8','#d4d4d8'],
      festival:['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff'],
      babyshower:['#ffffff','#ffffff','#2d1b00','#ffffff','#ffffff','#2d1b00'],
      graduation:['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff'],
      anniversary:['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#d1d5db'],
      business: ['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#e0e0e0'],
      housewarming:['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff']
    };
    var arr = colors[category];
    return (arr && arr[templateIndex]) ? arr[templateIndex] : '#ffffff';
  }

  /* ==========================================
     LOGO IMAGE (loaded once)
     ========================================== */
  var logoImg = null;
  var logoLoaded = false;
  var tempLogoImg = new Image();
  tempLogoImg.onload = function () { logoImg = tempLogoImg; logoLoaded = true; };
  tempLogoImg.onerror = function () { logoLoaded = false; };
  tempLogoImg.src = 'assets/logo.png';

  /* ==========================================
     TEMPLATE CARD RENDERING - Premium
     ========================================== */
  var cardCanvas = document.getElementById('cardCanvas');
  var cardCtx = cardCanvas ? cardCanvas.getContext('2d') : null;

  function renderTemplateCard() {
    var W = cardCanvas.width;
    var H = cardCanvas.height;
    cardCtx.clearRect(0, 0, W, H);

    var templates = TEMPLATES[state.category];
    var tmpl = templates ? templates[state.templateIndex] : null;
    if (tmpl) {
      tmpl.draw(cardCtx, W, H);
    } else {
      cardCtx.fillStyle = '#1a1a2e'; cardCtx.fillRect(0, 0, W, H);
    }

    var d = (tmpl && tmpl.design) || {};
    var tc = getTextColor(state.category, state.templateIndex);
    var pad = W * 0.1;
    var contentW = W - pad * 2;

    var pRadius = d.panelRadius || 16;
    var pTint = d.panelTint != null ? d.panelTint : 0.3;
    var isLightText = (tc.charAt(1) === 'f' || tc.charAt(1) === 'F');

    cardCtx.save();
    cardCtx.fillStyle = isLightText ? ('rgba(0,0,0,' + pTint + ')') : ('rgba(255,255,255,' + (pTint + 0.35) + ')');
    roundRect(cardCtx, pad - 12, H * 0.12, contentW + 24, H * 0.76, pRadius);
    cardCtx.fill();
    cardCtx.strokeStyle = isLightText ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    cardCtx.lineWidth = 1;
    roundRectStroke(cardCtx, pad - 12, H * 0.12, contentW + 24, H * 0.76, pRadius);
    cardCtx.restore();

    var curY = H * 0.18;
    cardCtx.textAlign = 'center';
    cardCtx.textBaseline = 'top';

    if (false && logoLoaded && logoImg) {
      var logoH = 50;
      var logoW = logoImg.width * (logoH / logoImg.height);
      cardCtx.drawImage(logoImg, (W - logoW) / 2, curY, logoW, logoH);
      curY += logoH + 12;
    }

    var eventName = state.eventName || 'Your Event Name';
    var headingFont = d.headingFont || '"Playfair Display", serif';
    var headingWeight = d.headingWeight || 'bold';
    var headingMax = d.headingMax || 52;
    var textXform = d.textTransform || 'none';
    var dispName = textXform === 'uppercase' ? eventName.toUpperCase() : textXform === 'capitalize' ? eventName.replace(/\b\w/g, function(c){return c.toUpperCase();}) : eventName;
    var headingSize = fitFontSize(cardCtx, dispName, contentW, 24, headingMax, headingWeight + ' ' + headingFont);
    cardCtx.font = headingWeight + ' ' + headingSize + 'px ' + headingFont;
    cardCtx.fillStyle = tc;
    cardCtx.shadowColor = d.shadowColor || 'rgba(0,0,0,0.3)';
    cardCtx.shadowBlur = d.shadowBlur || 6;
    var headingResult = wrapText(cardCtx, dispName, W / 2, curY, contentW, headingSize * 1.3);
    cardCtx.shadowBlur = 0;
    curY = headingResult.endY + 10;

    var divType = d.divider || ((state.category === 'wedding' || state.category === 'formal') ? 'flourish' : 'diamond');
    var divHalfW = contentW * 0.3;
    if (divType === 'flourish') drawFlourishDivider(cardCtx, W / 2, curY, divHalfW, tc, 0.4);
    else if (divType === 'dots') drawDotsDivider(cardCtx, W / 2, curY, divHalfW, tc, 0.4);
    else if (divType === 'stars') drawStarsDivider(cardCtx, W / 2, curY, divHalfW, tc, 0.4);
    else if (divType === 'hearts') drawHeartsDivider(cardCtx, W / 2, curY, divHalfW, tc, 0.4);
    else if (divType === 'wave') drawWaveDivider(cardCtx, W / 2, curY, divHalfW, tc, 0.4);
    else if (divType === 'line') drawLineDivider(cardCtx, W / 2, curY, divHalfW, tc, 0.3);
    else drawDiamondDivider(cardCtx, W / 2, curY, divHalfW, tc, 0.4);
    curY += 24;

    var bodyFont = d.bodyFont || '"Montserrat", sans-serif';
    var bodyAlpha = d.bodyAlpha != null ? d.bodyAlpha : 0.9;

    if (state.hostName) {
      var hostSize = fitFontSize(cardCtx, 'Hosted by ' + state.hostName, contentW, 14, 22, '500 ' + bodyFont);
      cardCtx.font = '500 ' + hostSize + 'px ' + bodyFont;
      cardCtx.fillStyle = tc;
      cardCtx.globalAlpha = bodyAlpha;
      wrapText(cardCtx, 'Hosted by ' + state.hostName, W / 2, curY, contentW, hostSize * 1.4);
      cardCtx.globalAlpha = 1;
      curY += hostSize * 1.4 + 8;
    }

    var dateStr = formatDate(state.eventDate);
    if (dateStr) {
      var dateSize = fitFontSize(cardCtx, dateStr, contentW, 13, 20, bodyFont);
      cardCtx.font = dateSize + 'px ' + bodyFont;
      cardCtx.fillStyle = tc;
      cardCtx.globalAlpha = bodyAlpha - 0.1;
      wrapText(cardCtx, dateStr, W / 2, curY, contentW, dateSize * 1.4);
      cardCtx.globalAlpha = 1;
      curY += dateSize * 1.4 + 6;
    }

    if (state.eventVenue) {
      var venueSize = fitFontSize(cardCtx, state.eventVenue, contentW * 0.85, 12, 18, bodyFont);
      cardCtx.font = venueSize + 'px ' + bodyFont;
      cardCtx.fillStyle = tc;
      cardCtx.globalAlpha = bodyAlpha - 0.15;
      var venueTextW = cardCtx.measureText(state.eventVenue).width;
      var pinSize = venueSize * 0.7;
      var pinX = W / 2 - venueTextW / 2 - pinSize - 6;
      var pinY = curY + venueSize * 0.5;
      drawLocationPin(cardCtx, pinX, pinY, pinSize, tc, 0.75);
      wrapText(cardCtx, state.eventVenue, W / 2, curY, contentW * 0.85, venueSize * 1.4);
      cardCtx.globalAlpha = 1;
      curY += venueSize * 1.4 + 6;
    }

    if (state.eventMessage) {
      curY += 6;
      var msgFont = d.messageFont || 'italic "Poppins", sans-serif';
      var msgSize = fitFontSize(cardCtx, '\u201C' + state.eventMessage + '\u201D', contentW * 0.8, 14, 22, msgFont);
      cardCtx.font = msgSize + 'px ' + msgFont;
      cardCtx.fillStyle = tc;
      cardCtx.globalAlpha = 0.7;
      wrapText(cardCtx, '\u201C' + state.eventMessage + '\u201D', W / 2, curY, contentW * 0.8, msgSize * 1.5);
      cardCtx.globalAlpha = 1;
    }

    cardCtx.font = '11px "Montserrat", sans-serif';
    cardCtx.fillStyle = tc;
    cardCtx.globalAlpha = 0.25;
    cardCtx.fillText('Made with SendInvite', W / 2, H - 20);
    cardCtx.globalAlpha = 1;
    cardCtx.textAlign = 'left';
  }

  /* ==========================================
     CUSTOM CARD RENDERING - Premium
     ========================================== */
  var customCanvas = document.getElementById('customCanvas');
  var customCtx = customCanvas ? customCanvas.getContext('2d') : null;

  function renderCustomCard() {
    var W = customCanvas.width;
    var H = customCanvas.height;
    customCtx.clearRect(0, 0, W, H);

    /* Background */
    if (customState.bgImage) {
      var img = customState.bgImage;
      var imgRatio = img.width / img.height;
      var canvasRatio = W / H;
      var drawW, drawH, drawX, drawY;
      if (imgRatio > canvasRatio) {
        drawH = H; drawW = H * imgRatio; drawX = (W - drawW) / 2; drawY = 0;
      } else {
        drawW = W; drawH = W / imgRatio; drawX = 0; drawY = (H - drawH) / 2;
      }
      customCtx.drawImage(img, drawX, drawY, drawW, drawH);
      customCtx.fillStyle = 'rgba(0,0,0,0.35)';
      customCtx.fillRect(0, 0, W, H);
    } else {
      customCtx.fillStyle = customState.bgColor;
      customCtx.fillRect(0, 0, W, H);
    }

    var pad = W * 0.1;
    var contentW = W - pad * 2;
    var tc = customState.fontColor;

    /* Panel */
    customCtx.save();
    customCtx.fillStyle = 'rgba(0,0,0,0.15)';
    roundRect(customCtx, pad - 8, 30, contentW + 16, H - 60, 12);
    customCtx.fill();
    customCtx.restore();

    customCtx.textAlign = 'center';
    customCtx.textBaseline = 'top';
    var curY = 50;

    /* -- Logo -- */
    if (false && logoLoaded && logoImg) {
      var logoH = 48;
      var logoW = logoImg.width * (logoH / logoImg.height);
      customCtx.drawImage(logoImg, (W - logoW) / 2, curY, logoW, logoH);
      curY += logoH + 10;
    }

    /* -- Heading (auto-sized) -- */
    var headingText = customState.heading || 'Your Heading';
    var hFont = '"' + customState.font + '", serif';
    var hSize = fitFontSize(customCtx, headingText, contentW, 18, customState.fontSize, 'bold ' + hFont);
    customCtx.font = 'bold ' + hSize + 'px ' + hFont;
    customCtx.fillStyle = tc;
    customCtx.shadowColor = 'rgba(0,0,0,0.3)';
    customCtx.shadowBlur = 5;
    var hResult = wrapText(customCtx, headingText, W / 2, curY, contentW, hSize * 1.2);
    customCtx.shadowBlur = 0;
    curY = hResult.endY + 8;

    /* -- Divider -- */
    drawFlourishDivider(customCtx, W / 2, curY, contentW * 0.3, tc, 0.3);
    curY += 20;

    /* -- Date -- */
    var dateStr = formatDate(customState.date);
    if (dateStr) {
      customCtx.font = '16px "Montserrat", sans-serif';
      customCtx.fillStyle = tc;
      customCtx.globalAlpha = 0.9;
      customCtx.fillText(dateStr, W / 2, curY);
      customCtx.globalAlpha = 1;
      curY += 28;
    }

    /* -- Venue -- */
    if (customState.venue) {
      customCtx.font = '15px "Montserrat", sans-serif';
      customCtx.fillStyle = tc;
      customCtx.globalAlpha = 0.8;
      var custVenueTextW = customCtx.measureText(customState.venue).width;
      var custPinSize = 11;
      var custPinX = W / 2 - custVenueTextW / 2 - custPinSize - 6;
      var custPinY = curY + 15 * 0.5;
      drawLocationPin(customCtx, custPinX, custPinY, custPinSize, tc, 0.8);
      wrapText(customCtx, customState.venue, W / 2, curY, contentW * 0.8, 22);
      customCtx.globalAlpha = 1;
      curY += 36;
    }

    /* -- Description -- */
    if (customState.desc) {
      customCtx.font = '14px "Poppins", sans-serif';
      customCtx.fillStyle = customState.descColor;
      customCtx.globalAlpha = 0.85;
      wrapText(customCtx, customState.desc, W / 2, curY, contentW * 0.7, 22);
      customCtx.globalAlpha = 1;
    }

    /* -- Footer -- */
    customCtx.font = '11px "Montserrat", sans-serif';
    customCtx.fillStyle = tc;
    customCtx.globalAlpha = 0.25;
    customCtx.fillText('Made with SendInvite', W / 2, H - 20);
    customCtx.globalAlpha = 1;
    customCtx.textAlign = 'left';
  }

  /* ==========================================
     TEMPLATE THUMBNAILS
     ========================================== */
  function renderTemplateThumbnails() {
    var grid = document.getElementById('templateGrid');
    grid.innerHTML = '';
    var templates = TEMPLATES[state.category];
    if (!templates) return;
    templates.forEach(function (tmpl, index) {
      var thumb = document.createElement('div');
      thumb.className = 'template-thumb' + (index === state.templateIndex ? ' active' : '');
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('aria-label', 'Template: ' + tmpl.name);
      thumb.setAttribute('tabindex', '0');
      var miniCanvas = document.createElement('canvas');
      miniCanvas.width = 200;
      miniCanvas.height = 150;
      var miniCtx = miniCanvas.getContext('2d');
      tmpl.draw(miniCtx, 200, 150);
      thumb.appendChild(miniCanvas);
      grid.appendChild(thumb);
      thumb.addEventListener('click', function () {
        state.templateIndex = index;
        renderTemplateThumbnails();
        renderTemplateCard();
      });
      thumb.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          state.templateIndex = index;
          renderTemplateThumbnails();
          renderTemplateCard();
        }
      });
    });
  }

  /* ==========================================
     DOWNLOAD
     ========================================== */
  function downloadCanvas(canvas, filename) {
    var link = document.createElement('a');
    link.download = filename || 'invitecraft-card.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /* ==========================================
     EVENT LISTENERS
     ========================================== */
  document.addEventListener('DOMContentLoaded', function () {
    var mobileToggle = document.getElementById('mobileToggle');
    var navLinks = document.getElementById('navLinks');
    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener('click', function () {
        var isOpen = navLinks.classList.toggle('open');
        mobileToggle.classList.toggle('active');
        mobileToggle.setAttribute('aria-expanded', isOpen);
      });
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navLinks.classList.remove('open');
          mobileToggle.classList.remove('active');
          mobileToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    var header = document.getElementById('siteHeader');
    if (header) {
      window.addEventListener('scroll', function () {
        header.classList.toggle('scrolled', window.scrollY > 30);
      });
    }

    var tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length) {
      tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          tabBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          state.category = btn.getAttribute('data-category');
          state.templateIndex = 0;
          renderTemplateThumbnails();
          renderTemplateCard();
        });
      });
    }

    var formInputs = {
      eventName: document.getElementById('eventName'),
      hostName: document.getElementById('hostName'),
      eventDate: document.getElementById('eventDate'),
      eventVenue: document.getElementById('eventVenue'),
      eventMessage: document.getElementById('eventMessage'),
    };
    if (formInputs.eventName) {
      Object.keys(formInputs).forEach(function (key) {
        formInputs[key].addEventListener('input', function () {
          state[key] = formInputs[key].value;
          renderTemplateCard();
        });
      });
    }

    var aiSuggestBtn = document.getElementById('aiSuggestBtn');
    if (aiSuggestBtn) {
      aiSuggestBtn.addEventListener('click', function () {
        var msgs = AI_MESSAGES[state.category] || AI_MESSAGES.birthday;
        var randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
        formInputs.eventMessage.value = randomMsg;
        state.eventMessage = randomMsg;
        renderTemplateCard();
      });
    }

    var downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        var name = state.eventName || 'invitecraft-card';
        var safeName = name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();
        downloadCanvas(cardCanvas, safeName + '.png');
      });
    }

    /* Toast helper */
    function showToast(msg) {
      var t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f1f5f9;padding:12px 22px;border-radius:10px;font:500 13px Poppins,sans-serif;z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,0.35);max-width:90vw;text-align:center;';
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 3500);
    }

    function canvasToFile(canvas, filename) {
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          resolve(new File([blob], filename, { type: 'image/png' }));
        }, 'image/png');
      });
    }

    /* Template share buttons */
    function buildShareText() {
      var parts = [];
      if (state.eventName) parts.push('You are invited to ' + state.eventName + '!');
      if (state.hostName) parts.push('Hosted by ' + state.hostName + '.');
      if (state.eventDate) parts.push('Date: ' + formatDate(state.eventDate) + '.');
      if (state.eventVenue) parts.push('Venue: ' + state.eventVenue + '.');
      if (state.eventMessage) parts.push('"' + state.eventMessage + '"');
      parts.push('Created with SendInvite');
      return parts.join(' ');
    }

    var whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', function () {
        var text = buildShareText();
        var fileName = (state.eventName || 'sendinvite-card').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase() + '.png';

        if (navigator.share && navigator.canShare) {
          canvasToFile(cardCanvas, fileName).then(function (file) {
            var shareData = { title: 'Invitation Card', text: text, files: [file] };
            if (navigator.canShare(shareData)) {
              navigator.share(shareData).catch(function () {});
            } else {
              navigator.share({ title: 'Invitation Card', text: text }).catch(function () {});
            }
          });
        } else {
          downloadCanvas(cardCanvas, fileName);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
              showToast('Card downloaded! Opening WhatsApp — paste the text and attach the image.');
            });
          } else {
            showToast('Card downloaded! Opening WhatsApp — paste the text and attach the image.');
          }
          setTimeout(function () { window.open('https://web.whatsapp.com', '_blank'); }, 800);
        }
      });
    }

    var emailBtn = document.getElementById('emailBtn');
    if (emailBtn) {
      emailBtn.addEventListener('click', function () {
        var subject = 'Invitation: ' + (state.eventName || 'You\'re Invited');
        var body = buildShareText();
        var fileName = (state.eventName || 'sendinvite-card').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase() + '.png';
        downloadCanvas(cardCanvas, fileName);
        showToast('Card downloaded! Please attach it to your email.');
        setTimeout(function () {
          window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        }, 600);
      });
    }

    /* Custom card controls */
    var customBgColor = document.getElementById('customBgColor');
    if (customBgColor) {
      var bgColorValue = document.getElementById('bgColorValue');
      var customBgImage = document.getElementById('customBgImage');
      var removeBgImage = document.getElementById('removeBgImage');
      var customHeading = document.getElementById('customHeading');
      var customFont = document.getElementById('customFont');
      var customFontColor = document.getElementById('customFontColor');
      var fontColorValue = document.getElementById('fontColorValue');
      var customFontSize = document.getElementById('customFontSize');
      var fontSizeVal = document.getElementById('fontSizeVal');
      var customDate = document.getElementById('customDate');
      var customVenue = document.getElementById('customVenue');
      var customDesc = document.getElementById('customDesc');
      var customDescColor = document.getElementById('customDescColor');
      var descColorValue = document.getElementById('descColorValue');

      customBgColor.addEventListener('input', function () { customState.bgColor = customBgColor.value; bgColorValue.textContent = customBgColor.value; renderCustomCard(); });
      customBgImage.addEventListener('change', function (e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var img = new Image();
          img.onload = function () { customState.bgImage = img; removeBgImage.style.display = 'flex'; renderCustomCard(); };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
      removeBgImage.addEventListener('click', function () { customState.bgImage = null; customBgImage.value = ''; removeBgImage.style.display = 'none'; renderCustomCard(); });
      customHeading.addEventListener('input', function () { customState.heading = customHeading.value; renderCustomCard(); });
      customFont.addEventListener('change', function () { customState.font = customFont.value; renderCustomCard(); });
      customFontColor.addEventListener('input', function () { customState.fontColor = customFontColor.value; fontColorValue.textContent = customFontColor.value; renderCustomCard(); });
      customFontSize.addEventListener('input', function () { customState.fontSize = parseInt(customFontSize.value); fontSizeVal.textContent = customFontSize.value; renderCustomCard(); });
      customDate.addEventListener('input', function () { customState.date = customDate.value; renderCustomCard(); });
      customVenue.addEventListener('input', function () { customState.venue = customVenue.value; renderCustomCard(); });
      customDesc.addEventListener('input', function () { customState.desc = customDesc.value; renderCustomCard(); });
      customDescColor.addEventListener('input', function () { customState.descColor = customDescColor.value; descColorValue.textContent = customDescColor.value; renderCustomCard(); });
      var customDownloadBtn = document.getElementById('customDownloadBtn');
      if (customDownloadBtn) customDownloadBtn.addEventListener('click', function () { downloadCanvas(customCanvas, 'invitecraft-custom-card.png'); });

      /* Custom card share buttons */
      function buildCustomShareText() {
        var parts = [];
        if (customState.heading) parts.push('You are invited to ' + customState.heading + '!');
        if (customState.date) parts.push('Date: ' + customState.date + '.');
        if (customState.venue) parts.push('Venue: ' + customState.venue + '.');
        if (customState.desc) parts.push('"' + customState.desc + '"');
        parts.push('Created with SendInvite');
        return parts.join(' ');
      }
      var customWhatsappBtn = document.getElementById('customWhatsappBtn');
      if (customWhatsappBtn) {
        customWhatsappBtn.addEventListener('click', function () {
          var text = buildCustomShareText();
          var fileName = (customState.heading || 'sendinvite-custom').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase() + '.png';

          if (navigator.share && navigator.canShare) {
            canvasToFile(customCanvas, fileName).then(function (file) {
              var shareData = { title: 'Invitation Card', text: text, files: [file] };
              if (navigator.canShare(shareData)) {
                navigator.share(shareData).catch(function () {});
              } else {
                navigator.share({ title: 'Invitation Card', text: text }).catch(function () {});
              }
            });
          } else {
            downloadCanvas(customCanvas, fileName);
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).then(function () {
                showToast('Card downloaded! Opening WhatsApp — paste the text and attach the image.');
              });
            } else {
              showToast('Card downloaded! Opening WhatsApp — paste the text and attach the image.');
            }
            setTimeout(function () { window.open('https://web.whatsapp.com', '_blank'); }, 800);
          }
        });
      }
      var customEmailBtn = document.getElementById('customEmailBtn');
      if (customEmailBtn) {
        customEmailBtn.addEventListener('click', function () {
          var subject = 'Invitation: ' + (customState.heading || 'You\'re Invited');
          var body = buildCustomShareText();
          var fileName = (customState.heading || 'sendinvite-custom').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase() + '.png';
          downloadCanvas(customCanvas, fileName);
          showToast('Card downloaded! Please attach it to your email.');
          setTimeout(function () {
            window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
          }, 600);
        });
      }
    }

    /* Initial render */
    if (document.getElementById('templateGrid')) {
      renderTemplateThumbnails();
      renderTemplateCard();
    }
    if (document.getElementById('customCanvas')) {
      renderCustomCard();
    }
  });
})();
