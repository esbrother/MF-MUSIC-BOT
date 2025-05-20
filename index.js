require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.on('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith('!play')) return;
  const args = message.content.split(' ');
  const url = args[1];

  if (!url) return message.reply('Debes poner un enlace de YouTube');
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('¡Debes estar en un canal de voz!');

  const stream = await play.stream(url);
  const resource = createAudioResource(stream.stream, { inputType: stream.type });

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator
  });

  const player = createAudioPlayer();
  player.play(resource);
  connection.subscribe(player);

  message.reply(`🎵 Reproduciendo: ${url}`);
});

client.login(process.env.TOKEN);
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
play.setToken({ youtube: { api_key: 'AIzaSyAdEngZUNjAM9cXu6yhkfs8BL7acKXBdH4' } })
