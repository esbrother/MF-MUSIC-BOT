const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [
  {
    name: 'play',
    description: 'Reproduce una canción desde múltiples plataformas.',
    options: [
      {
        name: 'query',
        description: 'Nombre o enlace de la canción.',
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Actualizando comandos de aplicación (/)…');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log('Comandos actualizados correctamente.');
  } catch (error) {
    console.error(error);
  }
})();