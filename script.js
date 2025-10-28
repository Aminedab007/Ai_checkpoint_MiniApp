
    // ============================
    // Config
    // ============================
    const API_KEY = '8824bbdb';
    const API_BASE = 'https://www.omdbapi.com/';

    // Elements
    const input = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const container = document.getElementById('movie-container');
    const empty = document.getElementById('empty');
    const themeToggle = document.getElementById('theme-toggle');

    // Modal elements
    const modalBackdrop = document.getElementById('modalBackdrop');
    const closeModalBtn = document.getElementById('closeModal');
    const modalPoster = document.getElementById('modalPoster');
    const modalTitle = document.getElementById('modalTitle');
    const modalMeta = document.getElementById('modalMeta');
    const modalPlot = document.getElementById('modalPlot');
    const modalTags = document.getElementById('modalTags');

    // ============================
    // Theme toggle (persist)
    // ============================
    const root = document.documentElement;
    (function initTheme(){
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') {
        root.setAttribute('data-theme', saved);
        themeToggle.textContent = saved === 'dark' ? '🌞' : '🌙';
      } else {
        const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        themeToggle.textContent = prefersDark ? '🌞' : '🌙';
      }
    })();

    themeToggle.addEventListener('click', () => {
      const curr = root.getAttribute('data-theme');
      const next = curr === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      themeToggle.textContent = next === 'dark' ? '🌞' : '🌙';
    });

    // ============================
    // Helpers
    // ============================
    function posterOrPlaceholder(src, title) {
      if (!src || src === 'N/A') {
        const svg = encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='800' height='1200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#7c3aed'/><stop offset='100%' stop-color='#6366f1'/></linearGradient></defs><rect width='100%' height='100%' fill='#0b1020'/><g transform='translate(400 600)'><rect x='-200' y='-280' width='400' height='560' rx='32' fill='url(%23g)' opacity='.8'/><text x='0' y='10' font-size='40' text-anchor='middle' font-family='Segoe UI, Arial' fill='white' opacity='.9'>${(title||'Movie').slice(0,22)}</text></g></svg>`);
        return `data:image/svg+xml;utf8,${svg}`;
      }
      return src;
    }

    function createCard(movie) {
      const card = document.createElement('article');
      card.className = 'card';
      card.tabIndex = 0;
      card.innerHTML = `
        <figure class="poster">
          <img alt="${movie.Title} poster" src="${posterOrPlaceholder(movie.Poster, movie.Title)}" />
        </figure>
        <div class="content">
          <div class="title">${movie.Title}</div>
          <div class="meta">${movie.Year} • ${movie.Type?.toUpperCase?.() || 'MOVIE'}</div>
        </div>
        <div class="actions">
          <button class="more" data-id="${movie.imdbID}">More details</button>
          <button class="btn" data-id="${movie.imdbID}">Open</button>
        </div>
      `;

      // Action handlers
      card.querySelector('.btn').addEventListener('click', () => openDetails(movie.imdbID));
      card.querySelector('.more').addEventListener('click', () => openDetails(movie.imdbID));

      return card;
    }

    function revealOnScroll(targets) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { targets.forEach(el => el.classList.add('show')); return; }
      const io = new IntersectionObserver((entries, obs) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('show');
            obs.unobserve(e.target);
          }
        }
      }, { threshold: .15 });
      targets.forEach(el => io.observe(el));
    }

    // ============================
    // API calls
    // ============================
    async function searchMovies(query) {
      container.innerHTML = '';
      empty.hidden = true;
      try {
        const res = await fetch(`${API_BASE}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie`);
        const data = await res.json();
        if (data.Response === 'False') {
          empty.textContent = data.Error || 'No results found.';
          empty.hidden = false;
          return;
        }
        const items = data.Search || [];
        for (const m of items) {
          const card = createCard(m);
          container.appendChild(card);
        }
        revealOnScroll([...container.querySelectorAll('.card')]);
      } catch (e) {
        empty.textContent = 'Network error. Please try again.';
        empty.hidden = false;
        console.error(e);
      }
    }

    async function openDetails(id) {
      try {
        const res = await fetch(`${API_BASE}?apikey=${API_KEY}&i=${id}&plot=short`);
        const d = await res.json();
        if (d.Response === 'False') return;
        // Populate modal
        modalPoster.src = posterOrPlaceholder(d.Poster, d.Title);
        modalTitle.textContent = `${d.Title} (${d.Year})`;
        modalMeta.innerHTML = `${d.Rated || 'NR'} • ${d.Runtime || ''} • ${d.Genre || ''} • ${d.imdbRating ? `⭐ ${d.imdbRating}` : ''}`;
        modalPlot.textContent = d.Plot || 'No plot available.';
        modalTags.innerHTML = '';
        const tags = [d.Director && `Director: ${d.Director}`, d.Actors && `Cast: ${d.Actors.split(',').slice(0,4).join(', ')}`, d.Language && `Lang: ${d.Language}`].filter(Boolean);
        for (const t of tags) {
          const span = document.createElement('span');
          span.className = 'tag';
          span.textContent = t;
          modalTags.appendChild(span);
        }
        showModal(true);
      } catch (e) {
        console.error(e);
      }
    }

    // ============================
    // Modal controls
    // ============================
    function showModal(v) {
      modalBackdrop.classList.toggle('show', v);
      modalBackdrop.setAttribute('aria-hidden', String(!v));
      if (v) document.body.style.overflow = 'hidden';
      else document.body.style.overflow = '';
    }
    closeModalBtn.addEventListener('click', () => showModal(false));
    modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) showModal(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') showModal(false); });

    // ============================
    // Events
    // ============================
    searchBtn.addEventListener('click', () => {
      const q = input.value.trim();
      if (!q) { empty.textContent = 'Type a movie title to search.'; empty.hidden = false; return; }
      searchMovies(q);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBtn.click(); });

    // Initial state: gentle nudge + demo query
    empty.hidden = false;
    empty.textContent = 'Try searching for: Batman, Inception, Matrix...';

    // Optional: pre-load a popular query for instant wow
    searchMovies('Batman');
  