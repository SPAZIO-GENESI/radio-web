const API_BASE = 'https://audio.stream.spaziogenesi.org/api';
const STATION = 'arte_news';
const REFRESH_MS = 15000;

const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const artwork = document.getElementById('artwork');
const npArtist = document.getElementById('np-artist');
const npTitle = document.getElementById('np-title');
const listenersEl = document.getElementById('listeners');
const onAir = document.getElementById('on-air');
const showName = document.getElementById('show-name');
const showTime = document.getElementById('show-time');
const stationDesc = document.getElementById('station-description');
const stationGenre = document.getElementById('station-genre');

let playing = false;
let streamUrl = null;
let currentArtUrl = null;

function setPlaying(state) {
  playing = state;
  iconPlay.hidden = state;
  iconPause.hidden = !state;
  onAir.classList.toggle('visible', state);
  playBtn.setAttribute('aria-label', state ? 'Pausa' : 'Riproduci');
}

playBtn.addEventListener('click', () => {
  if (!streamUrl) return;
  if (playing) {
    audio.pause();
    audio.src = '';
    setPlaying(false);
  } else {
    audio.src = streamUrl + '?t=' + Date.now();
    audio.play().catch(() => {});
    setPlaying(true);
  }
});

audio.addEventListener('error', () => setPlaying(false));

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function setArtwork(url) {
  if (!url || url === currentArtUrl) return;
  currentArtUrl = url;
  artwork.classList.remove('loaded');
  artwork.onload = () => artwork.classList.add('loaded');
  artwork.src = url;
}

async function fetchNowPlaying() {
  try {
    const res = await fetch(`${API_BASE}/nowplaying/${STATION}`);
    const data = await res.json();

    const song = data.now_playing?.song;
    const count = data.listeners?.current ?? 0;
    const station = data.station;

    if (song) {
      npTitle.textContent = song.title || '—';
      npArtist.textContent = song.artist || '—';
      setArtwork(song.art);
    }

    listenersEl.textContent = count === 1 ? '1 ascoltat.' : `${count} ascoltat.`;

    if (station && !streamUrl) {
      streamUrl = station.listen_url
        || station.mounts?.[0]?.url
        || null;
      stationDesc.textContent = station.description || '—';
      stationGenre.textContent = station.genre || '';
    }
  } catch (e) {
    console.warn('nowplaying error', e);
  }
}

async function fetchSchedule() {
  try {
    const res = await fetch(`${API_BASE}/station/${STATION}/schedule`);
    const data = await res.json();
    const now = Math.floor(Date.now() / 1000);
    const next = Array.isArray(data) ? data.find(s => s.start_timestamp > now) : null;

    if (next) {
      showName.textContent = next.name || '—';
      showTime.textContent = `${formatTime(next.start_timestamp)} — ${formatTime(next.end_timestamp)}`;
    } else {
      showName.textContent = 'Nessun programma pianificato';
      showTime.textContent = '';
    }
  } catch (e) {
    console.warn('schedule error', e);
  }
}

async function refresh() {
  await Promise.all([fetchNowPlaying(), fetchSchedule()]);
}

refresh();
setInterval(refresh, REFRESH_MS);
