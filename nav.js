document.addEventListener('DOMContentLoaded', function () {

  // Keep the footer copyright year current
  var yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // --- Active nav link highlighting ---
  // Finds the section whose center is closest to the viewport center
  // and underlines only that nav link. Ensures only one is active at a time.
  var sections = document.querySelectorAll('.hero-section[id]');
  var navLinks = document.querySelectorAll('.nav-links a');
  var isNavigating = false; // True while a nav click scroll is in progress
  var scrollTimer = null;

  function setActiveLink() {
    if (isNavigating) return; // Skip updates during nav-click scrolling

    var scrollCenter = window.scrollY + window.innerHeight / 2;
    var closestId = null;
    var closestDist = Infinity;

    sections.forEach(function (section) {
      var top = section.offsetTop;
      var middle = top + section.offsetHeight / 2;
      var dist = Math.abs(scrollCenter - middle);

      if (dist < closestDist) {
        closestDist = dist;
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

  // When a nav link is clicked, immediately activate it and pause
  // scroll-based detection until the scroll animation finishes.
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      isNavigating = true;

      // Immediately highlight the clicked link
      navLinks.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');

      // Re-enable scroll detection after scrolling settles
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        isNavigating = false;
      }, 800);
    });
  });

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink(); // Set initial state on page load
});
