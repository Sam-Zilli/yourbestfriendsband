document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var sections = document.querySelectorAll('.hero-section[id]');
  var navLinks = document.querySelectorAll('.nav-links a');
  var isNavigating = false;
  var scrollTimer = null;

  function setActiveLink() {
    if (isNavigating) return;

    var closestId = 'shows';
    var marker = window.scrollY + Math.min(140, window.innerHeight * 0.28);

    sections.forEach(function (section) {
      if (section.offsetTop <= marker) {
        closestId = section.getAttribute('id');
      }
    });

    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + closestId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      isNavigating = true;

      navLinks.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');

      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        isNavigating = false;
      }, 800);
    });
  });

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();

  var showCards = Array.prototype.slice.call(document.querySelectorAll('.show-card[data-date]'));
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var upcoming = [];

  showCards.forEach(function (card) {
    var parts = card.getAttribute('data-date').split('-');
    var showDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    if (showDate < today) {
      card.classList.add('is-past');
    } else {
      upcoming.push({ card: card, date: showDate });
    }
  });

  upcoming.sort(function (a, b) { return a.date - b.date; });
  if (upcoming[0]) {
    upcoming[0].card.classList.add('is-next');
  }

  var emptyEl = document.querySelector('.shows-empty');
  if (emptyEl && upcoming.length === 0 && showCards.length > 0) {
    emptyEl.hidden = false;
  }
});
