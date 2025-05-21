const play = require('play-dl');

async function searchSongs(query) {
  try {
    const results = await play.search(query, { limit: 5 });

    return results.map(video => ({
      name: `${video.title} (${video.source})`,
      value: video.url,
      platform: video.source
    }));
  } catch (err) {
    console.error('Error en búsqueda:', err);
    return [];
  }
}

module.exports = { searchSongs };
