(() => {
  const items = document.querySelectorAll('[data-reveal]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!items.length || motion.matches || !('IntersectionObserver' in window)) return;

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
})();
