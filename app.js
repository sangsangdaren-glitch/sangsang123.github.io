/* ============================================================
   店铺菜单 · 前台逻辑
   数据来源：data/store.json（字段与后台管理端保持一致，未做任何改动）
   ============================================================ */

(function () {
  'use strict';

  var PAGE_SIZE = 12;
  var STORE_URL = 'data/store.json';
  var LAST_CAT_KEY = 'sangsang:lastCategory';

  var state = {
    store: null,
    categoryId: null,
    list: [],
    shown: 0,
    lastFocus: null
  };

  var el = {};
  ['storeName', 'storeNotice', 'shareBtn', 'categoryBar', 'skeleton', 'products',
   'moreWrap', 'moreBtn', 'tipEmpty', 'tipError', 'retryBtn', 'shareBarBtn', 'topBtn',
   'sheet', 'sheetMask', 'sheetClose', 'sheetCloseBtn', 'sheetImage', 'sheetName',
   'sheetPrice', 'sheetTags', 'sheetDesc', 'sheetShare', 'toast'].forEach(function (id) {
    el[id] = document.getElementById(id);
  });

  /* ---------- 小工具 ---------- */

  function readParam(name) {
    try {
      return new URLSearchParams(location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function writeParam(id) {
    try {
      var url = location.pathname + (id ? '?category=' + encodeURIComponent(id) : '') + location.hash;
      history.replaceState(null, '', url);
    } catch (e) { /* 部分内置浏览器限制 history，忽略即可 */ }
  }

  function remember(id) {
    try { localStorage.setItem(LAST_CAT_KEY, id || ''); } catch (e) { /* 隐私模式忽略 */ }
  }

  function recall() {
    try { return localStorage.getItem(LAST_CAT_KEY) || ''; } catch (e) { return ''; }
  }

  /* 价格：0 或缺省显示"面议"，整数不带小数 */
  function priceHTML(price) {
    var n = Number(price);
    if (!isFinite(n) || n <= 0) return '<span class="ask">面议</span>';
    var text = n % 1 === 0 ? String(n) : n.toFixed(2);
    return '<small>¥</small>' + text;
  }

  function makeImage(src, alt, wrap, iconId) {
    var icon = iconId || 'i-box';
    wrap.innerHTML =
      '<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"' +
      ' stroke-linecap="round" stroke-linejoin="round">' +
      svgBody(icon) + '</svg></div>' +
      (src ? '<img decoding="async" alt="" src="' + escapeAttr(src) + '">' : '');
    wrap.classList.toggle('is-failed', !src);
    if (!src) return;
    var img = wrap.querySelector('img');
    img.addEventListener('error', function () { wrap.classList.add('is-failed'); }, { once: true });
    if (alt) img.setAttribute('alt', alt);
  }

  /* 占位图标的内联路径（与页面上 <symbol> 保持一致） */
  var ICON_BODY = {
    'i-box': '<path d="M3.5 8.5 12 4l8.5 4.5v7L12 20l-8.5-4.5z"/><path d="M3.5 8.5 12 13l8.5-4.5M12 13v7"/>',
    'i-sock': '<path d="M9 3h6v7c0 2.5 1.6 4 3.4 5.2 1 .7 1.6 1.6 1.6 2.6 0 1.8-1.5 3.2-3.3 3.2h-2.4c-2.6 0-4.8-2-4.8-4.6 0-1.6.7-3 1.8-4.2C12 11.1 13 9.6 13 8V3"/><path d="M9 6.5h6"/>',
    'i-shoe': '<path d="M2 17h13.5c1.6 0 3-.9 3.7-2.2L21 12l-4.4-.9-2.2-2.6-3.1 1.3L7 11 4 12.2z"/><path d="M2 17v-3.6"/><path d="M9.5 9.8 11 12"/>',
    'i-video': '<rect x="2.5" y="5" width="14" height="14" rx="3.5"/><path d="M16.5 11.2 21 8.4v7.2l-4.5-2.8z"/><path d="M7.5 10.5v3"/>'
  };

  function svgBody(id) {
    return ICON_BODY[id] || ICON_BODY['i-box'];
  }

  /* 只按名称粗略选图标，选不出来也不影响显示 */
  function iconFor(product) {
    var name = String(product.name || '');
    if (/袜|丝/.test(name)) return 'i-sock';
    if (/鞋|靴|高跟/.test(name)) return 'i-shoe';
    if (/视频|定制/.test(name)) return 'i-video';
    return 'i-box';
  }

  function escapeAttr(v) {
    return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function iconFor(product) {
    var name = String(product.name || '');
    if (/鞋|靴|高跟/.test(name)) return 'i-shoe';
    return 'i-box';
  }

  var toastTimer = null;
  function toast(msg, icon) {
    el.toast.innerHTML = (icon ? '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#' + icon + '"/></svg>' : '') +
      '<span>' + msg + '</span>';
    el.toast.hidden = false;
    requestAnimationFrame(function () { el.toast.classList.add('is-on'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove('is-on');
      setTimeout(function () { el.toast.hidden = true; }, 220);
    }, 1900);
  }

  function copyLink(okMsg) {
    var link = location.href;
    function done() { toast(okMsg || '菜单链接已复制', 'i-copy'); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = link;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, link.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) done();
      else window.prompt('长按复制下面的链接', link);
    }
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(link).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* 招牌是 sticky 的，分类栏要贴在招牌下沿；
     招牌高度随店名和公告换行变化，所以按真实高度写进变量 */
  function syncHeadHeight() {
    if (!el.storeName || !el.storeName.parentNode) return;
    var head = document.querySelector('.shop-head');
    if (!head) return;
    document.documentElement.style.setProperty('--head-h', head.offsetHeight + 'px');
  }

  /* ---------- 渲染 ---------- */

  function renderCategories() {
    var cats = (state.store && state.store.categories) || [];
    el.categoryBar.innerHTML = '';
    el.categoryBar.hidden = cats.length === 0;
    cats.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cat' + (c.id === state.categoryId ? ' on' : '');
      b.dataset.id = c.id;
      b.textContent = c.name || '未命名分类';
      b.title = c.name || '';
      b.addEventListener('click', function () { selectCategory(c.id); });
      el.categoryBar.appendChild(b);
    });
  }

  function currentProducts() {
    var all = (state.store && state.store.products) || [];
    return all.filter(function (p) {
      return p && p.visible !== false && p.categoryId === state.categoryId;
    });
  }

  function cardNode(p) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.id = p.id;
    card.setAttribute('aria-label', (p.name || '未命名商品') + '，查看详情');

    var media = document.createElement('div');
    media.className = 'card-media';
    var first = (p.images && p.images[0]) || '';
    makeImage(first, p.name, media, iconFor(p));

    var body = document.createElement('div');
    body.className = 'card-body';

    var name = document.createElement('h3');
    name.className = 'card-name';
    name.textContent = p.name || '未命名商品';

    var price = document.createElement('div');
    price.className = 'card-price';
    price.innerHTML = priceHTML(p.price, false);

    body.appendChild(name);
    body.appendChild(price);
    card.appendChild(media);
    card.appendChild(body);
    card.addEventListener('click', function () { openSheet(p); });
    return card;
  }

  function renderBatch(reset) {
    if (reset) {
      el.products.innerHTML = '';
      state.shown = 0;
      el.products.hidden = state.list.length === 0;
    }
    var next = state.list.slice(state.shown, state.shown + PAGE_SIZE);
    var frag = document.createDocumentFragment();
    next.forEach(function (p) { frag.appendChild(cardNode(p)); });
    el.products.appendChild(frag);
    state.shown += next.length;

    var hasMore = state.shown < state.list.length;
    el.moreWrap.hidden = !hasMore;
    if (hasMore) {
      el.moreBtn.textContent = '看更多（还有 ' + (state.list.length - state.shown) + ' 款）';
    }
  }

  function renderProducts() {
    state.list = currentProducts();
    el.products.hidden = state.list.length === 0;
    el.moreWrap.hidden = true;
    el.tipEmpty.hidden = state.list.length !== 0;
    renderBatch(true);
  }

  function selectCategory(id) {
    if (id === state.categoryId) return;
    state.categoryId = id;
    remember(id);
    writeParam(id);
    renderCategories();
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- 详情抽屉 ---------- */

  var scrollLock = 0;

  function openSheet(p) {
    var cat = ((state.store && state.store.categories) || []).filter(function (c) { return c.id === p.categoryId; })[0];

    makeImage((p.images && p.images[0]) || '', p.name, el.sheetImage, iconFor(p));
    el.sheetName.textContent = p.name || '未命名商品';
    el.sheetPrice.innerHTML = priceHTML(p.price, false);

    var tags = [];
    if (cat && cat.name) tags.push(cat.name);
    if (p.desc) tags.push('有说明');
    el.sheetTags.hidden = tags.length === 0;
    el.sheetTags.innerHTML = tags.map(function (t) { return '<span class="tag">' + escapeAttr(t) + '</span>'; }).join('');

    el.sheetDesc.hidden = !p.desc;
    el.sheetDesc.textContent = p.desc || '';

    el.sheetShare.dataset.id = p.id || '';
    state.lastFocus = document.activeElement;

    scrollLock = window.pageYOffset || document.documentElement.scrollTop || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollLock + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    el.sheet.hidden = false;
    el.sheet.querySelector('.sheet-scroll').scrollTop = 0;
    requestAnimationFrame(function () { el.sheet.classList.add('is-open'); });
    el.sheetClose.focus({ preventScroll: true });
  }

  function closeSheet() {
    if (el.sheet.hidden) return;
    el.sheet.classList.remove('is-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollLock);
    setTimeout(function () { el.sheet.hidden = true; }, 240);
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus({ preventScroll: true });
  }

  /* ---------- 加载 ---------- */

  function setLoading() {
    el.skeleton.hidden = false;
    el.products.hidden = true;
    el.moreWrap.hidden = true;
    el.tipEmpty.hidden = true;
    el.tipError.hidden = true;
    el.categoryBar.hidden = true;
  }

  function load() {
    setLoading();
    var url = STORE_URL + '?v=' + Date.now();
    var req = fetch(url, { cache: 'no-store' });
    req.then(function (res) {
      if (!res.ok) throw new Error('store.json ' + res.status);
      return res.json();
    }).then(function (data) {
      if (!data || typeof data !== 'object') throw new Error('数据格式不对');
      state.store = data;

      var name = data.storeName || data.shopName || '店铺菜单';
      document.title = name;
      el.storeName.textContent = name;

      var notice = data.notice || data.announcement || '';
      el.storeNotice.textContent = notice;
      el.storeNotice.hidden = !notice;

      var cats = data.categories || [];
      var param = readParam('category');
      var paramOk = param && cats.some(function (c) { return c.id === param; });
      var lastOk = recall() && cats.some(function (c) { return c.id === recall(); });

      if (param) {
        /* 链接里带了分类参数：认这个分类，就算它已经不存在也照原样展示，
           避免顾客收到的旧链接悄悄跳到别的分类 */
        state.categoryId = param;
      } else if (lastOk) {
        state.categoryId = recall();
      } else {
        state.categoryId = cats[0] ? cats[0].id : null;
      }

      el.skeleton.hidden = true;
      renderCategories();
      renderProducts();
      /* 首次进入没有 category 参数时补上，方便顾客直接复制当前分类的链接 */
      if (!param && state.categoryId) writeParam(state.categoryId);
      syncHeadHeight();
      requestAnimationFrame(syncHeadHeight);
    }).catch(function (err) {
      el.skeleton.hidden = true;
      el.tipError.hidden = false;
      el.tipEmpty.hidden = true;
      el.products.hidden = true;
      el.moreWrap.hidden = true;
      if (window.console && console.error) console.error('[store] 加载失败', err);
    });
  }

  /* ---------- 事件 ---------- */

  el.shareBtn.addEventListener('click', function () { copyLink(); });
  el.shareBarBtn.addEventListener('click', function () { copyLink(); });
  el.moreBtn.addEventListener('click', function () { renderBatch(false); });
  el.retryBtn.addEventListener('click', function () { load(); });
  el.sheetMask.addEventListener('click', closeSheet);
  el.sheetClose.addEventListener('click', closeSheet);
  el.sheetCloseBtn.addEventListener('click', closeSheet);
  el.sheetShare.addEventListener('click', function () {
    copyLink('商品链接已复制，发给顾客就能看');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSheet();
  });

  window.addEventListener('resize', syncHeadHeight);
  window.addEventListener('orientationchange', syncHeadHeight);

  el.topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  var lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (Math.abs(y - lastY) < 20) return;
    lastY = y;
    var show = y > 420 && !el.products.hidden;
    el.topBtn.hidden = !show;
  }, { passive: true });

  /* 图片加载超时保护：整个页面图片都不显示时给出提醒（不影响正常浏览） */
  window.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') {
      var wrap = e.target.closest('.card-media, .sheet-image');
      if (wrap) wrap.classList.add('is-failed');
    }
  }, true);

  load();
})();
