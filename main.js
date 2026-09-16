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
  // Interim mode: local keyword matching until the AI endpoint is connected.
  const form = document.getElementById('finder-form');
  const input = document.getElementById('finder-input');
  const results = document.getElementById('finder-results');
  const grid = document.getElementById('finder-grid');
  const note = document.getElementById('finder-results-note');
  if (!form || !input || !results || !grid || !note) return;

  const POOL = {
    members: [
      { id: 'sparlay-khan', name: 'Sparlay Khan', img: 'member-sparlay-khan.jpeg', sub: 'Manager · Pakistan', langs: ['english'], kw: ['environment', 'nature', 'travel', 'travelling', 'hiking'], badge: '' },
      { id: 'zixuan-gui', name: 'Zixuan Gui', img: 'member-zixuan-gui.jpeg', sub: 'Volunteer · China', langs: ['english', 'chinese', 'mandarin'], kw: ['sports', 'ski', 'skiing', 'coding', 'computer science', 'programming'], badge: '' },
      { id: 'tamara-matijevic', name: 'Tamara Matijević', img: 'member-tamara-matijevic.jpeg', sub: 'Community member · Serbia', langs: ['english', 'french', 'serbian'], kw: ['neuroscience', 'biology', 'molecular', 'science'], badge: '' },
      { id: 'alessio-saturnino', name: 'Alessio SATURNINO', img: 'member-alessio-saturnino.jpeg', sub: 'Community member · Italy', langs: ['italian', 'english', 'french', 'spanish'], kw: ['running', 'gym', 'basketball', 'volleyball', 'techno', 'music', 'party', 'poems', 'poetry', 'nature'], badge: '' },
      { id: 'lina-moreau', name: 'Lina Moreau', img: 'member-lina.webp', sub: 'Welcome buddy · France', langs: ['english', 'french'], kw: ['photography', 'photo', 'city walks', 'walking', 'neighbourhood'], badge: 'Demo' },
      { id: 'mateo-silva', name: 'Mateo Silva', img: 'member-mateo.webp', sub: 'Event volunteer · Brazil', langs: ['english', 'portuguese'], kw: ['music', 'cafes', 'meetups', 'meeting people'], badge: 'Demo' },
      { id: 'aya-tanaka', name: 'Aya Tanaka', img: 'member-aya.webp', sub: 'Community member · Japan', langs: ['english', 'japanese'], kw: ['art', 'gallery', 'galleries', 'coffee', 'sketching', 'sketch'], badge: 'Demo' },
      { id: 'salma-nouri', name: 'Salma Nouri', img: 'member-salma.webp', sub: 'Community member · Morocco', langs: ['arabic', 'french'], kw: ['cooking', 'food', 'film', 'cinema', 'movies'], badge: 'Demo' },
      { id: 'elias-lind', name: 'Elias Lind', img: 'member-elias.webp', sub: 'Event volunteer · Sweden', langs: ['english', 'swedish'], kw: ['board games', 'games', 'outdoors', 'hiking'], badge: 'Demo' },
      { id: 'priya-nair', name: 'Priya Nair', img: 'member-priya.webp', sub: 'Alumni · India', langs: ['english', 'hindi'], kw: ['books', 'reading', 'student life'], badge: 'Demo' },
      { id: 'chen-wei', name: 'Chen Wei', img: 'member-chen-wei.webp', sub: 'Community member · China', langs: ['english', 'mandarin'], kw: ['photography', 'photo', 'badminton', 'camera'], badge: 'Demo' },
      { id: 'thomas-petit', name: 'Thomas Petit', img: 'member-thomas-petit.webp', sub: 'Welcome buddy · France', langs: ['french', 'english'], kw: ['running', 'cooking', 'food', 'meals'], badge: 'Demo' }
    ],
    events: [
      { id: 'coffee-first-hellos', name: 'Coffee & first hellos', img: 'event-coffee.webp', when: 'Thu 24 Sep · 17:30', langs: ['english', 'french'], kw: ['coffee', 'cafe', 'meeting people', 'first', 'introductions', 'new'], badge: 'Example' },
      { id: 'sunday-seine-walk', name: 'A Sunday along the Seine', img: 'event-seine-walk.webp', when: 'Sun 27 Sep · 14:00', langs: ['english', 'french'], kw: ['walk', 'walking', 'seine', 'river', 'outdoors', 'photography'], badge: 'Example' },
      { id: 'language-cafe', name: 'A seat at the language café', img: 'event-language-cafe.webp', when: 'Fri 2 Oct · 18:00', langs: ['english', 'french', 'multilingual'], kw: ['language', 'languages', 'french', 'practice', 'words'], badge: 'Example' },
      { id: 'board-game-evening', name: 'A board-game evening', img: 'event-board-games.webp', when: 'Wed 7 Oct · 18:30', langs: ['english', 'french'], kw: ['board games', 'games', 'game'], badge: 'Example' },
      { id: 'neighbourhood-sketch-walk', name: 'A neighbourhood sketch walk', img: 'event-sketch-walk.webp', when: 'Sat 10 Oct · 11:00', langs: ['english', 'french'], kw: ['sketch', 'sketching', 'draw', 'drawing', 'art', 'walk'], badge: 'Example' },
      { id: 'quiet-study-and-tea', name: 'A quiet hour, with a tea break', img: 'event-study-tea.webp', when: 'Thu 22 Oct · 18:00', langs: ['english', 'french'], kw: ['study', 'studying', 'quiet', 'tea', 'exams'], badge: 'Example' },
      { id: 'sunday-photo-walk', name: 'Paris in small details', img: 'event-photo-walk.webp', when: 'Sun 25 Oct · 14:00', langs: ['english', 'french'], kw: ['photography', 'photo', 'camera', 'walk', 'details'], badge: 'Example' },
      { id: 'park-run-and-walk', name: 'A little fresh air, at your pace', img: 'event-park-run-walk.webp', when: 'Sat 7 Nov · 11:00', langs: ['english', 'french'], kw: ['running', 'run', 'walk', 'walking', 'park', 'fresh air', 'sport'], badge: 'Example' }
    ],
    stories: [
      { id: 'finding-my-first-familiar-faces', name: 'Finding my first familiar faces', img: 'story-familiar-faces.webp', sub: 'Aya Tanaka · Settling in', kw: ['friends', 'friendship', 'meeting people', 'new', 'shy', 'hello'], badge: 'Example' },
      { id: 'paris-one-small-routine', name: 'Paris, one small routine at a time', img: 'story-paris-routine.webp', sub: 'Mateo Silva · Everyday Paris', kw: ['routine', 'home', 'city', 'neighbourhood', 'everyday'], badge: 'Example' },
      { id: 'putting-the-camera-down', name: 'Putting the camera down', img: 'story-camera-pause.webp', sub: 'Chen Wei · Noticing the city', kw: ['photography', 'camera', 'photo', 'noticing'], badge: 'Example' },
      { id: 'asking-people-to-slow-down', name: 'Asking people to slow down', img: 'story-finding-the-words.webp', sub: 'Kavya Rao · Finding the words', kw: ['language', 'french', 'conversation', 'slow', 'words'], badge: 'Example' },
      { id: 'making-room-for-a-quiet-weekend', name: 'Making room for a quiet weekend', img: 'story-quiet-weekend.webp', sub: 'Beatriz Costa · Finding your pace', kw: ['quiet', 'rest', 'tired', 'weekend', 'alone'], badge: 'Example' },
      { id: 'a-study-session-one-small-question', name: 'A study session, one small question', img: 'story-study-question.webp', sub: 'Arjun Mehta · Studying together', kw: ['study', 'studying', 'library', 'course', 'class'], badge: 'Example' }
    ]
  };

  const TYPES = [
    { key: 'members', label: 'SOMEONE TO MEET', link: 'View profile', page: './members.html#' },
    { key: 'events', label: 'SOMETHING TO JOIN', link: 'View event', page: './events.html#' },
    { key: 'stories', label: 'SOMETHING TO READ', link: 'Read the story', page: './experiences.html#' }
  ];

  const LANG_ALIASES = { '中文': ['chinese', 'mandarin'], '汉语': ['chinese', 'mandarin'], '普通话': ['mandarin'], 'français': ['french'], 'francais': ['french'], '日本語': ['japanese'], 'nihongo': ['japanese'], 'español': ['spanish'], 'espanol': ['spanish'], 'italiano': ['italian'] };
  const ZH_TERMS = { '法语': 'french', '英文': 'english', '英语': 'english', '中文': 'chinese mandarin', '汉语': 'chinese mandarin', '普通话': 'mandarin', '日语': 'japanese', '西班牙语': 'spanish', '意大利语': 'italian', '摄影': 'photography', '照片': 'photo', '拍照': 'photography', '跑步': 'running', '跑': 'run', '慢跑': 'running', '徒步': 'hiking', '爬山': 'hiking', '桌游': 'board games', '游戏': 'games', '咖啡': 'coffee cafe', '咖啡馆': 'cafe', '艺术': 'art', '画廊': 'gallery', '画画': 'sketching', '写生': 'sketch walk', '读书': 'books reading', '书': 'books', '电影': 'film cinema', '做饭': 'cooking', '烹饪': 'cooking', '音乐': 'music', '健身房': 'gym', '健身': 'gym', '篮球': 'basketball', '排球': 'volleyball', '滑雪': 'ski skiing', '编程': 'coding programming', '代码': 'coding', '计算机': 'computer science', '生物': 'biology', '科学': 'science', '安静': 'quiet', '周末': 'weekend', '累': 'tired', '害羞': 'shy', '内向': 'shy', '朋友': 'friends meeting people', '认识': 'meeting people', '聊天': 'conversation', '口语': 'practice conversation', '练习': 'practice', '学习': 'study', '考试': 'exams', '图书馆': 'library', '新生': 'new', '新来': 'new' };

  const ACCENTS = { 'á':'a','à':'a','â':'a','é':'e','è':'e','ê':'e','ë':'e','í':'i','ì':'i','î':'i','ó':'o','ò':'o','ô':'o','ö':'o','ú':'u','ù':'u','û':'u','ü':'u','ç':'c','ñ':'n' };
  const stripAccents = (value) => value.replace(/[à-ÿ]/g, (ch) => ACCENTS[ch] || ch);
  const expandChinese = (value) => value.replace(/[\u4e00-\u9fff]+/g, (run) => {
    let out = '';
    for (const term of Object.keys(ZH_TERMS)) if (run.includes(term)) out += ' ' + ZH_TERMS[term];
    return out || run;
  });
  const tokenize = (value) => (' ' + stripAccents(expandChinese(value.toLowerCase())).replace(/[^a-z0-9\u4e00-\u9fff]+/gi, ' ').replace(/\s+/g, ' ') + ' ');
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

  function card(type, match) {
    const entry = match.entry;
    const badge = entry.badge ? ` <span class="finder-demo">${entry.badge}</span>` : '';
    const detail = entry.when || entry.sub || '';
    const reason = match.hits.length
      ? `Matches: ${match.hits.join(', ')}${detail ? ' · ' + detail : ''}`
      : `A friendly starting point${detail ? ' · ' + detail : ''}`;
    return (
      `<article class="finder-card">
        <figure class="finder-photo"><img src="./assets/${entry.img}" alt="" width="320" height="240" loading="lazy" decoding="async" /></figure>
        <div class="finder-body">
          <p class="finder-type">${type.label}</p>
          <h3>${entry.name}${badge}</h3>
          <p class="finder-reason">${reason}</p>
          <a class="finder-link" href="${type.page}${entry.id}">${type.link} <span aria-hidden="true">↗</span></a>
        </div>
      </article>`
    );
  }

  function suggest() {
    const tokens = tokenize(input.value || '');
    const langSet = languagesFrom(tokens);
    grid.innerHTML = '';
    for (const type of TYPES) {
      grid.insertAdjacentHTML('beforeend', card(type, pick(POOL[type.key], tokens, langSet)));
    }
    note.textContent = 'Preview matches from the example directory — personalised AI matching is on its way.';
    results.hidden = false;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    suggest();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      suggest();
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
})();
