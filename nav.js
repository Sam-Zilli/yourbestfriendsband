document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  setupPagePager();
  loadShows();
  loadInstagramFeed();
  loadListenMedia();
});

function setupPagePager() {
  var stage = document.querySelector('main');
  var pages = Array.prototype.slice.call(document.querySelectorAll('.hero-section[id]'));
  var navLinks = document.querySelectorAll('.nav-links a');
  if (!stage || pages.length < 2) return;

  var index = 0;
  var locked = false;
  var touchStartX = 0;
  var touchStartY = 0;

  pages.forEach(function (page, i) {
    if (page.id && '#' + page.id === window.location.hash) index = i;
  });

  function setActiveLink(writeHash) {
    var id = pages[index] ? pages[index].id : 'shows';
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + id) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    if (writeHash) history.replaceState(null, '', '#' + id);
  }

  function goTo(nextIndex) {
    nextIndex = Math.max(0, Math.min(pages.length - 1, nextIndex));
    if (nextIndex === index) return;
    index = nextIndex;
    locked = true;
    stage.style.transform = 'translate3d(0, ' + (-index * window.innerHeight) + 'px, 0)';
    setActiveLink(true);
    window.setTimeout(function () {
      locked = false;
    }, 580);
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = (link.getAttribute('href') || '').replace('#', '');
      var nextIndex = -1;
      pages.forEach(function (page, i) {
        if (page.id === id) nextIndex = i;
      });
      if (nextIndex < 0) return;
      event.preventDefault();
      goTo(nextIndex);
    });
  });

  function isInNestedScroll(node) {
    return !!(node && node.closest && node.closest('.listen-board, .instagram-feed'));
  }

  window.addEventListener('wheel', function (event) {
    if (isInNestedScroll(event.target)) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    if (locked || Math.abs(event.deltaY) < 10) return;
    goTo(index + (event.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  window.addEventListener('keydown', function (event) {
    var board = pages[index] && pages[index].id === 'listen'
      ? document.querySelector('.listen-board')
      : null;
    if (board) {
      var atTop = board.scrollTop <= 0;
      var atBottom = board.scrollTop + board.clientHeight >= board.scrollHeight - 2;
      if ((event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') && !atBottom) return;
      if ((event.key === 'ArrowUp' || event.key === 'PageUp') && !atTop) return;
    }
    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      goTo(index + 1);
    }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      goTo(index - 1);
    }
  });

  window.addEventListener('touchstart', function (event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', function (event) {
    if (isInNestedScroll(event.target)) return;
    var dx = event.touches[0].clientX - touchStartX;
    var dy = event.touches[0].clientY - touchStartY;
    if (Math.abs(dy) > Math.abs(dx)) event.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', function (event) {
    if (locked || isInNestedScroll(event.target)) return;
    var dx = event.changedTouches[0].clientX - touchStartX;
    var dy = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) >= Math.abs(dy) || Math.abs(dy) < 48) return;
    goTo(index + (dy < 0 ? 1 : -1));
  }, { passive: true });

  window.addEventListener('resize', function () {
    stage.style.transition = 'none';
    stage.style.transform = 'translate3d(0, ' + (-index * window.innerHeight) + 'px, 0)';
    requestAnimationFrame(function () {
      stage.style.transition = '';
    });
  });

  if (index > 0) {
    stage.style.transition = 'none';
    stage.style.transform = 'translate3d(0, ' + (-index * window.innerHeight) + 'px, 0)';
    setActiveLink(true);
    requestAnimationFrame(function () {
      stage.style.transition = '';
    });
  } else {
    setActiveLink(false);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDotDate(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-');
  if (parts.length < 3) return '';
  var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
}

function formatShowWhen(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).toLowerCase();
}

function formatShowDatetime(dateStr, timeStr) {
  if (!timeStr) return dateStr;
  var match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return dateStr;
  var hours = Number(match[1]) % 12;
  if (match[3].toLowerCase() === 'pm') hours += 12;
  return dateStr + 'T' + (hours < 10 ? '0' : '') + hours + ':' + match[2];
}

function isSafeUrl(url) {
  return url === '#' || /^https?:\/\//i.test(url);
}

function renderWithBands(bands) {
  if (!Array.isArray(bands) || !bands.length) return '';

  var items = bands.map(function (band) {
    var name = '';
    var url = '';
    if (typeof band === 'string') {
      name = band;
    } else if (band && band.name) {
      name = band.name;
      url = band.url;
    }
    if (!name) return '';
    if (url && isSafeUrl(url) && url !== '#') {
      return '<a href="' + escapeHtml(url) + '" class="show-band-link" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(name) + '</a>';
    }
    return '<span class="show-band">' + escapeHtml(name) + '</span>';
  }).filter(Boolean);

  if (!items.length) return '';

  var list = items[0];
  if (items.length === 2) {
    list = items[0] + ' & ' + items[1];
  } else if (items.length > 2) {
    list = items.slice(0, -1).join(', ') + ' & ' + items[items.length - 1];
  }

  return '<p class="show-with">with ' + list + '</p>';
}

function renderShowCard(show) {
  var article = document.createElement('article');
  article.className = 'show-card' + (show.flyer ? ' show-card-flyer' : '');
  article.setAttribute('data-date', show.date);
  if (show.test) article.setAttribute('data-test-show', '');

  var pin = document.createElement('span');
  pin.className = 'show-pin';
  pin.setAttribute('aria-hidden', 'true');
  article.appendChild(pin);

  if (show.flyer) {
    var img = '<img src="' + escapeHtml(show.flyer) + '" alt="' + escapeHtml(show.flyerAlt || '') + '">';
    if (show.ticketLink && isSafeUrl(show.ticketLink) && show.ticketLink !== '#') {
      article.insertAdjacentHTML('beforeend',
        '<a class="show-flyer-link" href="' + escapeHtml(show.ticketLink) + '" target="_blank" rel="noopener noreferrer">' + img + '</a>'
      );
    } else {
      article.insertAdjacentHTML('beforeend', '<div class="show-flyer-link">' + img + '</div>');
    }
  }

  var parts = show.date.split('-');
  var showDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  var when = show.when || formatShowWhen(showDate);
  var details = show.details
    ? '<span class="show-details">' + escapeHtml(show.details) + '</span>'
    : '';
  var ticketLink = show.ticketLink && isSafeUrl(show.ticketLink)
    ? '<a href="' + escapeHtml(show.ticketLink) + '" class="show-link"' +
      (show.ticketLink !== '#' ? ' target="_blank" rel="noopener noreferrer"' : '') +
      '>tickets</a>'
    : '';

  article.insertAdjacentHTML('beforeend',
    '<div class="show-info">' +
      '<p class="show-when">' + escapeHtml(when) + '</p>' +
      '<h3 class="show-venue">' + escapeHtml(show.venue) + '</h3>' +
      (show.location ? '<p class="show-location">' + escapeHtml(show.location) + '</p>' : '') +
      renderWithBands(show.with) +
      '<p class="show-meta">' +
        (show.time
          ? '<time datetime="' + escapeHtml(formatShowDatetime(show.date, show.time)) + '">' + escapeHtml(show.time) + '</time>'
          : '') +
        details +
      '</p>' +
      ticketLink +
    '</div>'
  );

  return article;
}

function loadInstagramFeed() {
  var feedId = window.YBF_BEHOLD_FEED_ID;
  var wrap = document.getElementById('instagram-feed');
  var widget = wrap && wrap.querySelector('[data-behold-id]');
  if (!feedId || !wrap || !widget) return;

  widget.setAttribute('data-behold-id', feedId);
  wrap.hidden = false;

  if (window.__bhldScript) return;
  window.__bhldScript = true;
  var script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://w.behold.so/widget.js';
  document.head.appendChild(script);
}

function isYoutubeId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id);
}

function isSafeEmbedUrl(url) {
  if (!url || !/^https:\/\//i.test(url)) return false;
  try {
    var host = new URL(url).hostname.toLowerCase();
    return (
      host === 'www.youtube.com' ||
      host === 'youtube.com' ||
      host === 'www.youtube-nocookie.com' ||
      host === 'youtube-nocookie.com' ||
      host === 'open.spotify.com' ||
      host === 'w.soundcloud.com' ||
      host === 'bandcamp.com' ||
      host.slice(-13) === '.bandcamp.com' ||
      host === 'embed.music.apple.com'
    );
  } catch (e) {
    return false;
  }
}

function renderEmbedFrame(src, title) {
  return (
    '<div class="listen-embed">' +
      '<iframe src="' + escapeHtml(src) + '" title="' + escapeHtml(title || '') + '" ' +
        'loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>' +
    '</div>'
  );
}

function loadListenMedia() {
  var videosWrap = document.getElementById('listen-videos');
  var videosGrid = videosWrap && videosWrap.querySelector('.listen-videos-grid');
  var videos = window.YBF_VIDEOS;
  if (videosWrap && videosGrid && Array.isArray(videos)) {
    videos.forEach(function (video) {
      var src = '';
      var title = (video && video.title) || 'video';
      if (video && isYoutubeId(video.youtube)) {
        src = 'https://www.youtube-nocookie.com/embed/' + video.youtube;
      } else if (video && isSafeEmbedUrl(video.src)) {
        src = video.src;
      }
      if (!src) return;
      videosGrid.insertAdjacentHTML('beforeend', renderEmbedFrame(src, title));
    });
    if (videosGrid.children.length) videosWrap.hidden = false;
  }

  var playersWrap = document.getElementById('listen-players');
  var playersList = playersWrap && playersWrap.querySelector('.listen-players-list');
  var players = window.YBF_PLAYERS;
  if (playersWrap && playersList && Array.isArray(players)) {
    players.forEach(function (player) {
      if (!player || !isSafeEmbedUrl(player.src)) return;
      playersList.insertAdjacentHTML(
        'beforeend',
        renderEmbedFrame(player.src, player.title || '')
      );
    });
    if (playersList.children.length) playersWrap.hidden = false;
  }
}

function showEmptyState() {
  var emptyEl = document.querySelector('.shows-empty');
  var carousel = document.querySelector('.shows-carousel');
  var dots = document.querySelector('.shows-carousel-dots');
  if (emptyEl) emptyEl.hidden = false;
  if (carousel) carousel.hidden = true;
  if (dots) dots.hidden = true;
}

function loadShows() {
  var track = document.querySelector('.shows-carousel-track');
  var shows = window.YBF_SHOWS;
  if (!track || !Array.isArray(shows) || !shows.length) {
    showEmptyState();
    return;
  }

  var host = window.location.hostname;
  var showTests = host === 'localhost' || host === '127.0.0.1' || host === '';
  if (!showTests) {
    shows = shows.filter(function (show) {
      return !show.test;
    });
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var dated = shows.filter(function (show) {
    return show && show.date && show.venue;
  }).map(function (show) {
    var parts = show.date.split('-');
    var showDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var card = renderShowCard(show);
    if (showDate < today) card.classList.add('is-past');
    return { card: card, date: showDate };
  });

  dated.sort(function (a, b) { return a.date - b.date; });

  var startIndex = 0;
  var foundNext = false;
  dated.forEach(function (item, i) {
    track.appendChild(item.card);
    if (!foundNext && item.date >= today) {
      item.card.classList.add('is-next');
      startIndex = i;
      foundNext = true;
    }
  });
  if (!foundNext) startIndex = Math.max(0, dated.length - 1);

  if (!dated.length) {
    showEmptyState();
    return;
  }

  setupShowsCarousel(startIndex);
}

function setupShowsCarousel(startIndex) {
  var viewport = document.querySelector('.shows-carousel-viewport');
  var track = document.querySelector('.shows-carousel-track');
  var prev = document.querySelector('[data-carousel-prev]');
  var next = document.querySelector('[data-carousel-next]');
  var dotsWrap = document.querySelector('.shows-carousel-dots');
  if (!viewport || !track || !prev || !next) return;

  var cards = Array.prototype.slice.call(track.querySelectorAll('.show-card'));
  if (!cards.length) return;

  var index = startIndex || 0;
  var dragStartX = 0;
  var dragStartOffset = 0;
  var dragging = false;
  var dragDelta = 0;

  if (cards.length < 2) {
    prev.hidden = true;
    next.hidden = true;
    if (dotsWrap) dotsWrap.hidden = true;
  }

  cards.forEach(function (card, i) {
    if (dotsWrap) {
      var dot = document.createElement('button');
      var venue = card.querySelector('.show-venue');
      var dateLabel = formatDotDate(card.getAttribute('data-date'));
      var name = venue ? venue.textContent : 'show ' + (i + 1);
      dot.type = 'button';
      if (!card.classList.contains('is-past')) dot.classList.add('is-upcoming');
      if (card.classList.contains('is-next')) {
        dot.classList.add('is-next');
        var callout = document.createElement('span');
        callout.className = 'shows-next-callout';
        callout.setAttribute('aria-hidden', 'true');
        callout.innerHTML = '<span class="shows-next-callout-text">this one&rsquo;s next</span><span class="shows-next-callout-arrow"></span>';
        dot.appendChild(callout);
        dot.setAttribute('aria-label', 'next show, ' + name + (dateLabel ? ', ' + dateLabel : ''));
      } else {
        dot.setAttribute('aria-label', name + (dateLabel ? ', ' + dateLabel : ''));
      }
      dot.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(dot);
    }
  });

  function offsetFor(i) {
    var card = cards[i];
    return (viewport.clientWidth - card.offsetWidth) / 2 - card.offsetLeft;
  }

  function setOffset(px, animate) {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = 'translate3d(' + px + 'px, 0, 0)';
  }

  function goTo(i, animate) {
    index = Math.max(0, Math.min(cards.length - 1, i));
    setOffset(offsetFor(index), animate !== false);
    cards.forEach(function (card, n) {
      card.classList.toggle('is-active', n === index);
    });
    prev.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    if (dotsWrap) {
      Array.prototype.forEach.call(dotsWrap.children, function (dot, n) {
        var active = n === index;
        dot.classList.toggle('is-active', active);
        if (active) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }
  }

  prev.addEventListener('click', function () { goTo(index - 1); });
  next.addEventListener('click', function () { goTo(index + 1); });

  viewport.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    dragDelta = 0;
    dragStartX = event.clientX;
    dragStartOffset = offsetFor(index);
    track.classList.add('is-dragging');
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', function (event) {
    if (!dragging) return;
    dragDelta = event.clientX - dragStartX;
    setOffset(dragStartOffset + dragDelta, false);
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    if (dragDelta < -40) goTo(index + 1);
    else if (dragDelta > 40) goTo(index - 1);
    else goTo(index);
  }

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  viewport.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') goTo(index - 1);
    if (event.key === 'ArrowRight') goTo(index + 1);
  });
  viewport.setAttribute('tabindex', '0');

  window.addEventListener('resize', function () { goTo(index, false); });
  requestAnimationFrame(function () {
    goTo(index, false);
  });
}
