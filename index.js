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

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith('!play')) return;
  if (message.author.bot) return;

  const args = message.content.split(' ').slice(1);
  const query = args.join(' ');
  if (!query) return message.reply('❌ Por favor escribe el nombre o link de la canción.');

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('❌ ¡Debes estar en un canal de voz!');

  let searchResults;
  try {
    searchResults = await play.search(query, { limit: 5 });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Error al buscar la canción.');
  }

  if (!searchResults.length) return message.reply('❌ No encontré resultados para tu búsqueda.');

  let replyMsg = '🎶 Selecciona una canción escribiendo el número:\n';
  searchResults.forEach((song, i) => {
    replyMsg += `**${i + 1}.** ${song.title} - ${song.channel.name}\n`;
  });
  await message.reply(replyMsg);

  const filter = m => m.author.id === message.author.id && /^[1-5]$/.test(m.content);
  try {
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
    const choice = parseInt(collected.first().content);
    const selectedSong = searchResults[choice - 1];

    const stream = await play.stream(selectedSong.url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    player.play(resource);
    connection.subscribe(player);

    await message.reply(`🎵 Reproduciendo: **${selectedSong.title}**`);
  } catch {
    message.reply('⌛ Tiempo agotado, no se seleccionó ninguna canción.');
  }
});

client.login(process.env.TOKEN);
