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
      connection.destroy();
    });
  } catch (error) {
    console.error('Error al reproducir la canción:', error);
  }
}

module.exports = { playSong };
