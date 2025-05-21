const { SlashCommandBuilder } = require('discord.js');
const play = require('play-dl');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción.')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nombre o enlace de la canción')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    if (!focusedValue) return interaction.respond([]);

    try {
      const results = await play.search(focusedValue, { limit: 5 });
      const choices = results.map(video => ({
        name: `🎵 ${video.title}`,
        value: video.url
      }));

      await interaction.respond(choices);
    } catch (error) {
      console.error('Error en autocomplete:', error);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const query = interaction.options.getString('query');

    if (!query) {
      return await interaction.reply({ content: '❌ No se proporcionó ninguna canción.', ephemeral: true });
    }

    await interaction.reply(`🔊 Reproduciendo: ${query}`);

    // Aquí puedes agregar la lógica de conexión a voz y reproducción con play-dl y @discordjs/voice
  }
};
