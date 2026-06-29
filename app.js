const API_BASE = 'https://audio.stream.spaziogenesi.org/api';
const STATION = 'arte_news';
const REFRESH_MS = 15000;

const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const artwork = document.getElementById('artwork');
const npArtist = document.getElementById('np-artist');
const npTitle = document.getElementById('np-title');
const listenersEl = document.getElementById('listeners');
const showName = document.getElementById('show-name');
const showTime = document.getElementById('show-time');
const stationDesc = document.getElementById('station-description');
const stationGenre = document.getElementById('station-genre');

let playing = false;
let streamUrl = null;

playBtn.addEventListener('click', () => {
  if (!streamUrl) return;
  if (playing) {
    audio.pause();
    audio.src = '';
    playBtn.innerHTML = '&#9654;';
    playing = false;
  } else {
    audio.src = streamUrl + '?nocache=' + Date.now();
    audio.play();
    playBtn.innerHTML = '&#9646;&#9646;';
    playing = true;
  }
});

function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString * 1000);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

async function fetchNowPlaying() {
  try {
    const res = await fetch(`${API_BASE}/nowplaying/${STATION}`);
    const data = await res.json();

    const song = data.now_playing?.song;
    const listeners = data.listeners?.current ?? 0;
    const station = data.station;

    if (song) {
      npTitle.textContent = song.title || '—';
      npArtist.textContent = song.artist || '—';
      if (song.art) artwork.src = song.art;
    }

    listenersEl.textContent = `${listeners} ${listeners === 1 ? 'ascoltatore' : 'ascoltatori'}`;

    if (station) {
      stationDesc.textContent = station.description || '—';
      stationGenre.textContent = station.genre || '';
      if (!streamUrl && station.listen_url) {
        streamUrl = station.listen_url;
      }
    }

    // fallback stream url from mounts
    if (!streamUrl && data.station?.mounts?.length) {
      streamUrl = data.station.mounts[0].url;
    }

  } catch (e) {
    console.error('Errore nowplaying:', e);
  }
}

async function fetchSchedule() {
  try {
    const res = await fetch(`${API_BASE}/station/${STATION}/schedule`);
    const data = await res.json();

    const now = Math.floor(Date.now() / 1000);
    const next = data.find(item => item.start_timestamp > now);

    if (next) {
      showName.textContent = next.name || '—';
      showTime.textContent = `${formatTime(next.start_timestamp)} – ${formatTime(next.end_timestamp)}`;
    } else {
      showName.textContent = 'Nessun programma pianificato';
      showTime.textContent = '';
    }
  } catch (e) {
    console.error('Errore schedule:', e);
  }
}

async function refresh() {
  await Promise.all([fetchNowPlaying(), fetchSchedule()]);
}

refresh();
setInterval(refresh, REFRESH_MS);
