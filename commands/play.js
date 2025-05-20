const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const play = require('play-dl');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce música desde varias plataformas')
    .addStringOption(option =>
      option.setName('busqueda')
        .setDescription('Nombre o URL de la canción')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    if (!focusedValue) return interaction.respond([]);

    // Buscar videos en YouTube usando play-dl y la API Key
    try {
      const results = await play.search(focusedValue, { limit: 5, source: { youtube: 'video' } });

      const suggestions = results.map(video => ({
        name: `🎵 ${video.title}`,
        value: video.url
      }));

      await interaction.respond(suggestions);
    } catch (error) {
      console.error('Error en autocompletado:', error);
      await interaction.respond([]);
    }
  },

  async execute(interaction, client) {
    const query = interaction.options.getString('busqueda');

    // Confirmar que el usuario está en un canal de voz
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.reply({ content: '❌ Debes estar en un canal de voz para reproducir música.', ephemeral: true });

    await interaction.deferReply();

    let songInfo;
    let songUrl;

    try {
      if (play.yt_validate(query) === 'video') {
        // Si es URL directa de YouTube
        songInfo = await play.video_info(query);
        songUrl = songInfo.video_details.url;
      } else {
        // Buscar en YouTube por texto
        const searchResults = await play.search(query, { limit: 1, source: { youtube: 'video' } });
        if (searchResults.length === 0) return interaction.editReply('❌ No se encontraron resultados para tu búsqueda.');

        songInfo = searchResults[0];
        songUrl = songInfo.url;
      }

      // Reproducir la canción
      await client.playSong(interaction, songUrl);

      // Responder con info de la canción
      const embed = new EmbedBuilder()
        .setTitle(songInfo.title)
        .setURL(songUrl)
        .setThumbnail(songInfo.thumbnails[0].url)
        .setDescription(`🎶 Reproduciendo en: **${voiceChannel.name}**`)
        .setColor('Random')
        .setFooter({ text: 'Música por tu bot' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en /play:', error);
      interaction.editReply('❌ Hubo un error al intentar reproducir la canción.');
    }
  },
};
