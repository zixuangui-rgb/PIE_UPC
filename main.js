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
      { id: 'lina-moreau', name: 'Lina Moreau', img: 'member-lina.webp', sub: 'Welcome buddy · France', langs: ['english', 'french'], kw: ['photography', 'photo', 'city walks', 'walking', 'neighbourhood'], badge: 'Demo' },
      { id: 'mateo-silva', name: 'Mateo Silva', img: 'member-mateo.webp', sub: 'Event volunteer · Brazil', langs: ['english', 'portuguese'], kw: ['music', 'cafes', 'meetups', 'meeting people'], badge: 'Demo' },
      { id: 'aya-tanaka', name: 'Aya Tanaka', img: 'member-aya.webp', sub: 'Community member · Japan', langs: ['english', 'japanese'], kw: ['art', 'gallery', 'galleries', 'coffee', 'sketching', 'sketch'], badge: 'Demo' },
      { id: 'salma-nouri', name: 'Salma Nouri', img: 'member-salma.webp', sub: 'Community member · Morocco', langs: ['arabic', 'french'], kw: ['cooking', 'food', 'film', 'cinema', 'movies'], badge: 'Demo' },
      { id: 'elias-lind', name: 'Elias Lind', img: 'member-elias.webp', sub: 'Event volunteer · Sweden', langs: ['english', 'swedish'], kw: ['board games', 'games', 'outdoors', 'hiking'], badge: 'Demo' },
      { id: 'priya-nair', name: 'Priya Nair', img: 'member-priya.webp', sub: 'Alumni · India', langs: ['english', 'hindi'], kw: ['books', 'reading', 'student life'], badge: 'Demo' },
      { id: 'jonas-weber', name: 'Jonas Weber', img: 'member-jonas.webp', sub: 'Welcome buddy · Germany', langs: ['english', 'german'], kw: ['urban walks', 'walk', 'walking', 'board games', 'games'], badge: 'Demo' },
      { id: 'giulia-rossi', name: 'Giulia Rossi', img: 'member-giulia.webp', sub: 'Volunteer · Italy', langs: ['english', 'italian'], kw: ['sketching', 'sketch', 'draw', 'language exchange', 'language'], badge: 'Demo' },
      { id: 'camila-torres', name: 'Camila Torres', img: 'member-camila.webp', sub: 'Community member · Mexico', langs: ['spanish', 'english'], kw: ['reading', 'books', 'cycling', 'bike'], badge: 'Demo' },
      { id: 'aminata-diop', name: 'Aminata Diop', img: 'member-aminata.webp', sub: 'Alumni · Senegal', langs: ['french', 'english'], kw: ['peer support', 'support', 'student life', 'settling'], badge: 'Demo' },
      { id: 'chen-wei', name: 'Chen Wei', img: 'member-chen-wei.webp', sub: 'Community member · China', langs: ['english', 'mandarin'], kw: ['photography', 'photo', 'badminton', 'camera'], badge: 'Demo' },
      { id: 'louis-bernard', name: 'Louis Bernard', img: 'member-louis-bernard.webp', sub: 'Event volunteer · France', langs: ['french', 'english'], kw: ['cycling', 'bike', 'music'], badge: 'Demo' },
      { id: 'arjun-mehta', name: 'Arjun Mehta', img: 'member-arjun-mehta.webp', sub: 'Community member · India', langs: ['english', 'hindi'], kw: ['data science', 'data', 'photography', 'photo'], badge: 'Demo' },
      { id: 'yuting-lin', name: 'Yuting Lin', img: 'member-yuting-lin.webp', sub: 'Volunteer · China', langs: ['english', 'mandarin'], kw: ['film', 'cinema', 'cooking', 'food', 'movies'], badge: 'Demo' },
      { id: 'youssef-el-amrani', name: 'Youssef El Amrani', img: 'member-youssef-el-amrani.webp', sub: 'Event volunteer · Morocco', langs: ['arabic', 'french'], kw: ['football', 'soccer', 'film', 'cinema'], badge: 'Demo' },
      { id: 'beatriz-costa', name: 'Beatriz Costa', img: 'member-beatriz-costa.webp', sub: 'Community member · Brazil', langs: ['portuguese', 'english'], kw: ['baking', 'swim', 'swimming', 'cake'], badge: 'Demo' },
      { id: 'ines-laurent', name: 'Inès Laurent', img: 'member-ines-laurent.webp', sub: 'Community member · France', langs: ['french', 'english'], kw: ['reading', 'books', 'crafts'], badge: 'Demo' },
      { id: 'kavya-rao', name: 'Kavya Rao', img: 'member-kavya-rao.webp', sub: 'Volunteer · India', langs: ['english', 'telugu'], kw: ['theatre', 'theater', 'gardening', 'garden'], badge: 'Demo' },
      { id: 'hamza-ahmed', name: 'Hamza Ahmed', img: 'member-hamza-ahmed.webp', sub: 'Community member · Pakistan', langs: ['urdu', 'english'], kw: ['architecture', 'walking', 'walk', 'buildings'], badge: 'Demo' },
      { id: 'imane-benali', name: 'Imane Benali', img: 'member-imane-benali.webp', sub: 'Alumni · Morocco', langs: ['arabic', 'french'], kw: ['design', 'student life'], badge: 'Demo' },
      { id: 'thomas-petit', name: 'Thomas Petit', img: 'member-thomas-petit.webp', sub: 'Welcome buddy · France', langs: ['french', 'english'], kw: ['running', 'cooking', 'food', 'meals'], badge: 'Demo' },
      { id: 'hao-zhang', name: 'Hao Zhang', img: 'member-hao-zhang.webp', sub: 'Alumni · China', langs: ['english', 'mandarin'], kw: ['coding', 'programming', 'hiking', 'computer science'], badge: 'Demo' }
    ],
    events: [
      { id: 'coffee-first-hellos', name: 'Coffee & first hellos', img: 'event-coffee.webp', when: 'Thu 24 Sep · 17:30', langs: ['english', 'french'], kw: ['coffee', 'cafe', 'meeting people', 'first', 'introductions', 'new'], badge: 'Example' },
      { id: 'sunday-seine-walk', name: 'A Sunday along the Seine', img: 'event-seine-walk.webp', when: 'Sun 27 Sep · 14:00', langs: ['english', 'french'], kw: ['walk', 'walking', 'seine', 'river', 'outdoors', 'photography'], badge: 'Example' },
      { id: 'language-cafe', name: 'A seat at the language café', img: 'event-language-cafe.webp', when: 'Fri 2 Oct · 18:00', langs: ['english', 'french', 'multilingual'], kw: ['language', 'languages', 'french', 'practice', 'words'], badge: 'Example' },
      { id: 'board-game-evening', name: 'A board-game evening', img: 'event-board-games.webp', when: 'Wed 7 Oct · 18:30', langs: ['english', 'french'], kw: ['board games', 'games', 'game'], badge: 'Example' },
      { id: 'neighbourhood-sketch-walk', name: 'A neighbourhood sketch walk', img: 'event-sketch-walk.webp', when: 'Sat 10 Oct · 11:00', langs: ['english', 'french'], kw: ['sketch', 'sketching', 'draw', 'drawing', 'art', 'walk'], badge: 'Example' },
      { id: 'shared-student-dinner', name: 'A shared table on Sunday', img: 'event-shared-table.webp', when: 'Sun 18 Oct · 17:00', langs: ['english', 'french'], kw: ['dinner', 'food', 'meal', 'meals', 'cooking', 'eat'], badge: 'Example' },
      { id: 'quiet-study-and-tea', name: 'A quiet hour, with a tea break', img: 'event-study-tea.webp', when: 'Thu 22 Oct · 18:00', langs: ['english', 'french'], kw: ['study', 'studying', 'quiet', 'tea', 'exams'], badge: 'Example' },
      { id: 'sunday-photo-walk', name: 'Paris in small details', img: 'event-photo-walk.webp', when: 'Sun 25 Oct · 14:00', langs: ['english', 'french'], kw: ['photography', 'photo', 'camera', 'walk', 'details'], badge: 'Example' },
      { id: 'language-cafe-everyday', name: 'Back at the language café', img: 'event-language-cafe-everyday.webp', when: 'Fri 30 Oct · 18:30', langs: ['english', 'french'], kw: ['language', 'languages', 'practice', 'words', 'conversation'], badge: 'Example' },
      { id: 'park-run-and-walk', name: 'A little fresh air, at your pace', img: 'event-park-run-walk.webp', when: 'Sat 7 Nov · 11:00', langs: ['english', 'french'], kw: ['running', 'run', 'walk', 'walking', 'park', 'fresh air', 'sport'], badge: 'Example' },
      { id: 'books-and-small-item-swap', name: 'A new home for a good book', img: 'event-book-swap.webp', when: 'Wed 18 Nov · 18:00', langs: ['english', 'french'], kw: ['books', 'swap', 'reading', 'exchange'], badge: 'Example' },
      { id: 'november-community-check-in', name: 'A November catch-up', img: 'event-community-check-in.webp', when: 'Thu 26 Nov · 18:30', langs: ['english', 'french'], kw: ['catch up', 'check in', 'newcomers', 'meeting people'], badge: 'Example' }
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
    noteEl.textContent = 'Offline preview — keyword matching from the example directory. Run scripts/dev-proxy.mjs (or deploy the worker) for AI matching.';
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
    profilesOnce().then(({ ok, data }) => {
      if (!ok || !data) return;
      for (const [id, patch] of Object.entries(data.patched || {})) {
        const card = document.getElementById(id);
        if (!card) continue;
        const setText = (selector, value) => {
          const el = card.querySelector(selector);
          if (el && value) el.textContent = value;
        };
        setText('h2', patch.name);
        const role = [patch.role, patch.country].filter(Boolean).join(' · ');
        setText('.member-role', role);
        setText('.card-summary', patch.summary);
        if (patch.tags && patch.tags.length) {
          const list = card.querySelector('.tag-list');
          if (list) {
            list.innerHTML = '';
            for (const tag of patch.tags) {
              const li = document.createElement('li');
              li.textContent = tag;
              list.appendChild(li);
            }
          }
        }
        if (patch.email) {
          const dd = card.querySelector('.member-contact dd');
          if (dd) {
            dd.innerHTML = '';
            const link = document.createElement('a');
            link.href = 'mailto:' + patch.email;
            link.textContent = patch.email;
            dd.appendChild(link);
          }
        }
        if (patch.photo) {
          const img = card.querySelector('.member-portrait img');
          if (img) img.src = photoUrl(patch.photo);
        }
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
      profileHint: el('join-profile-hint'), name: el('join-name'), role: el('join-role'), country: el('join-country'),
      tags: el('join-tags'), summary: el('join-summary'), photo: el('join-photo'), preview: el('join-photo-preview'),
      emailPublic: el('join-email-public'), save: el('join-save'), saveHint: el('join-save-hint'),
      signout: el('join-signout'), del: el('join-delete')
    };
    let token = localStorage.getItem(TOKEN_KEY) || '';
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
      if (!profile) return;
      ui.name.value = profile.name || '';
      ui.role.value = profile.role || '';
      ui.country.value = profile.country || '';
      ui.tags.value = (profile.tags || []).join(', ');
      ui.summary.value = profile.summary || '';
      ui.emailPublic.checked = !!profile.email;
      ui.del.hidden = !profile.dynamic;
      if (profile.photo) {
        ui.preview.src = photoUrl(profile.photo);
        ui.preview.hidden = false;
      }
    };

    const showProfileStep = () => {
      ui.codeStep.hidden = true;
      joinForm.hidden = false;
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
      token = data.token;
      localStorage.setItem(TOKEN_KEY, token);
      status(ui.verifyHint, 'Verified.', 'ok');
      fillForm(data.profile);
      ui.profileHint.textContent = data.isExisting
        ? `Signed in as ${email}. This address is linked to the existing profile “${data.profile ? data.profile.name : ''}” — saving updates that card.`
        : `Signed in as ${email}. Saving adds a new profile to the member directory.`;
      showProfileStep();
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
        tags: ui.tags.value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 8),
        emailPublic: ui.emailPublic.checked
      };
      if (photoData) payload.photo = photoData;
      ui.save.disabled = true;
      status(ui.saveHint, 'Saving…');
      const { ok, data } = await apiFetch('/profile', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: JSON.stringify(payload)
      });
      ui.save.disabled = false;
      if (!ok) {
        status(ui.saveHint, (data && data.error) || 'Could not save the profile.', 'error');
        return;
      }
      status(ui.saveHint, 'Saved. Your profile will appear in the member directory within a minute.', 'ok');
      ui.del.hidden = !(data && data.profile && data.profile.dynamic);
      photoData = '';
    });

    ui.signout.addEventListener('click', () => {
      localStorage.removeItem(TOKEN_KEY);
      token = '';
      joinForm.hidden = true;
      ui.codeStep.hidden = true;
      ui.del.hidden = true;
      status(ui.emailHint, 'Signed out.');
      ui.emailStep.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });

    ui.del.addEventListener('click', async () => {
      if (!window.confirm('Delete your profile from the directory? This cannot be undone.')) return;
      const { ok } = await apiFetch('/profile', { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
      if (!ok) {
        status(ui.saveHint, 'Could not delete the profile.', 'error');
        return;
      }
      localStorage.removeItem(TOKEN_KEY);
      token = '';
      joinForm.hidden = true;
      status(ui.emailHint, 'Your profile was deleted.', 'ok');
    });

    // Resume an existing session so returning members land straight on the form.
    if (token) {
      apiFetch('/me', { headers: { Authorization: 'Bearer ' + token } }).then(({ ok, data }) => {
        if (!ok || !data) {
          token = '';
          localStorage.removeItem(TOKEN_KEY);
          return;
        }
        ui.email.value = data.email || '';
        fillForm(data.profile);
        ui.profileHint.textContent = data.profileId
          ? `Signed in as ${data.email}. Saving updates your existing card.`
          : `Signed in as ${data.email}. Saving adds a new profile to the directory.`;
        showProfileStep();
      });
    }
  }
})();
