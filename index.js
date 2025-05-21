const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

client.commands = new Collection();

// Cargar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[ADVERTENCIA] El comando en ${file} está incompleto.`);
  }
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    if (interaction.isChatInputCommand()) {
      await command.execute(interaction);
    } else if (interaction.isAutocomplete()) {
      await command.autocomplete(interaction);
    }
  } catch (error) {
    console.error('❌ Error en interacción:', error);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({
        content: '❌ Error al ejecutar el comando.',
        flags: 64
      });
    }
  }
});

client.login(process.env.TOKEN);
