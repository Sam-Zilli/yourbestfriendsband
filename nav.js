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

  function setActiveLink() {
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

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink(); // Set initial state on page load
});
