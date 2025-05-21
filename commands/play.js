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
        name: video.title.slice(0, 100), // Discord impone límite de 100 caracteres
        value: video.url
      }));

      // Evita error "Unknown Interaction"
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
      // Usa "flags" para respuesta efímera
      return await interaction.reply({
        content: '❌ No se proporcionó ninguna canción.',
        flags: 64 // efímero
      });
    }

    try {
      await interaction.reply(`🔊 Reproduciendo: ${query}`);
      // Aquí irá luego la lógica de reproducción real con @discordjs/voice
    } catch (err) {
      console.error('Error ejecutando /play:', err);

      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ Ocurrió un error al ejecutar el comando.',
          flags: 64
        });
      }
    }
  }
};
