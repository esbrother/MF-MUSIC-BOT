const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  getVoiceConnection
} = require('@discordjs/voice');

const play = require('play-dl');

async function playSong(voiceChannel, songUrl) {
  try {
    const stream = await play.stream(songUrl);

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause
      }
    });

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      const conn = getVoiceConnection(voiceChannel.guild.id);
      if (conn) conn.destroy();
    });

    player.on('error', error => {
      console.error('Error en el reproductor:', error);
    });

  } catch (error) {
    console.error('Error al reproducir la canción:', error);
    throw error; // para que el index.js capture el error
  }
}

module.exports = { playSong };
