const { SlashCommandBuilder } = require('discord.js');
const playdl = require('play-dl');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción desde múltiples fuentes')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Nombre de la canción o enlace')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    if (!focused) return;

    let suggestions = [];

    try {
      // Buscar sugerencias en YouTube
      const ytResults = await playdl.search(focused, { limit: 5 });

      suggestions = ytResults.map(video => ({
        name: `🎵 ${video.title.slice(0, 95)}`,
        value: video.url
      }));
    } catch (error) {
      console.error('Error al obtener sugerencias:', error);
    }

    await interaction.respond(suggestions);
  },

  async execute(interaction) {
    const query = interaction.options.getString('query');

    await interaction.reply(`🔊 Reproduciendo: ${query}`);
    // Aquí va la lógica de reproducción con play-dl y @discordjs/voice
    // Puedes implementarla o integrarla según tu setup
  }
};
