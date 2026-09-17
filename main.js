(() => {
  // Progressive scroll reveal for the homepage gateways.
  const items = document.querySelectorAll('[data-reveal]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (items.length && !motion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });

    for (const item of items) {
      if (item.getBoundingClientRect().top < window.innerHeight) continue;
      item.classList.add('will-reveal');
      observer.observe(item);
    }

    motion.addEventListener('change', (event) => {
      if (!event.matches) return;
      observer.disconnect();
      for (const item of items) item.classList.remove('will-reveal');
    });
  }

  // Find your PIE — one box, everything inferred from the sentence.
  // Tries the AI recommendation endpoint first; falls back to local keyword matching.
  const form = document.getElementById('finder-form');
  const input = document.getElementById('finder-input');
  const submitBtn = document.getElementById('finder-submit');
  const submitLabel = submitBtn && submitBtn.querySelector('.finder-submit-label');
  const results = document.getElementById('finder-results');
  const grid = document.getElementById('finder-grid');
  const modeBadge = document.getElementById('finder-mode');
  const noteEl = document.getElementById('finder-results-note');
  const summaryEl = document.getElementById('finder-results-summary');
  const finderReady = !!(form && input && results && grid && noteEl);

  // Production endpoint first; the local dev proxy is the fallback for development.
  const AI_ENDPOINTS = [
    'https://pie-recommend.zixuangui.workers.dev/recommend',
    'http://localhost:8787/recommend'
  ];
  const RTL_LANGS = new Set(['ar', 'fa', 'he', 'ur']);

  const POOL = {
    members: [
      { id: 'sparlay-khan', name: 'Sparlay Khan', img: 'member-sparlay-khan.jpeg', sub: 'Manager · Pakistan', langs: ['english'], kw: ['environment', 'nature', 'travel', 'travelling', 'hiking'], badge: '' },
      { id: 'zixuan-gui', name: 'Zixuan Gui', img: 'member-zixuan-gui.jpeg', sub: 'Volunteer · China', langs: ['english', 'chinese', 'mandarin'], kw: ['sports', 'ski', 'skiing', 'coding', 'computer science', 'programming'], badge: '' },
      { id: 'tamara-matijevic', name: 'Tamara Matijević', img: 'member-tamara-matijevic.jpeg', sub: 'Community member · Serbia', langs: ['english', 'french', 'serbian'], kw: ['neuroscience', 'biology', 'molecular', 'science'], badge: '' },
      { id: 'alessio-saturnino', name: 'Alessio SATURNINO', img: 'member-alessio-saturnino.jpeg', sub: 'Community member · Italy', langs: ['italian', 'english', 'french', 'spanish'], kw: ['running', 'gym', 'basketball', 'volleyball', 'techno', 'music', 'party', 'poems', 'poetry', 'nature'], badge: '' },
      { id: 'amir-cheraghali', name: 'Amir M. Cheraghali', img: 'member-amir-cheraghali.png', sub: 'Community member', langs: [], kw: ['hiking', 'football', 'soccer', 'piano', 'music', 'outdoors'], badge: '' },
      { id: 'meghna-varma', name: 'Meghna Varma', img: 'member-meghna-varma.jpeg', sub: 'Community member', langs: [], kw: ['astrophysics', 'physics', 'space', 'stem', 'gender equality', 'science', 'science communication', 'reading', 'books', 'music', 'dance', 'basketball'], badge: '' },
    ],
    events: [
      { id: 'monthly-meeting', name: 'Monthly meeting', img: 'event-monthly-meeting.webp', when: 'Every first Thursday · CIUP', langs: [], kw: ['meeting', 'monthly', 'team', 'ciup', 'members'], badge: '' },
      { id: 'karaoke-night', name: 'Karaoke night!', img: 'event-karaoke-night.webp', when: 'Tue 22 Sep', langs: [], kw: ['karaoke', 'singing', 'music', 'party', 'sing'], badge: '' },
      { id: 'pie-degustation', name: 'PIE Degustation!!', img: 'event-pie-degustation.webp', when: 'Date to be announced', langs: [], kw: ['pie', 'food', 'degustation', 'tasting', 'baking', 'eat'], badge: '' }
    ],
    stories: [
      { id: 'finding-my-first-familiar-faces', name: 'Finding my first familiar faces', img: 'story-familiar-faces.webp', sub: 'Aya Tanaka · Settling in', kw: ['friends', 'friendship', 'meeting people', 'new', 'shy', 'hello'], badge: 'Example' },
      { id: 'paris-one-small-routine', name: 'Paris, one small routine at a time', img: 'story-paris-routine.webp', sub: 'Mateo Silva · Everyday Paris', kw: ['routine', 'home', 'city', 'neighbourhood', 'everyday'], badge: 'Example' },
      { id: 'the-afternoon-i-said-yes', name: 'The afternoon I said yes', img: 'story-volunteering.webp', sub: 'Lina Moreau · Getting involved', kw: ['volunteer', 'volunteering', 'helping', 'getting involved', 'yes'], badge: 'Example' },
      { id: 'a-small-plan-for-a-shared-kitchen', name: 'A small plan for a shared kitchen', img: 'story-shared-kitchen.webp', sub: 'Salma Nouri · Student life', kw: ['cooking', 'kitchen', 'groceries', 'meals', 'food'], badge: 'Example' },
      { id: 'joining-a-game-without-knowing-the-rules', name: 'Joining a game without knowing the rules', img: 'story-first-game.webp', sub: 'Elias Lind · Meeting people', kw: ['board games', 'games', 'beginner', 'joining', 'meeting people'], badge: 'Example' },
      { id: 'leaving-paris-keeping-in-touch', name: 'Leaving Paris, keeping in touch', img: 'story-keeping-in-touch.webp', sub: 'Aminata Diop · Alumni connections', kw: ['leaving', 'alumni', 'goodbye', 'keeping in touch', 'moving'], badge: 'Example' },
      { id: 'putting-the-camera-down', name: 'Putting the camera down', img: 'story-camera-pause.webp', sub: 'Chen Wei · Noticing the city', kw: ['photography', 'camera', 'photo', 'noticing'], badge: 'Example' },
      { id: 'asking-people-to-slow-down', name: 'Asking people to slow down', img: 'story-finding-the-words.webp', sub: 'Kavya Rao · Finding the words', kw: ['language', 'french', 'conversation', 'slow', 'words'], badge: 'Example' },
      { id: 'a-study-session-one-small-question', name: 'A study session, one small question', img: 'story-study-question.webp', sub: 'Arjun Mehta · Studying together', kw: ['study', 'studying', 'library', 'course', 'class'], badge: 'Example' },
      { id: 'making-room-for-a-quiet-weekend', name: 'Making room for a quiet weekend', img: 'story-quiet-weekend.webp', sub: 'Beatriz Costa · Finding your pace', kw: ['quiet', 'rest', 'tired', 'weekend', 'alone'], badge: 'Example' },
      { id: 'a-handover-that-fit-on-one-page', name: 'A handover that fit on one page', img: 'story-one-page-handover.webp', sub: 'Imane Benali · Passing things on', kw: ['handover', 'volunteer', 'role', 'passing on'], badge: 'Example' },
      { id: 'making-a-plan-people-could-actually-join', name: 'Making a plan people could actually join', img: 'story-making-a-plan.webp', sub: 'Yuting Lin · Small plans', kw: ['plan', 'planning', 'scheduling', 'organizing', 'join'], badge: 'Example' }
    ]
  };

  const TYPES = {
    member: { label: 'SOMEONE TO MEET', link: 'View profile', page: './members.html#' },
    event: { label: 'SOMETHING TO JOIN', link: 'View event', page: './events.html#' },
    story: { label: 'SOMETHING TO READ', link: 'Read the story', page: './experiences.html#' }
  };
  const POOL_BY_KIND = { member: POOL.members, event: POOL.events, story: POOL.stories };

  const LANG_ALIASES = { '中文': ['chinese', 'mandarin'], '汉语': ['chinese', 'mandarin'], '普通话': ['mandarin'], 'français': ['french'], 'francais': ['french'], '日本語': ['japanese'], 'nihongo': ['japanese'], 'español': ['spanish'], 'espanol': ['spanish'], 'italiano': ['italian'] };
  const ZH_TERMS = { '法语': 'french', '英文': 'english', '英语': 'english', '中文': 'chinese mandarin', '汉语': 'chinese mandarin', '普通话': 'mandarin', '日语': 'japanese', '西班牙语': 'spanish', '意大利语': 'italian', '摄影': 'photography', '照片': 'photo', '拍照': 'photography', '跑步': 'running', '跑': 'run', '慢跑': 'running', '徒步': 'hiking', '爬山': 'hiking', '桌游': 'board games', '游戏': 'games', '咖啡': 'coffee cafe', '咖啡馆': 'cafe', '艺术': 'art', '画廊': 'gallery', '画画': 'sketching', '写生': 'sketch walk', '读书': 'books reading', '书': 'books', '电影': 'film cinema', '做饭': 'cooking', '烹饪': 'cooking', '音乐': 'music', '健身房': 'gym', '健身': 'gym', '篮球': 'basketball', '排球': 'volleyball', '足球': 'football soccer', '滑雪': 'ski skiing', '编程': 'coding programming', '代码': 'coding', '计算机': 'computer science', '生物': 'biology', '科学': 'science', '安静': 'quiet', '周末': 'weekend', '累': 'tired', '害羞': 'shy', '内向': 'shy', '朋友': 'friends meeting people', '认识': 'meeting people', '聊天': 'conversation', '口语': 'practice conversation', '练习': 'practice', '学习': 'study', '考试': 'exams', '图书馆': 'library', '新生': 'new', '新来': 'new' };
  const AR_TERMS = { 'التصوير': 'photography photo', 'فوتوغرافيا': 'photography', 'كاميرا': 'camera', 'جديد': 'new', 'جديدة': 'new', 'الفرنسية': 'french', 'فرنسي': 'french', 'الإنجليزية': 'english', 'إنجليزي': 'english', 'العربية': 'arabic', 'لغة': 'language', 'اللغات': 'languages', 'قهوة': 'coffee cafe', 'مقهى': 'cafe', 'أصدقاء': 'friends meeting people', 'صديق': 'friends', 'التعارف': 'meeting people', 'كرة السلة': 'basketball', 'كرة القدم': 'football soccer', 'الجري': 'running run', 'أركض': 'running', 'رياضة': 'sport', 'موسيقى': 'music', 'طبخ': 'cooking', 'الطهي': 'cooking', 'طعام': 'food', 'كتب': 'books', 'قراءة': 'books reading', 'أفلام': 'film cinema', 'سينما': 'cinema', 'فن': 'art', 'رسم': 'sketch sketching', 'دراسة': 'study', 'الدراسة': 'study', 'امتحانات': 'exams', 'مكتبة': 'library', 'هادئ': 'quiet', 'الهدوء': 'quiet', 'متعب': 'tired', 'نهاية الأسبوع': 'weekend', 'خجول': 'shy', 'الخجل': 'shy', 'ألعاب اللوح': 'board games', 'ألعاب': 'games', 'مشي': 'walk walking', 'نهر': 'river seine', 'طبيعة': 'nature', 'سفر': 'travel travelling', 'بيئة': 'environment', 'شعر': 'poems poetry', 'حفلات': 'party' };

  const ACCENTS = { 'á':'a','à':'a','â':'a','é':'e','è':'e','ê':'e','ë':'e','í':'i','ì':'i','î':'i','ó':'o','ò':'o','ô':'o','ö':'o','ú':'u','ù':'u','û':'u','ü':'u','ç':'c','ñ':'n' };
  const stripAccents = (value) => value.replace(/[à-ÿ]/g, (ch) => ACCENTS[ch] || ch);
  const expandTerms = (run, map) => {
    let out = '';
    for (const term of Object.keys(map)) if (run.includes(term)) out += ' ' + map[term];
    return out;
  };
  const expandNonLatin = (value) => value.replace(/([\u4e00-\u9fff]+)|([\u0600-\u06FF]+)/g, (run) => expandTerms(run, ZH_TERMS) + expandTerms(run, AR_TERMS));
  const tokenize = (value) => (' ' + stripAccents(expandNonLatin(value.toLowerCase())).replace(/[^a-z0-9]+/gi, ' ').replace(/\s+/g, ' ') + ' ');
  const hasWord = (tokens, phrase) => tokens.includes(' ' + phrase + ' ') || tokens.includes(' ' + phrase + 's ');

  function pick(list, interestTokens, langSet) {
    let winner = null;
    for (const entry of list) {
      const kwHits = new Set();
      const langHits = new Set();
      for (const phrase of entry.kw) if (hasWord(interestTokens, phrase)) kwHits.add(phrase);
      for (const lang of entry.langs || []) if (langSet.has(lang)) langHits.add(lang);
      const score = kwHits.size * 2 + langHits.size;
      if (!winner || score > winner.score) {
        winner = { entry, hits: [...new Set([...kwHits, ...langHits])].slice(0, 3), score };
      }
    }
    return winner;
  }

  function languagesFrom(tokens) {
    const langSet = new Set();
    for (const lang of ['english', 'french', 'chinese', 'mandarin', 'japanese', 'spanish', 'italian', 'portuguese', 'german', 'arabic', 'hindi', 'swedish', 'serbian', 'korean', 'russian', 'dutch', 'polish', 'turkish']) {
      if (tokens.includes(' ' + lang + ' ')) langSet.add(lang);
    }
    return langSet;
  }

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  function cardHtml(kind, entry, reasonText) {
    const type = TYPES[kind];
    const badge = entry.badge ? ` <span class="finder-demo">${entry.badge}</span>` : '';
    const detail = entry.when || entry.sub || '';
    const reason = reasonText
      ? escapeHtml(reasonText)
      : `Matches: ${escapeHtml(entry._hits ? entry._hits.join(', ') : '')}${detail ? ' · ' + escapeHtml(detail) : ''}`;
    return (
      `<article class="finder-card">
        <figure class="finder-photo"><img src="./assets/${entry.img}" alt="" width="320" height="240" loading="lazy" decoding="async" /></figure>
        <div class="finder-body">
          <p class="finder-type">${type.label}</p>
          <h3>${escapeHtml(entry.name)}${badge}</h3>
          <p class="finder-reason">${reason}</p>
          <a class="finder-link" href="${type.page}${entry.id}">${type.link} <span aria-hidden="true">↗</span></a>
        </div>
      </article>`
    );
  }

  function setMode(mode) {
    if (!modeBadge) return;
    if (mode === 'ai') {
      modeBadge.textContent = 'AI match';
      modeBadge.className = 'finder-mode finder-mode--ai';
      modeBadge.hidden = false;
    } else if (mode === 'preview') {
      modeBadge.textContent = 'Preview match';
      modeBadge.className = 'finder-mode finder-mode--preview';
      modeBadge.hidden = false;
    } else {
      modeBadge.hidden = true;
    }
  }

  const SKELETON_CARD =
    '<article class="finder-card finder-card--skeleton" aria-hidden="true">' +
    '<div class="finder-photo"></div>' +
    '<div class="finder-body"><span class="sk sk-title"></span><span class="sk"></span><span class="sk sk-short"></span></div>' +
    '</article>';

  function showSkeletons() {
    setMode(null);
    if (summaryEl) summaryEl.hidden = true;
    noteEl.textContent = '';
    grid.innerHTML = SKELETON_CARD + SKELETON_CARD + SKELETON_CARD;
    results.removeAttribute('dir');
    results.removeAttribute('lang');
    results.hidden = false;
  }

  function renderPreview() {
    const tokens = tokenize(input.value || '');
    const langSet = languagesFrom(tokens);
    grid.innerHTML = '';
    for (const [kind, list] of Object.entries(POOL_BY_KIND)) {
      const match = pick(list, tokens, langSet);
      match.entry._hits = match.hits;
      grid.insertAdjacentHTML('beforeend', cardHtml(kind, match.entry));
    }
    setMode('preview');
    if (summaryEl) summaryEl.hidden = true;
    noteEl.textContent = 'Offline preview — keyword matching from the directory. AI matching needs a connection to the PIE service.';
    results.removeAttribute('dir');
    results.removeAttribute('lang');
    results.hidden = false;
  }

  function renderAi(data) {
    grid.innerHTML = '';
    let shown = 0;
    for (const kind of ['member', 'event', 'story']) {
      const p = data[kind];
      if (!p || !p.id) continue;
      const entry = POOL_BY_KIND[kind].find((e) => e.id === p.id);
      if (!entry) continue;
      grid.insertAdjacentHTML('beforeend', cardHtml(kind, entry, p.reason));
      shown += 1;
    }
    if (!shown) return false;
    setMode('ai');
    if (summaryEl) {
      summaryEl.textContent = data.summary || '';
      summaryEl.hidden = !data.summary;
    }
    noteEl.textContent = data.note || '';
    const lang = (data.language || '').toLowerCase();
    if (lang) results.setAttribute('lang', lang);
    results.setAttribute('dir', RTL_LANGS.has(lang) ? 'rtl' : 'ltr');
    results.hidden = false;
    return true;
  }

  async function aiSuggest(text) {
    for (const url of AI_ENDPOINTS) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: text }),
          signal: AbortSignal.timeout(15000)
        });
        if (!resp.ok) continue;
        const data = await resp.json();
        if (data && data.mode === 'ai') return data;
      } catch (err) { /* try the next endpoint */ }
    }
    return null;
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.classList.toggle('is-loading', loading);
    submitBtn.disabled = loading;
    if (submitLabel) submitLabel.textContent = loading ? 'Thinking' : 'Find my PIE';
  }

  let busy = false;
  async function run() {
    if (busy) return;
    busy = true;
    const started = Date.now();
    setLoading(true);
    showSkeletons();
    let data = null;
    try {
      data = await aiSuggest(input.value.trim());
    } catch (err) { data = null; }
    // Keep the loading state perceptible even when the answer (or a failure)
    // arrives instantly, so the UI never flashes or feels jumpy.
    const elapsed = Date.now() - started;
    if (elapsed < 700) await new Promise((resolve) => setTimeout(resolve, 700 - elapsed));
    setLoading(false);
    busy = false;
    if (!data || !renderAi(data)) renderPreview();
  }

  if (finderReady) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      run();
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        run();
      }
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 138) + 'px';
    });

    for (const chip of document.querySelectorAll('.finder-example')) {
      chip.addEventListener('click', () => {
        input.value = chip.textContent.trim();
        input.dispatchEvent(new Event('input'));
        input.focus();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Account service: join page (register / claim / edit) and directory sync.
  // ---------------------------------------------------------------------------
  const ACCOUNT_API = 'https://pie-recommend.zixuangui.workers.dev';
  const TOKEN_KEY = 'pie-token';

  const apiFetch = async (path, options = {}) => {
    try {
      const resp = await fetch(ACCOUNT_API + path, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        signal: AbortSignal.timeout(20000)
      });
      let data = null;
      try { data = await resp.json(); } catch (err) { data = null; }
      return { ok: resp.ok, status: resp.status, data };
    } catch (err) {
      return { ok: false, status: 0, data: null };
    }
  };

  const photoUrl = (value) => (value && value.startsWith('/photo/') ? ACCOUNT_API + value : value);
  const initials = (name) => String(name || '?').split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';

  // ---------------------------------------------------------------------------
  // Shared session state: every page asks once who is signed in, then updates
  // the account links so the site never offers "Join" to a signed-in member.
  // ---------------------------------------------------------------------------
  const session = { token: localStorage.getItem(TOKEN_KEY) || '', email: '', profileId: null, profile: null };
  let sessionPending = null;

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    session.token = '';
    session.email = '';
    session.profileId = null;
    session.profile = null;
  };

  const loadSession = () => {
    if (sessionPending) return sessionPending;
    sessionPending = session.token
      ? apiFetch('/me', { headers: { Authorization: 'Bearer ' + session.token } }).then(({ ok, data }) => {
          if (!ok || !data) { clearSession(); return null; }
          session.email = data.email || '';
          session.profileId = data.profileId || null;
          session.profile = data.profile || null;
          return session;
        })
      : Promise.resolve(null);
    return sessionPending;
  };

  function applyAccountUI() {
    loadSession().then((active) => {
      if (!active) return;
      const name = firstName(active.profile && active.profile.name) || 'there';
      for (const link of document.querySelectorAll('[data-account-link]')) {
        link.textContent = `Hi, ${name} · My profile`;
      }
      // Copy that only makes sense before signing in.
      for (const el of document.querySelectorAll('[data-account-hint]')) el.hidden = true;
      for (const el of document.querySelectorAll('[data-account-cta]')) el.textContent = 'Edit your profile';
      // Mark the signed-in member's own card in the directory.
      if (active.profileId) {
        const card = document.getElementById(active.profileId);
        if (card && !card.querySelector('.member-you')) {
          card.classList.add('member-card--you');
          const tag = document.createElement('span');
          tag.className = 'member-you';
          tag.textContent = 'This is you';
          const link = document.createElement('a');
          link.className = 'member-you-edit';
          link.href = './join.html';
          link.innerHTML = 'Edit <span aria-hidden="true">↗</span>';
          const identity = card.querySelector('.member-identity');
          if (identity) identity.append(tag, link);
        }
      }
    });
  }
  applyAccountUI();

  // One shared request for the registered profiles, reused by the pool merge
  // and the directory merge.
  let profilesPending = null;
  const profilesOnce = () => {
    if (!profilesPending) profilesPending = apiFetch('/profiles');
    return profilesPending;
  };

  // Registered members join the recommendation pool so the AI can suggest them
  // and the offline keyword preview can render their cards.
  if (typeof POOL !== 'undefined' && POOL.members) {
    profilesOnce().then(({ ok, data }) => {
      if (!ok || !data) return;
      for (const record of data.dynamic || []) {
        if (POOL.members.some((member) => member.id === record.id)) continue;
        POOL.members.push({
          id: record.id,
          name: record.name,
          img: photoUrl(record.photo) || '',
          sub: [record.role, record.country].filter(Boolean).join(' · ') || 'Community member',
          langs: [],
          kw: (record.tags || []).map((tag) => String(tag).toLowerCase()),
          badge: 'Member'
        });
      }
    });
  }

  function dynamicCard(record) {
    const role = [record.role, record.country].filter(Boolean).join(' · ') || 'Community member';
    const tags = (record.tags || []).map((tag) => `<li>${escapeHtml(tag)}</li>`).join('');
    const photo = record.photo
      ? `<div class="member-portrait member-portrait--photo member-portrait--member"><img src="${escapeHtml(photoUrl(record.photo))}" alt="Portrait of ${escapeHtml(record.name)}" width="480" height="480" loading="lazy" decoding="async" /></div>`
      : `<span class="member-portrait member-portrait--initials" aria-hidden="true">${escapeHtml(initials(record.name))}</span>`;
    const contact = record.email
      ? `<dl class="member-contact"><dt>Email</dt><dd><a href="mailto:${escapeHtml(record.email)}">${escapeHtml(record.email)}</a></dd></dl>`
      : '';
    const summary = record.summary ? `<p class="card-summary">${escapeHtml(record.summary)}</p>` : '';
    return (
      `<article class="member-card" id="${escapeHtml(record.id)}">
        <div class="member-card-header">${photo}
          <div class="member-identity">
            <h2>${escapeHtml(record.name)}</h2>
            <p class="member-role">${escapeHtml(role)}</p>
            <span class="member-status member-status--member">Member</span>
          </div>
        </div>
        ${summary}
        ${tags ? `<ul class="tag-list" aria-label="Interests">${tags}</ul>` : ''}
        ${contact}
      </article>`
    );
  }

  // Members page: apply registered edits to existing cards and append new members.
  const memberGrid = document.getElementById('member-grid');
  if (memberGrid) {
    const setField = (card, selector, value, hideWhenEmpty) => {
      const el = card.querySelector(selector);
      if (!el) return;
      el.textContent = value || '';
      if (hideWhenEmpty) el.hidden = !value;
    };

    // The server returns the member's complete profile, so every field is
    // applied as written — clearing a field clears it on the card too.
    const applyPatch = (card, patch) => {
      setField(card, 'h2', patch.name, false);
      setField(card, '.member-role', [patch.role, patch.country].filter(Boolean).join(' · '), true);
      setField(card, '.card-summary', patch.summary, true);

      const list = card.querySelector('.tag-list');
      if (list) {
        list.innerHTML = '';
        for (const tag of patch.tags || []) {
          const li = document.createElement('li');
          li.textContent = tag;
          list.appendChild(li);
        }
        list.hidden = !(patch.tags || []).length;
      }

      const contact = card.querySelector('.member-contact');
      const dd = card.querySelector('.member-contact dd');
      if (contact && dd) {
        dd.innerHTML = '';
        if (patch.email) {
          const link = document.createElement('a');
          link.href = 'mailto:' + patch.email;
          link.textContent = patch.email;
          dd.appendChild(link);
          contact.hidden = false;
        } else {
          contact.hidden = true;
        }
      }

      if (patch.photo) {
        const img = card.querySelector('.member-portrait img');
        if (img) img.src = photoUrl(patch.photo);
      }
    };

    profilesOnce().then(({ ok, data }) => {
      if (!ok || !data) return;
      for (const [id, patch] of Object.entries(data.patched || {})) {
        const card = document.getElementById(id);
        if (card) applyPatch(card, patch);
      }
      for (const record of data.dynamic || []) memberGrid.insertAdjacentHTML('beforeend', dynamicCard(record));
    });
  }

  // Join page: email code, verification, profile editing.
  const joinForm = document.getElementById('join-step-profile');
  if (joinForm) {
    const el = (id) => document.getElementById(id);
    const ui = {
      emailStep: el('join-step-email'), email: el('join-email'), send: el('join-send'), emailHint: el('join-email-hint'),
      codeStep: el('join-step-code'), code: el('join-code'), verify: el('join-verify'),
      codeHint: el('join-code-hint'), verifyHint: el('join-verify-hint'),
      signedIn: el('join-signed-in'), signedInWho: el('join-signed-in-who'), switchAccount: el('join-switch'),
      profileHint: el('join-profile-hint'), name: el('join-name'), role: el('join-role'), country: el('join-country'),
      tags: el('join-tags'), summary: el('join-summary'), photo: el('join-photo'), preview: el('join-photo-preview'),
      save: el('join-save'), saveHint: el('join-save-hint'),
      signout: el('join-signout'), topSignout: el('join-top-signout'), del: el('join-delete')
    };
    let photoData = '';

    // The page explains the demo behaviour only while no mail key is configured.
    const modeNote = document.getElementById('join-mode-note');
    if (modeNote) {
      apiFetch('/config').then(({ ok, data }) => {
        if (!ok || !data) return;
        if (data.emailEnabled) {
          modeNote.textContent = 'We will email you a six-digit code. It expires after ten minutes.';
        }
      });
    }

    const status = (node, text, kind) => {
      if (!node) return;
      node.textContent = text || '';
      node.className = 'join-hint join-hint--status' + (kind ? ' is-' + kind : '');
    };

    const fillForm = (profile) => {
      ui.name.value = (profile && profile.name) || '';
      ui.role.value = (profile && profile.role) || '';
      ui.country.value = (profile && profile.country) || '';
      ui.tags.value = ((profile && profile.tags) || []).join(', ');
      ui.summary.value = (profile && profile.summary) || '';
      ui.del.hidden = !(profile && profile.dynamic);
      ui.preview.hidden = !(profile && profile.photo);
      if (profile && profile.photo) ui.preview.src = photoUrl(profile.photo);
    };

    const showSignedIn = (email, message) => {
      ui.emailStep.hidden = true;
      ui.codeStep.hidden = true;
      ui.signedIn.hidden = false;
      ui.signedInWho.textContent = email;
      joinForm.hidden = false;
      ui.profileHint.textContent = message;
    };

    const showSignedOut = (message, kind) => {
      ui.emailStep.hidden = false;
      ui.codeStep.hidden = true;
      ui.signedIn.hidden = true;
      joinForm.hidden = true;
      ui.email.value = '';
      ui.code.value = '';
      if (message) status(ui.emailHint, message, kind || 'ok');
    };

    ui.send.addEventListener('click', async () => {
      const email = ui.email.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status(ui.emailHint, 'Please enter a valid email address.', 'error');
        return;
      }
      ui.send.disabled = true;
      status(ui.emailHint, 'Sending the code…');
      const { ok, data } = await apiFetch('/auth/code', { method: 'POST', body: JSON.stringify({ email }) });
      ui.send.disabled = false;
      if (!ok) {
        status(ui.emailHint, (data && data.error) || 'Could not send the code. Please try again.', 'error');
        return;
      }
      ui.codeStep.hidden = false;
      if (data.devCode) {
        status(ui.emailHint, `Demo mode — your code is ${data.devCode}`, 'ok');
        ui.code.value = data.devCode;
      } else {
        status(ui.emailHint, 'Code sent. Please check your inbox.', 'ok');
      }
      if (data.knownProfile) {
        status(ui.codeHint, `We found an existing profile for this address: ${data.knownProfile.name}.`, 'ok');
      } else {
        status(ui.codeHint, 'Enter the six-digit code to continue.');
      }
      ui.code.focus();
    });

    ui.verify.addEventListener('click', async () => {
      const email = ui.email.value.trim().toLowerCase();
      const code = ui.code.value.trim();
      if (code.length < 6) {
        status(ui.verifyHint, 'Please enter the six-digit code.', 'error');
        return;
      }
      ui.verify.disabled = true;
      status(ui.verifyHint, 'Checking the code…');
      const { ok, data } = await apiFetch('/auth/verify', { method: 'POST', body: JSON.stringify({ email, code }) });
      ui.verify.disabled = false;
      if (!ok) {
        status(ui.verifyHint, (data && data.error) || 'Verification failed.', 'error');
        return;
      }
      session.token = data.token;
      localStorage.setItem(TOKEN_KEY, data.token);
      session.email = email;
      session.profileId = data.profileId || null;
      session.profile = data.profile || null;
      status(ui.verifyHint, 'Verified.', 'ok');
      fillForm(data.profile);
      showSignedIn(email, data.isExisting
        ? `This address is linked to the existing profile “${data.profile ? data.profile.name : ''}” — saving updates that card.`
        : 'Saving adds a new profile to the member directory.');
      joinForm.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });

    ui.photo.addEventListener('change', () => {
      const file = ui.photo.files && ui.photo.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const size = 400;
          const min = Math.min(image.width, image.height);
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          canvas.getContext('2d').drawImage(image, (image.width - min) / 2, (image.height - min) / 2, min, min, 0, 0, size, size);
          photoData = canvas.toDataURL('image/jpeg', 0.82);
          ui.preview.src = photoData;
          ui.preview.hidden = false;
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

    joinForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        name: ui.name.value.trim(),
        role: ui.role.value.trim(),
        country: ui.country.value.trim(),
        summary: ui.summary.value.trim(),
        tags: ui.tags.value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 8)
      };
      if (photoData) payload.photo = photoData;
      ui.save.disabled = true;
      status(ui.saveHint, 'Saving…');
      const { ok, data } = await apiFetch('/profile', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.token },
        body: JSON.stringify(payload)
      });
      ui.save.disabled = false;
      if (!ok) {
        status(ui.saveHint, (data && data.error) || 'Could not save the profile.', 'error');
        return;
      }
      status(ui.saveHint, 'Saved. Your profile will appear in the member directory within a minute.', 'ok');
      if (data && data.profile) {
        session.profile = data.profile;
        session.profileId = data.profile.id;
        ui.del.hidden = !data.profile.dynamic;
      }
      photoData = '';
    });

    const signOut = (message) => {
      clearSession();
      sessionPending = null;
      ui.del.hidden = true;
      photoData = '';
      showSignedOut(message);
      ui.emailStep.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };

    ui.signout.addEventListener('click', () => signOut('Signed out.'));
    if (ui.topSignout) ui.topSignout.addEventListener('click', () => signOut('Signed out.'));
    ui.switchAccount.addEventListener('click', () => signOut('Signed out. Enter another address to continue.'));

    ui.del.addEventListener('click', async () => {
      if (!window.confirm('Delete your profile from the directory? This cannot be undone.')) return;
      const { ok } = await apiFetch('/profile', { method: 'DELETE', headers: { Authorization: 'Bearer ' + session.token } });
      if (!ok) {
        status(ui.saveHint, 'Could not delete the profile.', 'error');
        return;
      }
      signOut('Your profile was deleted.');
    });

    // Resume an existing session so returning members land straight on the form.
    const hadToken = !!session.token;
    loadSession().then((active) => {
      if (!active) {
        showSignedOut(hadToken ? 'Your session expired — please verify your email again.' : '', hadToken ? 'error' : null);
        return;
      }
      ui.email.value = active.email;
      fillForm(active.profile);
      showSignedIn(active.email, active.profileId
        ? 'Saving updates your existing card in the directory.'
        : 'Saving adds a new profile to the member directory.');
    });
  }
  // ---------------------------------------------------------------------------
  // Events page: next monthly meeting date and the community idea board.
  // ---------------------------------------------------------------------------
  const firstThursday = (year, month) => {
    const d = new Date(year, month, 1);
    d.setDate(1 + ((4 - d.getDay() + 7) % 7));   // 4 = Thursday
    return d;
  };
  const nextMonthlyMeeting = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let candidate = firstThursday(today.getFullYear(), today.getMonth());
    if (candidate < today) candidate = firstThursday(today.getFullYear(), today.getMonth() + 1);
    return candidate;
  };
  const meetingTargets = ['next-meeting-date', 'preview-meeting-date']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (meetingTargets.length) {
    const meeting = nextMonthlyMeeting();
    const label = meeting.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    const iso = meeting.getFullYear() + '-' + String(meeting.getMonth() + 1).padStart(2, '0') + '-' + String(meeting.getDate()).padStart(2, '0');
    for (const node of meetingTargets) {
      node.setAttribute('datetime', iso);
      node.textContent = label;
    }
  }

  const ideaForm = document.getElementById('idea-form');
  if (ideaForm) {
    const list = document.getElementById('ideas-list');
    const empty = document.getElementById('ideas-empty');
    const signin = document.getElementById('ideas-signin');
    const text = document.getElementById('idea-text');
    const nameField = document.getElementById('idea-name');
    const titleField = document.getElementById('idea-title');
    const dateField = document.getElementById('idea-date');
    const timeField = document.getElementById('idea-time');
    const placeField = document.getElementById('idea-place');
    const flexibleField = document.getElementById('idea-flexible');
    const detailsBox = document.getElementById('idea-details');
    const cancelEdit = document.getElementById('idea-cancel');
    const submitLabel = document.querySelector('#idea-submit .finder-submit-label');
    let editingId = '';
    const hint = document.getElementById('idea-hint');
    const submit = document.getElementById('idea-submit');
    let myProfileId = null;

    const setHint = (message, kind) => {
      hint.textContent = message || '';
      hint.className = 'join-hint join-hint--status' + (kind ? ' is-' + kind : '');
    };

    let ideasCache = [];
    const renderIdeas = (ideas) => {
      ideasCache = ideas;
      list.innerHTML = '';
      empty.hidden = ideas.length > 0;
      for (const idea of ideas) {
        const card = document.createElement('article');
        card.className = 'idea-card';
        if (idea.title) {
          const heading = document.createElement('h3');
          heading.className = 'idea-title';
          heading.textContent = idea.title;
          card.appendChild(heading);
        }
        const body = document.createElement('p');
        body.textContent = idea.text;
        card.appendChild(body);

        const chips = [];
        if (idea.date) {
          const when = new Date(idea.date + 'T00:00:00');
          chips.push(when.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
        }
        if (idea.time) chips.push(idea.time);
        if (idea.place) chips.push(idea.place);
        if (idea.dateFlexible) chips.push('Date flexible');
        if (chips.length) {
          const tags = document.createElement('p');
          tags.className = 'idea-tags';
          for (const value of chips) {
            const tag = document.createElement('span');
            tag.className = 'idea-tag';
            tag.textContent = value;
            tags.appendChild(tag);
          }
          card.appendChild(tags);
        }

        const meta = document.createElement('p');
        meta.className = 'idea-meta';
        if (idea.authorId && idea.authorName) {
          const link = document.createElement('a');
          link.href = './members.html#' + idea.authorId;
          link.textContent = idea.authorName;
          meta.appendChild(link);
        } else {
          const anon = document.createElement('span');
          anon.textContent = idea.authorName || 'Anonymous';
          meta.appendChild(anon);
        }
        const when = document.createElement('span');
        when.textContent = new Date(idea.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        meta.appendChild(when);
        if (myProfileId && idea.authorId === myProfileId) {
          const edit = document.createElement('button');
          edit.type = 'button';
          edit.className = 'idea-delete';
          edit.textContent = 'Edit';
          edit.addEventListener('click', () => startEdit(idea));
          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'idea-delete';
          del.textContent = 'Delete';
          del.addEventListener('click', async () => {
            const { ok } = await apiFetch('/ideas/' + idea.id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + session.token } });
            if (ok) loadIdeas();
          });
          meta.append(edit, del);
        }
        card.appendChild(meta);
        list.appendChild(card);
      }
    };

    const resetForm = () => {
      editingId = '';
      text.value = '';
      titleField.value = '';
      dateField.value = '';
      timeField.value = '';
      placeField.value = '';
      flexibleField.checked = false;
      detailsBox.open = false;
      submitLabel.textContent = 'Submit idea';
      cancelEdit.hidden = true;
    };

    const startEdit = (idea) => {
      editingId = idea.id;
      text.value = idea.text || '';
      titleField.value = idea.title || '';
      dateField.value = idea.date || '';
      timeField.value = idea.time || '';
      placeField.value = idea.place || '';
      flexibleField.checked = !!idea.dateFlexible;
      detailsBox.open = true;
      submitLabel.textContent = 'Save changes';
      cancelEdit.hidden = false;
      setHint('Editing your idea.', null);
      ideaForm.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    cancelEdit.addEventListener('click', () => {
      resetForm();
      setHint('Edit cancelled.', null);
    });

    const loadIdeas = async () => {
      const { ok, data } = await apiFetch('/ideas');
      renderIdeas(ok && data ? data.ideas || [] : []);
    };

    loadSession().then((active) => {
      if (active) {
        myProfileId = active.profileId || null;
        ideaForm.hidden = false;
        signin.hidden = true;
        nameField.value = (active.profile && active.profile.name) || '';
      } else {
        ideaForm.hidden = true;
        signin.hidden = false;
      }
      loadIdeas();
    });

    ideaForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const value = text.value.trim();
      if (value.length < 4) { setHint('Please write a few more words.', 'error'); return; }
      submit.disabled = true;
      setHint(editingId ? 'Saving…' : 'Posting…');
      const payload = {
        text: value,
        name: nameField.value.trim(),
        title: titleField.value.trim(),
        date: dateField.value,
        time: timeField.value,
        place: placeField.value.trim(),
        dateFlexible: flexibleField.checked
      };
      const target = editingId ? '/ideas/' + editingId : '/ideas';
      const { ok, data } = await apiFetch(target, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.token },
        body: JSON.stringify(payload)
      });
      submit.disabled = false;
      if (!ok) { setHint((data && data.error) || 'Could not save the idea.', 'error'); return; }
      const wasEditing = !!editingId;
      const saved = data && data.idea ? data.idea : null;
      resetForm();
      setHint(wasEditing ? 'Saved — the idea has been updated.' : 'Posted — your idea is on the board.', 'ok');
      // The write is visible to this browser immediately; the shared list
      // catches up once the edge cache refreshes.
      if (saved) {
        if (wasEditing) {
          const known = ideasCache.some((item) => item.id === saved.id);
          renderIdeas(known
            ? ideasCache.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...ideasCache]);
        } else {
          renderIdeas([saved, ...ideasCache.filter((item) => item.id !== saved.id)]);
        }
      } else {
        loadIdeas();
      }
    });
  }
})();
