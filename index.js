require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`✅ Bot listo! Conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'play') {
    const query = interaction.options.getString('query');

    // Verifica que el usuario esté en canal de voz
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply('❌ ¡Debes estar en un canal de voz para usar este comando!');
    }

    await interaction.deferReply();

    try {
      // Busca y obtiene info del video o playlist
      let source;
      if (play.yt_validate(query) === 'video') {
        source = await play.stream(query);
      } else {
        // Buscar por palabra clave en YouTube
        const searchResults = await play.search(query, { limit: 1 });
        if (searchResults.length === 0) return interaction.editReply('❌ No encontré ninguna canción con ese nombre.');
        source = await play.stream(searchResults[0].url);
      }

      // Conecta al canal de voz
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(source.stream, { inputType: source.type });

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy(); // Desconectar cuando termine la canción
      });

      interaction.editReply(`🎶 Reproduciendo: **${source.videoDetails?.title || query}**`);
    } catch (error) {
      console.error(error);
      interaction.editReply('❌ Ocurrió un error al reproducir la canción.');
    }
  }
});

client.login(process.env.TOKEN);
