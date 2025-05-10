const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const musicList = document.getElementById("music-list");
const loadingMessage = document.getElementById("loading-message");
const audioPlayer = document.getElementById("audio-player");

const audioApis = [
  (url) => `https://api.siputzx.my.id/api/d/ytmp3?url=${url}`,
  (url) => `https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${url}`
];

const videoApis = [
  (url) => `https://api.siputzx.my.id/api/d/ytmp4?url=${url}`,
  (url) => `https://api.zenkey.my.id/api/download/ytmp4?apikey=zenkey&url=${url}`,
  (url) => `https://axeel.my.id/api/download/video?url=${encodeURIComponent(url)}`,
  (url) => `https://delirius-apiofc.vercel.app/download/ytmp4?url=${url}`
];

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  musicList.innerHTML = "";
  loadingMessage.style.display = "block";
  audioPlayer.style.display = "none";

  try {
    const proxyUrl = 'https://corsproxy.io/?';
    const apiUrl = `https://night-api-seven.vercel.app/api/search/youtube?q=${encodeURIComponent(query)}`;
    const searchResults = await fetch(proxyUrl + encodeURIComponent(apiUrl));
    const data = await searchResults.json();
    loadingMessage.style.display = "none";

    if (!data.status || !data.result || data.result.length === 0) {
      musicList.innerHTML = `<p>No se encontraron resultados.</p>`;
      return;
    }

    const normalizar = (str) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const queryNorm = normalizar(query);

    const resultadosFiltrados = data.result
      .map(video => {
        const tituloNorm = normalizar(video.titulo);
        const canalNorm = normalizar(video.canal);

        let score = 0;
        if (tituloNorm.includes(queryNorm)) score += 2;
        if (canalNorm.includes(queryNorm)) score += 1;

        const keywords = queryNorm.split(/\s+/);
        for (let palabra of keywords) {
          if (tituloNorm.includes(palabra)) score += 1;
          if (canalNorm.includes(palabra)) score += 0.5;
        }

        return { video, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    if (resultadosFiltrados.length === 0) {
      musicList.innerHTML = `<p>No se encontraron resultados relevantes.</p>`;
      return;
    }

    const truncate = (text, maxLength = 30) =>
      text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

    resultadosFiltrados.forEach(({ video }) => {
      const card = document.createElement("div");
      card.className = "music-card";

      const image = document.createElement("img");
      image.src = video.miniatura;

      const info = document.createElement("div");
      info.className = "music-info";

      const title = document.createElement("div");
      title.className = "music-title";
      title.textContent = truncate(video.titulo);

      const artist = document.createElement("div");
      artist.className = "music-artist";
      artist.textContent = truncate(video.canal);

      const channel = document.createElement("div");

      const playBtn = document.createElement("button");
      playBtn.className = "play-button";
      playBtn.innerHTML = `<i class="fas fa-play"></i> Play`;

      const downloadAudioBtn = document.createElement("button");
      downloadAudioBtn.className = "download-button";
      downloadAudioBtn.innerHTML = `<i class="fas fa-music"></i> audio`;

      playBtn.onclick = async () => {
        playBtn.textContent = "Carg...";
        for (let api of audioApis) {
          try {
            const res = await fetch(api(video.url));
            const json = await res.json();
            const audioUrl = json?.result?.url || json?.data?.url || json?.data?.dl;
            if (audioUrl) {
              audioPlayer.src = audioUrl;
              audioPlayer.style.display = "block";
              audioPlayer.play();
              playBtn.textContent = "audio";
              return;
            }
          } catch (e) {
            console.warn("API audio falló:", e.message);
          }
        }
        playBtn.textContent = "Error";
        alert("No se pudo obtener el audio.");
      };

      downloadAudioBtn.onclick = async () => {
        downloadAudioBtn.textContent = "Busc...";
        for (let api of audioApis) {
          try {
            const res = await fetch(api(video.url));
            const json = await res.json();
            const audioUrl = json?.result?.url || json?.data?.url || json?.data?.dl;
            if (audioUrl) {
              const a = document.createElement("a");
              a.href = audioUrl;
              a.download = `${video.titulo}.mp3`;
              a.click();
              downloadAudioBtn.textContent = "audio";
              return;
            }
          } catch (e) {
            console.warn("API audio (descarga) falló:", e.message);
          }
        }
        downloadAudioBtn.textContent = "Error";
        alert("No se pudo descargar el audio.");
      };

      const videoBtn = document.createElement("button");
      videoBtn.className = "download-button";
      videoBtn.innerHTML = `<i class="fas fa-video"></i> video`;

      videoBtn.onclick = async () => {
        videoBtn.textContent = "Busc...";
        for (let api of videoApis) {
          try {
            const res = await fetch(api(video.url));
            const json = await res.json();
            const videoUrl = json?.data?.dl || json?.result?.download?.url || json?.downloads?.url || json?.data?.download?.url;
            if (videoUrl) {
              const a = document.createElement("a");
              a.href = videoUrl;
              a.download = `${video.titulo}.mp4`;
              a.click();
              videoBtn.textContent = "video";
              return;
            }
          } catch (e) {
            console.warn("API video falló:", e.message);
          }
        }
        videoBtn.textContent = "Error";
        alert("No se pudo obtener el video.");
      };

      info.appendChild(title);
      info.appendChild(artist);
      info.appendChild(channel);
      card.appendChild(image);
      card.appendChild(info);
      card.appendChild(playBtn);
      card.appendChild(downloadAudioBtn);
      card.appendChild(videoBtn);
      musicList.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    loadingMessage.style.display = "none";
    musicList.innerHTML = `<p>Ocurrió un error al buscar.</p>`;
  }
});