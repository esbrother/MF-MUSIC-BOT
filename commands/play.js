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

    if (!focusedValue) return;

    try {
      const results = await play.search(focusedValue, { limit: 5 });

      const choices = results.map(video => ({
        name: video.title.slice(0, 100), // Limite 100 caracteres
        value: video.url
      }));

      if (!interaction.responded) {
        await interaction.respond(choices);
      }
    } catch (error) {
      console.error('Error en autocomplete:', error);
      if (!interaction.responded) {
        await interaction.respond([]);
      }
    }
  },

  async execute(interaction) {
    const query = interaction.options.getString('query');

    if (!query) {
      return await interaction.reply({
        content: '❌ No se proporcionó ninguna canción.',
        ephemeral: true
      });
    }

    try {
      // Aquí puedes poner la lógica para reproducir la canción (más adelante)
      await interaction.reply(`🔊 Reproduciendo: ${query}`);
    } catch (err) {
      console.error('Error ejecutando /play:', err);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Ocurrió un error al ejecutar el comando.',
          ephemeral: true
        });
      }
    }
  }
};
