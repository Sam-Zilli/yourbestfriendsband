(function () {
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxkzCqii3MobJDNw8Cw0JWHjqTxRaDjWPYmP4vGBhDkn3ctaWMB2Kt93mw-F7LMHs8r/exec';

  document.addEventListener('DOMContentLoaded', function () {
    var yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var form = document.getElementById('signup-form');
    var status = document.getElementById('signup-status');
    var submit = form && form.querySelector('.signup-submit');
    if (!form || !status || !submit) return;

    function showStatus(message, kind) {
      status.hidden = false;
      status.textContent = message;
      status.className = 'signup-status is-' + kind;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = String(form.name.value || '').trim();
      var email = String(form.email.value || '').trim();
      if (!name || !email) {
        showStatus('name and email, if you would.', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showStatus('that email doesn’t look quite right.', 'error');
        return;
      }

      submit.disabled = true;
      showStatus('sending…', 'pending');

      fetch(SCRIPT_URL)
        .then(function (response) {
          return response.json();
        })
        .then(function (meta) {
          if (!meta || !meta.token) throw new Error('token');
          var body = new FormData(form);
          body.append('token', meta.token);
          return fetch(SCRIPT_URL, { method: 'POST', body: body });
        })
        .then(function (response) {
          return response.json().catch(function () {
            return { result: response.ok ? 'success' : 'error' };
          });
        })
        .then(function (data) {
          if (data && data.result === 'success') {
            form.reset();
            showStatus('you’re on the list. see you out there.', 'success');
            return;
          }
          showStatus('something snagged — try again in a minute.', 'error');
        })
        .catch(function () {
          showStatus('something snagged — try again in a minute.', 'error');
        })
        .then(function () {
          submit.disabled = false;
        });
    });
  });
})();
