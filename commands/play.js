const { SlashCommandBuilder } = require('discord.js');
const playdl = require('play-dl');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción desde YouTube, Spotify o SoundCloud.')
    .addStringOption(option =>
      option.setName('canción')
        .setDescription('Nombre o enlace de la canción')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    if (!focusedValue) {
      try {
        await interaction.respond([]);
      } catch (e) {
        console.error('❌ No se pudo enviar respuesta vacía en autocomplete:', e);
      }
      return;
    }

    try {
      const results = await playdl.search(focusedValue, { limit: 5 });
      const suggestions = results.map(result => ({
        name: `[${result.source}] ${result.title.slice(0, 75)}`,
        value: result.url
      }));
      await interaction.respond(suggestions);
    } catch (error) {
      console.error('❌ Error en autocomplete:', error);
      try {
        await interaction.respond([]);
      } catch (e) {
        console.error('❌ No se pudo enviar respuesta vacía en autocomplete:', e);
      }
    }
  },

  async execute(interaction) {
    const url = interaction.options.getString('canción');
    const member = interaction.member;
    const channel = member.voice.channel;

    if (!channel) {
      return interaction.reply({ content: '🔇 Debes estar en un canal de voz para usar este comando.', flags: 64 });
    }

    try {
      const stream = await playdl.stream(url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
      });

      const player = createAudioPlayer();
      connection.subscribe(player);
      player.play(resource);

      interaction.reply({ content: `▶️ Reproduciendo: ${url}` });

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });
    } catch (error) {
      console.error('❌ Error al reproducir la canción:', error);
      interaction.reply({ content: '❌ No se pudo reproducir la canción.', flags: 64 });
    }
  }
};
