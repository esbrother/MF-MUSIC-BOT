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

    try {
      const results = await play.search(focusedValue, { limit: 5, source: { youtube: 'video' } });

      const suggestions = results.map(video => {
        let title = video.title;
        if (title.length > 97) title = title.substring(0, 97) + '...';
        return {
          name: `🎵 ${title}`,
          value: video.url
        };
      });

      await interaction.respond(suggestions);
    } catch (error) {
      console.error('❌ Error en autocompletado:', error);
      await interaction.respond([]);
    }
  },

  async execute(interaction, client) {
    const query = interaction.options.getString('busqueda');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) return interaction.reply({ content: '❌ Debes estar en un canal de voz para reproducir música.', ephemeral: true });

    await interaction.deferReply();

    try {
      let songInfo;
      let songUrl;

      if (play.yt_validate(query) === 'video') {
        songInfo = await play.video_info(query);
        songUrl = songInfo.video_details.url;
      } else {
        const results = await play.search(query, { limit: 1, source: { youtube: 'video' } });
        if (!results.length) return interaction.editReply('❌ No se encontraron resultados para tu búsqueda.');
        songInfo = results[0];
        songUrl = songInfo.url;
      }

      await client.playSong(interaction, songUrl);

      const embed = new EmbedBuilder()
        .setTitle(songInfo.title)
        .setURL(songUrl)
        .setThumbnail(songInfo.thumbnails[0].url)
        .setDescription(`🎶 Reproduciendo en: **${voiceChannel.name}**`)
        .setColor('Random')
        .setFooter({ text: '🎧 MF Music Bot' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('❌ Error en /play:', error);
      await interaction.editReply('❌ Hubo un error al intentar reproducir la canción.');
    }
  },
};
