const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const play = require('play-dl');

module.exports = {
  name: 'play',
  description: 'Reproduce una canción desde YouTube, Spotify o SoundCloud.',
  options: [
    {
      name: 'query',
      description: 'Nombre o enlace de la canción.',
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    if (!focusedValue) return;

    try {
      const results = await play.search(focusedValue, { limit: 5 });
      const choices = results.map((result) => {
        let emoji = '🔎';
        if (result.url.includes('youtube.com')) emoji = '📺';
        else if (result.url.includes('spotify.com')) emoji = '🎵';
        else if (result.url.includes('soundcloud.com')) emoji = '🌊';

        return {
          name: `${emoji} ${result.title.slice(0, 90)}`,
          value: result.url,
        };
      });

      await interaction.respond(choices);
    } catch (err) {
      console.error('Error en el autocompletado:', err);
      await interaction.respond([]);
    }
  },
  async execute(interaction) {
    const url = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel)
      return interaction.reply({ content: '🚫 Debes estar en un canal de voz.', ephemeral: true });

    try {
      const songInfo = await play.video_info(url);
      const title = songInfo.video_details.title;

      const player = interaction.client.player;
      const queue = await player.nodes.create(interaction.guild, {
        metadata: { channel: interaction.channel },
      });

      if (!queue.connection)
        await queue.connect(voiceChannel);

      await interaction.deferReply();
      const track = await player.search(url, {
        requestedBy: interaction.user,
      });

      if (!track || !track.tracks.length)
        return interaction.editReply('❌ No se encontraron resultados.');

      queue.addTrack(track.tracks[0]);
      if (!queue.isPlaying()) await queue.node.play();

      const embed = new EmbedBuilder()
        .setTitle('🎶 Reproduciendo')
        .setDescription(`[${title}](${url})`)
        .setColor('#1DB954');

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '❌ Hubo un error al reproducir la canción.', ephemeral: true });
    }
  },
};