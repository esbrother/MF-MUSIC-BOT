const { SlashCommandBuilder } = require('discord.js');
const playdl = require('play-dl');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción desde YouTube, Spotify o SoundCloud')
    .addStringOption(option =>
      option
        .setName('canción')
        .setDescription('Nombre o URL de la canción')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async execute(interaction) {
    let url = interaction.options.getString('canción');

    try {
      if (!playdl.is_expired()) {
        await playdl.refreshToken(); // Necesario para Spotify
      }

      // Si el usuario escribió texto y no una URL directa
      if (!url.startsWith('http')) {
        const [result] = await playdl.search(url, { limit: 1 });
        if (!result || !result.url) {
          return interaction.reply({
            content: '❌ No se encontró ningún resultado.',
            ephemeral: true,
          });
        }
        url = result.url;
      }

      const stream = await playdl.stream(url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      const member = interaction.member;
      const channel = member.voice.channel;
      if (!channel) {
        return interaction.reply({
          content: '🔇 Debes estar en un canal de voz para usar este comando.',
          ephemeral: true,
        });
      }

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      connection.subscribe(player);
      player.play(resource);

      await interaction.reply({
        content: `🎵 Reproduciendo: ${url}`,
      });

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

    } catch (error) {
      console.error('❌ Error al reproducir la canción:', error);
      interaction.reply({
        content: '❌ No se pudo reproducir la canción.',
        ephemeral: true,
      });
    }
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    if (!focusedValue) return interaction.respond([]);

    const timeout = setTimeout(() => {
      if (!interaction.replied && !interaction.responded) {
        interaction.respond([]).catch(() => {});
      }
    }, 2500);

    try {
      const results = await playdl.search(focusedValue, { limit: 5 });
      clearTimeout(timeout);

      const suggestions = results.map(result => ({
        name: `[${result.source}] ${result.title.slice(0, 75)}`,
        value: result.url,
      }));

      await interaction.respond(suggestions);
    } catch (error) {
      console.error('❌ Error en autocomplete:', error);
      try {
        if (!interaction.replied && !interaction.responded) {
          await interaction.respond([]);
        }
      } catch {}
    }
  },
};
