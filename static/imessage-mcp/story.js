/* Scroll position, not a timer, decides what the desktop shows.
   Scrolling back runs the story backwards. Without JavaScript the page shows
   the finished desktop and scrolls normally. */
(function() {
  const story = document.getElementById('story');
  if (!story) {
    return;
  }
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

  const fit = $('#desk-fit');
  const caption = $('#caption');
  const pillars = $$('.pillars li');
  const tabs = $$('.examples .ex');

  // Each example is the same twelve beats with its own words. The engine below
  // only needs to know what each beat says, when Claude asks, which chat is
  // open and what the previews read.
  const EXAMPLES = {
    rent: {
      beats: [
        [0, 'A text comes in about an apartment.'],
        [0, 'Then another. Same evening, across town.'],
        [0, 'Ask Claude once.'],
        [0, 'Claude reads the threads you allow. The rest stay hidden.'],
        [1, 'It works out an order that leaves you time to travel.'],
        [2, 'Before anything sends, Claude asks you.'],
        [2, 'You click Allow. The text goes out as you.'],
        [2, 'Every text gets the same check.'],
        [2, 'Nothing sends without your yes.'],
        [2, 'Sarah writes back. Claude drafts the reply.'],
        [2, 'You allow it, and it sends.'],
        [3, 'Two viewings booked. You typed one sentence.'],
      ],
      asks: [
        {
          from: 5,
          cursor: 5.7,
          press: 6.25,
          to: 6.5,
          who: 'Sarah',
          tool: 'Sarah',
          text: '6pm works. See you Thursday!',
        },
        {
          from: 7,
          cursor: 7.7,
          press: 8.25,
          to: 8.5,
          who: 'Mike',
          tool: 'Mike',
          text: 'Could we do 7:15? I’m coming from another viewing across town.',
        },
        {
          from: 9.4,
          cursor: 9.85,
          press: 10.3,
          to: 10.5,
          who: 'Sarah',
          tool: 'Sarah',
          text: 'Will do, thanks!',
        },
      ],
      thinking: [
        [3, 3.6],
        [4, 4.6],
        [9, 9.4],
        [11, 11.3],
      ],
      chat: function(s) {
        if (s < 0.25) {
          return 'none';
        }
        return (s >= 7 && s < 9) || s >= 11 ? 'mike' : 'sarah';
      },
      unread: function(s, chat) {
        return { mike: chat !== 'mike' && s < 7, sarah: chat !== 'sarah' && s >= 9 && s < 9.4 };
      },
      previews: function(s) {
        return {
          sarah:
            s < 6.5
              ? 'Hi! The 2BR on Elm St is still available.'
              : s < 9
                ? 'You: 6pm works. See you Thursday!'
                : s < 10.5
                  ? 'Perfect. Buzz 4B when you get here.'
                  : 'You: Will do, thanks!',
          mike:
            s < 8.5
              ? 'Oak Ave studio: I’m showing it Thursday 5 to 8.'
              : s < 11
                ? 'You: Could we do 7:15?'
                : '7:15 works 👍',
        };
      },
    },
    dates: {
      beats: [
        [0, 'A Hinge match texts you.'],
        [0, 'Then another. Both want to meet this week.'],
        [0, 'Ask Claude once.'],
        [0, 'Claude reads the threads you allow. The rest stay hidden.'],
        [1, 'It puts the dates on different nights.'],
        [2, 'Before anything sends, Claude asks you.'],
        [2, 'You click Allow. The text goes out as you.'],
        [2, 'Every text gets the same check.'],
        [2, 'Nothing sends without your yes.'],
        [2, 'Sophie writes back. Claude drafts the reply.'],
        [2, 'You allow it, and it sends.'],
        [3, 'Two dates set. You typed one sentence.'],
      ],
      asks: [
        {
          from: 5,
          cursor: 5.7,
          press: 6.25,
          to: 6.5,
          who: 'Sophie',
          tool: 'Sophie',
          text: 'Definitely! How’s Wednesday at 8? First round’s on me.',
        },
        {
          from: 7,
          cursor: 7.7,
          press: 8.25,
          to: 8.5,
          who: 'Maya',
          tool: 'Maya',
          text: 'Somewhere with good cocktails and a jukebox. Friday at 8?',
        },
        {
          from: 9.4,
          cursor: 9.85,
          press: 10.3,
          to: 10.5,
          who: 'Sophie',
          tool: 'Sophie',
          text: 'Deal. See you Wednesday!',
        },
      ],
      thinking: [
        [3, 3.6],
        [4, 4.6],
        [9, 9.4],
        [11, 11.3],
      ],
      chat: function(s) {
        if (s < 0.25) {
          return 'none';
        }
        return (s >= 7 && s < 9) || s >= 11 ? 'maya' : 'sophie';
      },
      unread: function(s, chat) {
        return { maya: chat !== 'maya' && s < 7, sophie: chat !== 'sophie' && s >= 9 && s < 9.4 };
      },
      previews: function(s) {
        return {
          sophie:
            s < 6.5
              ? 'Hey it’s Sophie from Hinge 😊'
              : s < 9
                ? 'You: Definitely! How’s Wednesday at 8?'
                : s < 10.5
                  ? 'Wednesday works! I’ll hold you to that 😄'
                  : 'You: Deal. See you Wednesday!',
          maya:
            s < 8.5
              ? 'Maya from Hinge! So where are you taking me? 👀'
              : s < 11
                ? 'You: Somewhere with good cocktails…'
                : 'Ok you had me at jukebox 😏',
        };
      },
    },
  };

  // Find each example's pieces inside its own desktop.
  Object.keys(EXAMPLES).forEach(function(key) {
    const ex = EXAMPLES[key];
    const desk = $(`.desk[data-ex="${key}"]`);
    ex.desk = desk;
    ex.timed = $$('[data-at]', desk).map(function(el) {
      return { el: el, at: +el.dataset.at, until: el.dataset.until ? +el.dataset.until : Infinity };
    });
    ex.rows = {};
    ex.locks = [];
    $$('.row', desk).forEach(function(r) {
      ex.rows[r.dataset.chat] = r;
      if (r.dataset.lock) {
        ex.locks.push({ el: r, at: +r.dataset.lock });
      }
    });
    ex.threads = {};
    $$('.thread', desk).forEach(function(t) {
      ex.threads[t.dataset.chat] = t;
    });
    ex.pre = {};
    $$('[data-pre]', desk).forEach(function(el) {
      ex.pre[el.dataset.pre] = el;
    });
    ex.typed = $('.typed', desk);
    ex.prompt = ex.typed.textContent;
    ex.caret = $('.caret', desk);
    ex.spark = $('.spark', desk);
    ex.travel = $('.travel', desk);
    ex.alertBox = $('.alert', desk);
    ex.alertTo = $('.alert-to', desk);
    ex.alertText = $('.alert-text', desk);
    ex.cursor = $('.cursor', desk);
    ex.allow = $('.ab.primary', desk);
    $$('[data-ask]', desk).forEach(function(el) {
      const a = ex.asks[+el.dataset.ask];
      a.toolEl = el;
      a.label = $('span', el);
    });
  });

  let ex = EXAMPLES.rent;

  function clamp(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  // On a phone only one window fits, so show the one the beat is about.
  function focus(s) {
    if (s < 2) {
      return 'msg';
    }
    if (s < 3.55) {
      return 'claude';
    }
    if (s < 4) {
      return 'msg';
    }
    if (s < 5) {
      return 'claude';
    }
    if (s >= 11.3) {
      return 'claude';
    }
    // Claude while it is asking, Messages to watch the text go out.
    const asking = ex.asks.some(function(a) {
      return s >= a.from && s < a.to;
    });
    return asking ? 'claude' : 'msg';
  }

  let lastBeat = -1;
  let lastAsk = null;
  function render(s) {
    const beat = Math.min(STAGES - 1, Math.floor(s));
    const desk = ex.desk;

    ex.timed.forEach(function(t) {
      t.el.classList.toggle('on', s >= t.at && s < t.until);
    });

    if (beat !== lastBeat) {
      caption.textContent = ex.beats[beat][1];
      if (lastBeat !== -1) {
        caption.classList.remove('swap');
        void caption.offsetWidth;
        caption.classList.add('swap');
      }
      const pillar = ex.beats[beat][0];
      pillars.forEach(function(li, i) {
        li.classList.toggle('now', i === pillar);
        li.classList.toggle('done', i < pillar || pillar === 3);
      });
      lastBeat = beat;
    }
    // At the end of one example, point at the other.
    tabs.forEach(function(t) {
      t.classList.toggle('nudge', s >= 11.3 && t.getAttribute('aria-selected') !== 'true');
    });

    // Messages: which thread is open, previews, unread dots, what is hidden.
    const chat = ex.chat(s);
    Object.keys(ex.threads).forEach(function(k) {
      ex.threads[k].classList.toggle('active', k === chat);
    });
    Object.keys(ex.rows).forEach(function(k) {
      ex.rows[k].classList.toggle('active', k === chat);
    });
    const unread = ex.unread(s, chat);
    Object.keys(ex.rows).forEach(function(k) {
      ex.rows[k].classList.toggle('unread', !!unread[k]);
    });
    ex.locks.forEach(function(l) {
      l.el.classList.toggle('locked', s >= l.at);
    });
    const previews = ex.previews(s);
    Object.keys(previews).forEach(function(k) {
      ex.pre[k].textContent = previews[k];
    });

    // Claude: the request types itself as you scroll through its beat.
    ex.typed.textContent =
      s >= 2.85
        ? ex.prompt
        : ex.prompt.slice(0, Math.round(clamp((s - 2) / 0.8) * ex.prompt.length));
    ex.caret.classList.toggle('off', s >= 2.95);
    const thinking = ex.thinking.some(function(r) {
      return s >= r[0] && s < r[1];
    });
    ex.spark.classList.toggle('busy', thinking);
    ex.travel.style.setProperty('--g', clamp((s - 4.25) / 0.5).toFixed(3));

    // Claude's permission prompt.
    let ask = null;
    ex.asks.forEach(function(a) {
      const waiting = s >= a.from && s < a.to;
      if (waiting) {
        ask = a;
      }
      a.toolEl.classList.toggle('wait', waiting);
      a.label.textContent = `Text ${a.tool}${waiting ? ': waiting for you' : ': sent'}`;
    });
    ex.alertBox.classList.toggle('show', !!ask);
    desk.classList.toggle('asking', !!ask);
    if (ask) {
      if (ask !== lastAsk) {
        ex.alertTo.textContent = `To: ${ask.who}`;
        ex.alertText.textContent = ask.text;
      }
      const allow = ex.allow;
      const moving = s >= ask.cursor;
      const x = moving
        ? allow.offsetLeft + allow.offsetWidth * 0.86
        : ex.alertBox.offsetWidth * 0.3;
      const y = moving ? allow.offsetTop + allow.offsetHeight * 0.6 : -34;
      ex.cursor.style.transform = `translate(${x.toFixed(0)}px,${y.toFixed(0)}px)`;
      ex.cursor.classList.toggle('on', s >= ask.cursor - 0.15);
      allow.classList.toggle('press', s >= ask.press);
    } else {
      ex.cursor.classList.remove('on');
      ex.allow.classList.remove('press');
    }
    lastAsk = ask;

    desk.dataset.focus = focus(s);
  }

  // Scale the desktop to whatever room the pinned screen has left.
  function resize() {
    const desk = ex.desk;
    desk.style.setProperty('--s', 1);
    const w = desk.offsetWidth;
    const h = desk.offsetHeight;
    const scale = Math.min(1, fit.clientWidth / w, fit.clientHeight / h);
    desk.style.setProperty('--s', scale.toFixed(4));
    desk.style.marginBottom = `${(-(1 - scale) * h).toFixed(1)}px`;
    desk.style.marginInline = `${((-(1 - scale) * w) / 2).toFixed(1)}px`;
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

  // Switch examples. If you are partway through the story, start the new one
  // from its first beat.
  function show(key) {
    ex = EXAMPLES[key];
    Object.keys(EXAMPLES).forEach(function(k) {
      const on = k === key;
      EXAMPLES[k].desk.hidden = !on;
      EXAMPLES[k].desk.classList.toggle('active', on);
    });
    tabs.forEach(function(t) {
      t.setAttribute('aria-selected', t.dataset.ex === key ? 'true' : 'false');
    });
    lastBeat = -1;
    lastAsk = null;
    resize();
    if (story.getBoundingClientRect().top < 0) {
      window.scrollTo({ top: story.offsetTop + 1, behavior: 'instant' });
    }
    update();
  }
  tabs.forEach(function(t) {
    t.addEventListener('click', function() {
      if (t.getAttribute('aria-selected') !== 'true') {
        show(t.dataset.ex);
      }
    });
  });
  window.showExample = show;

  // Lets tests and screenshots jump to a beat: storyAt(6.6)
  window.storyAt = function(s) {
    const room = story.offsetHeight - window.innerHeight;
    window.scrollTo(0, story.offsetTop + room * (s / (STAGES + 0.35)) + 1);
  };
})();
