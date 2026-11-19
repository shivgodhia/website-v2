// Pinned "dial" in the method section: the step nearest the middle of the
// viewport becomes active and its number replaces the dial's number.
(function () {
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var dial = document.querySelector('.dial');
  if (!steps.length || !dial || !('IntersectionObserver' in window)) {
    document.documentElement.classList.add('no-js');
    return;
  }
  var n = dial.querySelector('.dial-n');
  var before = dial.querySelector('.dial-before');
  var after = dial.querySelector('.dial-after');
  var unit = dial.querySelector('.dial-unit');
  var current = -1;

  function show(i) {
    if (i === current) return;
    current = i;
    var s = steps[i];
    steps.forEach(function (el, j) { el.classList.toggle('is-active', j === i); });
    n.textContent = i + 1;
    before.textContent = s.dataset.before;
    after.textContent = s.dataset.after;
    unit.textContent = s.dataset.unit;
    after.classList.remove('swap');
    void after.offsetWidth;
    after.classList.add('swap');
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) show(steps.indexOf(e.target));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(function (s) { io.observe(s); });
  show(0);
})();
