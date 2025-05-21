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

      // ✅ Solo responder si aún no se ha respondido
      if (!interaction.responded) {
        await interaction.respond(choices);
      }
    } catch (error) {
      console.error('❌ Error en autocomplete:', error);
      // Evita segundo intento de respuesta si ya fue reconocida
      if (!interaction.responded) {
        try {
          await interaction.respond([]);
        } catch (err) {
          console.error('❌ No se pudo enviar respuesta vacía en autocomplete:', err);
        }
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
      await interaction.reply(`🔊 Reproduciendo: ${query}`);
      // Aquí deberías insertar la lógica de reproducción real usando @discordjs/voice
    } catch (err) {
      console.error('❌ Error ejecutando /play:', err);

      // Verifica si ya se respondió
      if (!interaction.replied && interaction.isRepliable()) {
        try {
          await interaction.reply({
            content: '❌ Ocurrió un error al ejecutar el comando.',
            ephemeral: true
          });
        } catch (e) {
          console.error('❌ No se pudo enviar mensaje de error:', e);
        }
      }
    }
  }
};
