const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const play = require('play-dl');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();

// Cargar todos los comandos desde la carpeta /commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Manejador de interacción de comandos
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Error al ejecutar el comando.', ephemeral: true });
    }
  }

  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) return;
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  }
});

// Lógica para reproducir audio (puede llamarse desde play.js)
client.playSong = async (interaction, url) => {
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) return interaction.reply('❌ Debes estar en un canal de voz.');

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator
  });

  const stream = await play.stream(url);
  const resource = createAudioResource(stream.stream, {
    inputType: stream.type
  });

  const player = createAudioPlayer();
  connection.subscribe(player);
  player.play(resource);

  player.on(AudioPlayerStatus.Idle, () => {
    const conn = getVoiceConnection(interaction.guild.id);
    if (conn) conn.destroy();
  });

  return interaction.followUp(`▶️ Reproduciendo: ${url}`);
};

client.once('ready', () => {
  console.log(`✅ Bot iniciado como ${client.user.tag}`);
  play.setToken({
    youtube: {
      api_key: process.env.YOUTUBE_API_KEY
    }
  });
});

client.login(process.env.TOKEN);
