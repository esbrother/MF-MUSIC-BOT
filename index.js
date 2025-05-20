require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

// Configurar YouTube API KEY para mejores resultados
play.setToken({
  youtube: {
    api_key: process.env.YT_API_KEY
  }
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const player = createAudioPlayer();
const activeSearches = new Map();

client.once('ready', () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

// SLASH COMMAND REGISTRATION
const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Busca y reproduce una canción.')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nombre o URL de la canción')
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
  .then(() => console.log('✅ Comando /play registrado correctamente.'))
  .catch(console.error);

// INTERACTION HANDLER
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return;

  // Slash command /play
  if (interaction.isChatInputCommand() && interaction.commandName === 'play') {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) return interaction.reply('❌ Debes estar en un canal de voz.');

    try {
      const results = await play.search(query, {
        limit: 5,
        source: {
          youtube: "video",
          soundcloud: "tracks",
          spotify: "tracks"
        }
      });

      if (!results.length) return interaction.reply('❌ No se encontraron canciones.');

      activeSearches.set(interaction.user.id, { results, voiceChannel });

      const options = results.map((song, i) => ({
        label: song.title.length > 100 ? song.title.substring(0, 97) + '...' : song.title,
        description: song.channel?.name?.substring(0, 100) || 'Sin canal',
        value: i.toString()
      }));

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_song')
          .setPlaceholder('Selecciona una canción')
          .addOptions(options)
      );

      await interaction.reply({ content: '🎶 Selecciona una canción:', components: [row], ephemeral: true });

    } catch (err) {
      console.error(err);
      interaction.reply('❌ Error al buscar canciones.');
    }
  }

  // Select menu
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_song') {
    const userId = interaction.user.id;
    const data = activeSearches.get(userId);
    if (!data) return interaction.reply({ content: '⚠️ No hay búsqueda activa.', ephemeral: true });

    const song = data.results[parseInt(interaction.values[0])];
    const voiceChannel = data.voiceChannel;

    try {
      await interaction.deferReply();

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

      const stream = await play.stream(song.url);
      const resource = createAudioResource(stream.stream, { inputType: stream.type });

      player.play(resource);
      connection.subscribe(player);

      player.once(AudioPlayerStatus.Playing, () => {
        interaction.editReply(`🎵 Reproduciendo: **${song.title}**`);
      });

      player.once(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      activeSearches.delete(userId);
    } catch (error) {
      console.error(error);
      interaction.editReply('❌ Error al reproducir la canción.');
    }
  }
});

client.login(process.env.TOKEN);
