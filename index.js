require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

if (!process.env.TOKEN) {
  console.error('❌ ERROR: El token no está configurado en .env');
  process.exit(1);
}

if (!process.env.YOUTUBE_API_KEY) {
  console.error('❌ ERROR: La API Key de YouTube no está configurada en .env');
  process.exit(1);
}

// Configura la API key para play-dl
play.setToken({
  youtube: {
    api_key: process.env.YOUTUBE_API_KEY
  }
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Solo comandos que comienzan con !play
  if (!message.content.toLowerCase().startsWith('!play')) return;

  const args = message.content.split(' ');
  const url = args[1];

  if (!url) return message.reply('❌ Debes proporcionar un enlace de YouTube.');

  // Verifica que el usuario esté en un canal de voz
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('❌ ¡Debes estar en un canal de voz para reproducir música!');

  try {
    // Conéctate al canal de voz
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    // Descarga y crea recurso de audio
    const stream = await play.stream(url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    // Crea y configura el reproductor de audio
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy(); // Salir del canal cuando termine
    });

    player.on('error', (error) => {
      console.error('Error en el reproductor de audio:', error);
      message.channel.send('❌ Hubo un error reproduciendo la canción.');
      connection.destroy();
    });

    await message.reply(`🎶 Reproduciendo: ${url}`);
  } catch (error) {
    console.error('Error en comando !play:', error);
    message.reply('❌ No pude reproducir esa canción. Revisa que el enlace sea válido.');
  }
});

client.login(process.env.TOKEN);
