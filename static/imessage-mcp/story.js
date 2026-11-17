/* Scroll position, not a timer, decides what the desktop shows.
   Scrolling back runs the story backwards. Without JavaScript the page shows
   the finished desktop and scrolls normally. */
(function() {
  const story = document.getElementById('story');
  if (!story) {return;}
  const $ = function(s, r) {
    return (r || document).querySelector(s);
  };
  const $$ = function(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  const STAGES = 12; // how many beats the story has
  const LEN = 62; // viewport-heights of scrolling per beat, in vh
  story.style.setProperty('--stages', STAGES);
  story.style.setProperty('--len', LEN);
  document.documentElement.classList.add('js');

  const desk = $('#desk');
  const fit = $('#desk-fit');
  const caption = $('#caption');
  const pillars = $$('.pillars li');
  const timed = $$('[data-at]', story).map(function(el) {
    return { el: el, at: +el.dataset.at, until: el.dataset.until ? +el.dataset.until : Infinity };
  });
  const rows = {};
  const threads = {};
  $$('.row', story).forEach(function(r) {
    rows[r.dataset.chat] = r;
  });
  $$('.thread', story).forEach(function(t) {
    threads[t.dataset.chat] = t;
  });
  const typed = $('#typed');
  const caret = $('#caret');
  const spark = $('#spark');
  const travel = $('#travel');
  const PROMPT = typed.textContent;
  const alertBox = $('#alert');
  const alertTo = $('#alert-to');
  const alertText = $('#alert-text');
  const cursor = $('#cursor');
  const buttons = { send: $('#ab-send'), always: $('#ab-always') };
  const preSarah = $('#pre-sarah');
  const preMike = $('#pre-mike');

  // One line per beat: which of the three jobs it shows, and what to say.
  const BEATS = [
    [0, 'A text comes in about an apartment.'],
    [0, 'Then another. Same evening, across town.'],
    [0, 'Ask Claude once.'],
    [0, 'Claude reads the threads you allow. The rest stay hidden.'],
    [1, 'It works out an order that leaves you time to travel.'],
    [2, 'Before anything sends, your Mac asks you.'],
    [2, 'You say yes. The text goes out as you.'],
    [2, 'Every text gets the same check.'],
    [2, 'Nothing sends without your yes.'],
    [2, 'Trust someone? Allow them once.'],
    [2, 'Claude can text Sarah freely now. Mike still asks.'],
    [3, 'Two viewings booked. You typed one sentence.'],
  ];

  // The three times the dialog appears: when, to whom, what, which button.
  const ASKS = [
    {
      from: 5,
      cursor: 5.7,
      press: 6.25,
      to: 6.5,
      who: 'Sarah',
      text: '6pm works. See you Thursday!',
      button: 'send',
      tool: '#send-1',
    },
    {
      from: 7,
      cursor: 7.7,
      press: 8.25,
      to: 8.5,
      who: 'Mike',
      text: 'Could we do 7:15? I’m coming from another viewing across town.',
      button: 'send',
      tool: '#send-2',
    },
    {
      from: 9.4,
      cursor: 9.85,
      press: 10.3,
      to: 10.5,
      who: 'Sarah',
      text: 'Will do, thanks!',
      button: 'always',
      tool: '#send-3',
    },
  ];
  ASKS.forEach(function(a) {
    a.toolEl = $(a.tool);
    a.label = $('span', a.toolEl);
  });

  function clamp(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function activeChat(s) {
    if (s < 0.25) {return 'none';}
    if (s >= 7 && s < 9) {return 'mike';}
    if (s >= 11) {return 'mike';}
    return 'sarah';
  }

  // On a phone only one window fits, so show the one the beat is about.
  function focus(s) {
    if (s < 2) {return 'msg';}
    if (s < 3.55) {return 'claude';}
    if (s < 4) {return 'msg';}
    if (s < 5) {return 'claude';}
    if (s < 11.3) {return 'msg';}
    return 'claude';
  }

  let lastBeat = -1;
  let lastAsk = null;
  function render(s) {
    const beat = Math.min(STAGES - 1, Math.floor(s));

    timed.forEach(function(t) {
      t.el.classList.toggle('on', s >= t.at && s < t.until);
    });

    if (beat !== lastBeat) {
      caption.textContent = BEATS[beat][1];
      if (lastBeat !== -1) {
        caption.classList.remove('swap');
        void caption.offsetWidth;
        caption.classList.add('swap');
      }
      const pillar = BEATS[beat][0];
      pillars.forEach(function(li, i) {
        li.classList.toggle('now', i === pillar);
        li.classList.toggle('done', i < pillar || pillar === 3);
      });
      lastBeat = beat;
    }

    // Messages: which thread is open, previews, unread dots, what is hidden.
    const chat = activeChat(s);
    Object.keys(threads).forEach(function(k) {
      threads[k].classList.toggle('active', k === chat);
    });
    Object.keys(rows).forEach(function(k) {
      rows[k].classList.toggle('active', k === chat);
    });
    rows.mike.classList.toggle('unread', chat !== 'mike' && s < 7);
    rows.sarah.classList.toggle('unread', chat !== 'sarah' && s >= 9 && s < 9.4);
    rows.mom.classList.toggle('locked', s >= 3.55);
    rows.crew.classList.toggle('locked', s >= 3.7);
    preSarah.textContent =
      s < 6.5
        ? 'Hi! The 2BR on Elm St is still available.'
        : s < 9
          ? 'You: 6pm works. See you Thursday!'
          : s < 10.5
            ? 'Perfect. Buzz 4B when you get here.'
            : 'You: Will do, thanks!';
    preMike.textContent =
      s < 8.5
        ? 'Oak Ave studio: I’m showing it Thursday 5 to 8.'
        : s < 11
          ? 'You: Could we do 7:15?'
          : '7:15 works 👍';

    // Claude: the request types itself as you scroll through its beat.
    typed.textContent =
      s >= 2.85 ? PROMPT : PROMPT.slice(0, Math.round(clamp((s - 2) / 0.8) * PROMPT.length));
    caret.classList.toggle('off', s >= 2.95);
    const thinking =
      (s >= 3 && s < 3.6) || (s >= 4 && s < 4.6) || (s >= 9 && s < 9.4) || (s >= 11 && s < 11.3);
    spark.classList.toggle('busy', thinking);
    travel.style.setProperty('--g', clamp((s - 4.25) / 0.5).toFixed(3));

    // The dialog.
    let ask = null;
    ASKS.forEach(function(a) {
      const waiting = s >= a.from && s < a.to;
      if (waiting) {ask = a;}
      a.toolEl.classList.toggle('wait', waiting);
      a.label.textContent =
        `Text ${ 
          a.who 
        }${waiting
          ? ': waiting for you'
          : a.button === 'always'
            ? ': sent, always allowed'
            : ': sent'}`;
    });
    alertBox.classList.toggle('show', !!ask);
    desk.classList.toggle('asking', !!ask);
    if (ask) {
      if (ask !== lastAsk) {
        alertTo.textContent = `To: ${  ask.who}`;
        alertText.textContent = ask.text;
      }
      const button = buttons[ask.button];
      const moving = s >= ask.cursor;
      const x = moving ? button.offsetLeft + button.offsetWidth * 0.66 : alertBox.offsetWidth + 46;
      const y = moving ? button.offsetTop + button.offsetHeight * 0.45 : alertBox.offsetHeight + 30;
      cursor.style.transform = `translate(${  x.toFixed(0)  }px,${  y.toFixed(0)  }px)`;
      cursor.classList.toggle('on', s >= ask.cursor - 0.15);
      buttons.send.classList.toggle('press', ask.button === 'send' && s >= ask.press);
      buttons.always.classList.toggle('press', ask.button === 'always' && s >= ask.press);
    } else {
      cursor.classList.remove('on');
      buttons.send.classList.remove('press');
      buttons.always.classList.remove('press');
    }
    lastAsk = ask;

    desk.dataset.focus = focus(s);
  }

  // Scale the desktop to whatever room the pinned screen has left.
  function resize() {
    desk.style.setProperty('--s', 1);
    const w = desk.offsetWidth;
    const h = desk.offsetHeight;
    const scale = Math.min(1, fit.clientWidth / w, fit.clientHeight / h);
    desk.style.setProperty('--s', scale.toFixed(4));
    desk.style.marginBottom = `${(-(1 - scale) * h).toFixed(1)  }px`;
    desk.style.marginInline = `${((-(1 - scale) * w) / 2).toFixed(1)  }px`;
  }

  let queued = false;
  function update() {
    queued = false;
    const rect = story.getBoundingClientRect();
    const room = story.offsetHeight - window.innerHeight;
    const p = room > 0 ? clamp(-rect.top / room) : 1;
    // The last beat holds for a moment before the page moves on.
    render(Math.min(STAGES - 0.001, p * (STAGES + 0.35)));
  }
  function onScroll() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function() {
    resize();
    onScroll();
  });
  resize();
  update();
  window.addEventListener('load', function() {
    resize();
    update();
  });

  // Install step three: the switch flips when you reach it.
  const toggle = document.getElementById('toggle');
  if (toggle && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      function(entries) {
        entries.forEach(function(e) {
          toggle.classList.toggle('on', e.isIntersecting);
        });
      },
      { threshold: 1 },
    ).observe(toggle);
  } else if (toggle) {
    toggle.classList.add('on');
  }

  // Lets tests and screenshots jump to a beat: storyAt(6.6)
  window.storyAt = function(s) {
    const room = story.offsetHeight - window.innerHeight;
    window.scrollTo(0, story.offsetTop + room * (s / (STAGES + 0.35)) + 1);
  };
})();
