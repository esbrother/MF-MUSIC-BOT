const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const play = require('play-dl');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { playSong } = require('./functions/player');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Error al ejecutar el comando.', ephemeral: true });
      }
    }
  }

  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  }
});

// Función para reproducir canción, delega a functions/player.js
client.playSong = async (interaction, url) => {
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });

  try {
    await playSong(voiceChannel, url);
  } catch (error) {
    console.error('❌ Error al reproducir canción:', error);
    if (!interaction.replied) {
      interaction.followUp({ content: '❌ No se pudo reproducir la canción.', ephemeral: true });
    }
  }
};

client.once('ready', () => {
  console.log(`✅ Bot iniciado como ${client.user.tag}`);
  if (process.env.YOUTUBE_API_KEY) {
    play.setToken({
      youtube: {
        api_key: process.env.YOUTUBE_API_KEY
      }
    });
  }
});
