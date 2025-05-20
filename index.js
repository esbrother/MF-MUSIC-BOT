require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const player = createAudioPlayer();

client.once('ready', () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

const activeSearches = new Map(); // Para guardar búsquedas por usuario

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return;

  if (interaction.isChatInputCommand() && interaction.commandName === 'play') {
    const query = interaction.options.getString('query');
    console.log('Buscando canción:', query); // <-- Aquí el primer console.log

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply('❌ Debes estar en un canal de voz para usar este comando.');
    }

    // Buscar canciones (max 5)
    let results;
    try {
      results = await play.search(query, { limit: 5, source: { youtube: "video" } });
      console.log('Resultados obtenidos:', results.length); // <-- Segundo console.log
    } catch (err) {
      console.error('Error en búsqueda:', err); // <-- Loguear error
      return interaction.reply('❌ Error al buscar canciones.');
    }

    if (!results.length) {
      console.log('No se encontraron canciones'); // <-- Tercer console.log
      return interaction.reply('❌ No se encontraron canciones para tu búsqueda.');
    }

    // Guardar resultados para el usuario que pidió
    activeSearches.set(interaction.user.id, { results, voiceChannel });

    // Construir menú select con resultados
    const options = results.map((song, i) => ({
      label: song.title.length > 100 ? song.title.substring(0, 97) + '...' : song.title,
      description: song.channel.name.length > 100 ? song.channel.name.substring(0, 97) + '...' : song.channel.name,
      value: i.toString()
    }));

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_song')
          .setPlaceholder('Selecciona la canción a reproducir')
          .addOptions(options)
      );

    await interaction.reply({ content: '🎶 Selecciona una canción:', components: [row], ephemeral: true });

  } else if (interaction.isStringSelectMenu() && interaction.customId === 'select_song') {
    const userId = interaction.user.id;
    const searchData = activeSearches.get(userId);
    if (!searchData) {
      return interaction.reply({ content: 'No hay búsqueda activa. Usa /play para buscar.', ephemeral: true });
    }

    const selectedIndex = parseInt(interaction.values[0]);
    const song = searchData.results[selectedIndex];
    const voiceChannel = searchData.voiceChannel;

    await interaction.deferReply();

    try {
      await playAndConnect(song.url, voiceChannel, interaction);
      activeSearches.delete(userId);
    } catch (error) {
      console.error(error);
      return interaction.editReply('❌ Ocurrió un error al reproducir la canción.');
    }
  }
});

async function playAndConnect(url, voiceChannel, interaction) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator
  });

  const stream = await play.stream(url);
  const resource = createAudioResource(stream.stream, { inputType: stream.type });

  player.play(resource);
  connection.subscribe(player);

  player.once(AudioPlayerStatus.Playing, () => {
    interaction.editReply(`🎵 Reproduciendo: **${url}**`);
  });

  player.once(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });
}

client.login(process.env.TOKEN);
