const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nombre o enlace de la canción')
        .setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registrando comandos slash...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('¡Comandos registrados!');
  } catch (error) {
    console.error(error);
  }
})();
