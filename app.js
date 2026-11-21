/* A little date with you — interaction layer */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const i18n = window.eazoI18n;
  const t = (key, params) => (i18n ? i18n.t(key, params) : key);
  const currentLocale = () => (i18n ? i18n.getLocale() : 'en-US');

  const stages = {
    proposal: $('#proposal'),
    planner: $('#planner'),
    result: $('#result'),
  };
  const yesBtn = $('#yes');
  const noBtn = $('#no');
  const arena = $('#arena');
  const dodgeHint = $('#dodgeHint');
  const activitySelect = $('#activity');
  const timeSelect = $('#time');
  const customWrap = $('#customWrap');
  const customTime = $('#customTime');
  const noteInput = $('#note');
  const formError = $('#formError');
  const monthLabel = $('#month-label');
  const weekdaysRow = $('#weekdays');
  const daysGrid = $('#days');
  const chosenLabel = $('#chosen-date');
  const prevBtn = $('#previous');
  const nextBtn = $('#next');
  const confettiLayer = $('#confetti');
  const toastEl = $('#toast');
  const form = $('#dateForm');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let chosenDate = null;
  let saved = null;
  let dodgeCount = 0;
  let toastTimer = null;

  /* ---------- helpers ---------- */
  const formatDate = (date, style = 'full') =>
    new Intl.DateTimeFormat(currentLocale(), { dateStyle: style }).format(date);

  const clampDate = (d) => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return copy;
  };

  function scrollTop(smooth = true) {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  /* ---------- stage navigation ---------- */
  function showStage(name) {
    Object.entries(stages).forEach(([key, el]) => {
      el.classList.toggle('is-active', key === name);
    });
    if (name !== 'proposal') resetNoButton();
    scrollTop(true);
  }

  /* ---------- falling petals ---------- */
  function scatterPetals() {
    const box = $('#petals');
    const glyphs = ['✿', '♥', '✦', '❀', '♡'];
    for (let i = 0; i < 18; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.textContent = glyphs[i % glyphs.length];
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.animationDuration = `${13 + Math.random() * 16}s`;
      petal.style.animationDelay = `${-Math.random() * 24}s`;
      box.append(petal);
    }
  }

  /* ---------- confetti + hearts ---------- */
  const confettiColors = ['#e98fb0', '#e3c3ee', '#f6d59f', '#f4a8ba', '#c9b1e0', '#ffffff'];

  function celebrate(intensity = 1) {
    const count = Math.round(70 * intensity);
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement('span');
      const isHeart = i % 5 === 0;
      piece.className = `piece${isHeart ? ' heart' : i % 7 === 0 ? ' ring' : ''}`;
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${Math.random() * 0.9}s`;
      piece.style.animationDuration = `${2.4 + Math.random() * 2.2}s`;
      piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 190}px`);
      if (isHeart) {
        piece.textContent = Math.random() > 0.35 ? '♥' : '♡';
        piece.style.color = confettiColors[i % confettiColors.length];
      } else {
        piece.style.backgroundColor = confettiColors[i % confettiColors.length];
      }
      confettiLayer.append(piece);
      setTimeout(() => piece.remove(), 6000);
    }
  }

  /* ---------- the shy NO button ---------- */
  function resetNoButton() {
    if (noBtn.parentElement !== arena) arena.append(noBtn);
    noBtn.classList.remove('dodging', 'landed');
    noBtn.style.transform = '';
    noBtn.style.left = '';
    noBtn.style.top = '';
    noBtn.style.width = '';
    noBtn.removeAttribute('data-fled');
    noBtn.textContent = t('hero.no');
    dodgeCount = 0;
    dodgeHint.textContent = t('hero.hint');
    dodgeHint.classList.remove('gone');
  }

  function overlaps(a, b, gap) {
    return !(
      a.x + a.w < b.left - gap ||
      a.x > b.right + gap ||
      a.y + a.h < b.top - gap ||
      a.y > b.bottom + gap
    );
  }

  function dodge() {
    if (!stages.proposal.classList.contains('is-active')) return;
    const rect = noBtn.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (!noBtn.classList.contains('dodging')) {
      noBtn.style.width = `${width}px`;
      noBtn.classList.add('dodging');
    }

    const pad = 12;
    const maxX = Math.max(pad, window.innerWidth - width - pad);
    const maxY = Math.max(pad, window.innerHeight - height - pad);
    const yesRect = yesBtn.getBoundingClientRect();

    let spot = null;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const candidate = {
        x: pad + Math.random() * (maxX - pad),
        y: pad + Math.random() * (maxY - pad),
      };
      const box = { ...candidate, w: width, h: height };
      if (!overlaps(box, yesRect, 12)) { spot = candidate; break; }
      spot = spot || candidate;
    }

    // keep the stray button anchored to the viewport, not to a card that creates a containing block
    if (noBtn.parentElement !== document.body) {
      document.body.append(noBtn);
    }
    noBtn.style.left = '0px';
    noBtn.style.top = '0px';
    noBtn.style.transform = `translate3d(${Math.round(spot.x)}px, ${Math.round(spot.y)}px, 0)`;
    noBtn.classList.add('landed');

    dodgeCount += 1;
    const labels = ['hero.no', 'hero.noAlt1', 'hero.noAlt2', 'hero.noAlt3', 'hero.noAlt4'];
    noBtn.textContent = t(labels[Math.min(dodgeCount, labels.length - 1)]);

    if (dodgeCount === 1) {
      dodgeHint.textContent = t('hero.hintAfter');
    }
    if (dodgeCount >= 5) {
      dodgeHint.classList.add('gone');
    }
    if (dodgeCount % 3 === 0) {
      yesBtn.style.transform = 'scale(1.09)';
      setTimeout(() => { yesBtn.style.transform = ''; }, 600);
    }
  }

  noBtn.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') dodge();
  });

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    if (!noBtn.isConnected) return;
    const rect = noBtn.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < Math.min(96, Math.max(rect.width, rect.height) * 0.85)) dodge();
  }, { passive: true });

  noBtn.addEventListener('touchstart', (event) => {
    event.preventDefault();
    dodge();
  }, { passive: false });

  noBtn.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') dodge();
  });

  noBtn.addEventListener('click', (event) => {
    event.preventDefault();
    dodge();
  });

  noBtn.addEventListener('focus', () => {
    if (noBtn.classList.contains('dodging')) dodge();
  });

  window.addEventListener('resize', () => {
    if (noBtn.classList.contains('dodging')) dodge();
  });

  /* ---------- YES ---------- */
  yesBtn.addEventListener('click', () => {
    startMusic();
    playSparkle();
    celebrate(1);
    showStage('planner');
    window.setTimeout(() => {
      if (window.matchMedia('(min-width: 768px)').matches) {
        activitySelect.focus({ preventScroll: true });
      }
    }, 420);
  });

  /* ---------- calendar ---------- */
  function renderCalendar() {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const locale = currentLocale();

    monthLabel.textContent = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    }).format(viewMonth);

    prevBtn.disabled = year === today.getFullYear() && month === today.getMonth();

    weekdaysRow.innerHTML = '';
    for (let i = 0; i < 7; i += 1) {
      const cell = document.createElement('span');
      cell.textContent = t(`calendar.wd${i}`);
      weekdaysRow.append(cell);
    }

    daysGrid.innerHTML = '';
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstWeekday; i += 1) {
      daysGrid.append(document.createElement('span'));
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(day);
      const isPast = date < today;
      button.disabled = isPast;
      button.setAttribute('aria-label', formatDate(date));

      if (date.getTime() === today.getTime()) button.classList.add('today');
      if (chosenDate && date.getTime() === chosenDate.getTime()) {
        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
      }
      if (!isPast) {
        button.addEventListener('click', () => {
          chosenDate = date;
          formError.textContent = '';
          renderCalendar();
        });
      }
      daysGrid.append(button);
    }

    chosenLabel.textContent = chosenDate
      ? t('calendar.selected', { date: formatDate(chosenDate) })
      : t('calendar.choose');
  }

  prevBtn.addEventListener('click', () => {
    const candidate = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    const floor = new Date(today.getFullYear(), today.getMonth(), 1);
    if (candidate >= floor) {
      viewMonth = candidate;
      renderCalendar();
    }
  });

  nextBtn.addEventListener('click', () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  /* ---------- time ---------- */
  timeSelect.addEventListener('change', () => {
    const custom = timeSelect.value === 'custom';
    customWrap.classList.toggle('hidden', !custom);
    formError.textContent = '';
    if (custom) customTime.focus({ preventScroll: true });
  });

  customTime.addEventListener('input', () => { formError.textContent = ''; });

  /* ---------- submit ---------- */
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const activity = activitySelect.value;
    if (!activity) {
      formError.textContent = t('plan.missingActivity');
      activitySelect.focus({ preventScroll: true });
      activitySelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!chosenDate) {
      formError.textContent = t('plan.missingDate');
      daysGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const isCustom = timeSelect.value === 'custom';
    let timeValue = timeSelect.value;
    let timeDisplay = '';
    if (isCustom) {
      if (!customTime.value) {
        formError.textContent = t('plan.missingCustomTime');
        customTime.focus({ preventScroll: true });
        customTime.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const [hours, minutes] = customTime.value.split(':').map(Number);
      timeValue = customTime.value;
      timeDisplay = new Intl.DateTimeFormat(currentLocale(), {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(2000, 0, 1, hours, minutes));
    } else if (!timeValue) {
      formError.textContent = t('plan.missingTime');
      timeSelect.focus({ preventScroll: true });
      timeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    formError.textContent = '';
    saved = {
      activity,
      date: new Date(chosenDate),
      time: { kind: isCustom ? 'custom' : 'preset', value: timeValue },
      note: noteInput.value.trim(),
    };

    renderResult();
    showStage('result');
    playSparkle();
    celebrate(0.75);
    window.setTimeout(() => celebrate(0.5), 700);
  });

  /* ---------- result ---------- */
  function renderCountdown() {
    const el = $('#countdown');
    if (!saved) { el.textContent = ''; return; }
    const target = clampDate(saved.date);
    const diff = Math.round((target - today) / 86400000);
    if (diff <= 0) el.textContent = t('result.countdownToday');
    else if (diff === 1) el.textContent = t('result.countdownTomorrow');
    else el.textContent = t('result.countdownDays', { count: diff });
  }

  function formatSavedTime(time) {
    let hours;
    let minutes;
    if (time.kind === 'custom') {
      [hours, minutes] = time.value.split(':').map(Number);
    } else {
      const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.value);
      if (!match) return time.value;
      hours = Number(match[1]) % 12;
      if (match[3].toUpperCase() === 'PM') hours += 12;
      minutes = Number(match[2]);
    }
    return new Intl.DateTimeFormat(currentLocale(), {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(2000, 0, 1, hours, minutes));
  }

  function renderResult() {
    if (!saved) return;
    const option = activitySelect.querySelector(`option[value="${saved.activity}"]`);
    $('#outActivity').textContent = option ? option.textContent : saved.activity;
    $('#outDate').textContent = formatDate(saved.date);
    $('#outTime').textContent = formatSavedTime(saved.time);
    $('#outNote').textContent = saved.note || t('result.noNote');
    renderCountdown();
  }

  $('#edit').addEventListener('click', () => showStage('planner'));

  $('#share').addEventListener('click', async () => {
    if (!saved) return;
    const summary = [
      t('result.title'),
      `${t('result.activity')}: ${$('#outActivity').textContent}`,
      `${t('result.date')}: ${$('#outDate').textContent}`,
      `${t('result.time')}: ${$('#outTime').textContent}`,
      saved.note ? `${t('result.note')}: ${saved.note}` : '',
    ].filter(Boolean).join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: t('meta.title'), text: summary });
        return;
      }
      await navigator.clipboard.writeText(summary);
      toast(t('toast.copied'));
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(summary);
        toast(t('toast.copied'));
      } catch (_) {
        toast(t('toast.shareFail'));
      }
    }
  });

  /* ---------- sound ---------- */
  const bgm = $('#bgm');
  const sparkleAudio = $('#sparkle');
  const soundToggle = $('#soundToggle');
  const soundIcon = $('#soundIcon');
  const soundLabel = $('#soundLabel');
  const SOUND_KEY = 'littledate.sound';
  let soundOn = readSoundPreference();
  let bgmStarted = false;

  function readSoundPreference() {
    try {
      const saved = window.localStorage.getItem(SOUND_KEY);
      if (saved === 'off') return false;
      if (saved === 'on') return true;
    } catch (_) { /* storage may be unavailable */ }
    return true;
  }

  function saveSoundPreference(value) {
    try { window.localStorage.setItem(SOUND_KEY, value ? 'on' : 'off'); } catch (_) { /* ignore */ }
  }

  function startMusic() {
    if (!soundOn) return;
    bgm.volume = 0.32;
    const attempt = bgm.play();
    if (attempt && typeof attempt.then === 'function') {
      attempt.then(() => { bgmStarted = true; }).catch(() => { bgmStarted = false; });
    }
  }

  function playSparkle() {
    if (!soundOn) return;
    try {
      sparkleAudio.currentTime = 0;
      sparkleAudio.volume = 0.55;
      const attempt = sparkleAudio.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    } catch (_) { /* ignore */ }
  }

  function paintSoundControl() {
    soundIcon.textContent = soundOn ? '♪' : '✕';
    soundToggle.setAttribute('aria-pressed', String(soundOn));
    const key = soundOn ? 'sound.mute' : 'sound.unmute';
    soundLabel.textContent = t(key);
    soundLabel.setAttribute('data-i18n', key);
  }

  soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    saveSoundPreference(soundOn);
    paintSoundControl();
    if (soundOn) {
      startMusic();
      playSparkle();
    } else {
      bgm.pause();
      sparkleAudio.pause();
    }
  });

  document.addEventListener('pointerdown', () => { if (!bgmStarted) startMusic(); }, { passive: true });
  document.addEventListener('keydown', () => { if (!bgmStarted) startMusic(); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) bgm.pause();
    else if (soundOn) startMusic();
  });

  /* ---------- boot ---------- */
  function renderAll() {
    document.title = t('meta.title');
    paintSoundControl();
    document.querySelector('#locale').setAttribute('aria-label', t('hero.languageLabel'));
    if (saved) renderResult();
    renderCalendar();
  }

  async function boot() {
    scatterPetals();
    paintSoundControl();
    startMusic();
    if (i18n) await i18n.ready;
    renderAll();
    window.addEventListener('eazo:localechange', renderAll);
  }

  boot();
})();
