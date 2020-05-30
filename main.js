const Discord = require('discord.js');
const fs = require('fs');
const colors = require('colors');
const ytdl = require('ytdl-core');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const client = new Discord.Client();
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
  
client.once("reconnecting", () => {
    console.log("Reconnecting!");
});
  
client.once("disconnect", () => {
    console.log("Disconnect!");
});

const COLORS = {
  error: 0xe74c3c,
  info: 0x2ecc71,
  blue: 0x3498db,
  orange: 0xe67e22,
  white: 0xecf0f1,
  yellow: 0xf1c40f,
  dark: 0x2c3e50
}

const queue = new Map();

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(config.prefix + 'play')) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(config.prefix + 'skip')) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(config.prefix + 'stop')) {
    stop(message, serverQueue);
    return;
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    const embed = new Discord.MessageEmbed()
      .setTitle('Music')
      .setColor(config.color)
      .setDescription('You must be in a voice channel before i can play music')
      .setAuthor(config.author, config.avatar, config.url)
      .setThumbnail(config.img)
    message.channel.send(embed);
    return;}
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    const embed = new Discord.MessageEmbed()
      .setTitle('Music')
      .setColor(config.color)
      .setDescription('I need the permissions to join and speak in your voice channel!')
      .setAuthor(config.author, config.avatar, config.url)
      .setThumbnail(config.img)
    message.channel.send(embed);
    return;
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    const embed = new Discord.MessageEmbed()
      .setTitle('Music')
      .setColor(config.color)
      .setDescription(`${song.title} has been added to the queue!`)
      .setAuthor(config.author, config.avatar, config.url)
      .setThumbnail(config.img)
    message.channel.send(embed);
    return;
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel) {
    const embed = new Discord.MessageEmbed()
      .setTitle('Music')
      .setColor(config.color)
      .setDescription(`You must be in my voice channel to stop the music!`)
      .setAuthor(config.author, config.avatar, config.url)
      .setThumbnail(config.img)
    message.channel.send(embed);
    return;}
  if (!serverQueue){
    const embed = new Discord.MessageEmbed()
      .setTitle('Music')
      .setColor(config.color)
      .setDescription(`There's no song to skip!`)
      .setAuthor(config.author, config.avatar, config.url)
      .setThumbnail(config.img)
    message.channel.send(embed);
    return;
  }
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel) {
    const embed = new Discord.MessageEmbed()
      .setTitle('Music')
      .setColor(config.color)
      .setDescription(`You must be in my voice channel to stop the music!`)
      .setAuthor(config.author, config.avatar, config.url)
      .setThumbnail(config.img)
    message.channel.send(embed);
    return;}
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  const embed = new Discord.MessageEmbed()
      .setTitle('Music')
      .setColor(config.color)
      .setDescription(`Start playing: **${song.title}**`)
      .setAuthor(config.author, config.avatar, config.url)
      .setThumbnail(config.img)
  serverQueue.textChannel.send(embed);
}

var prefix = config.prefix;

client.on('message', message => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;
    const args = message.content.slice(config.prefix.length).split(' ');
    const command = args.shift().toLowerCase();

 	if (command === 'info') {
     console.log('Someone use ' + config.prefix + 'info');
 		const embed = new Discord.MessageEmbed()
       .setTitle('Serverinfo')
       .setColor(config.color)
       .setDescription('')
       .setAuthor(config.author, config.avatar, config.url)
       .addFields(
         { name: 'Name:', value: `${message.guild.name}`, inline: true },
         { name: 'Member: ', value: `${message.guild.memberCount}`, inline:true }
       )
     message.channel.send(embed);
   } else if (command === 'help') {
     if (!args[0]) {
         console.log('Someone use ' + config.prefix + 'help'.green);
         const embed = new Discord.MessageEmbed()
             .setTitle('Help')
             .setColor(config.color)
             .setDescription('')
             .setAuthor(config.author, config.avatar, config.url)
             .setThumbnail(config.img)
             .addFields(
                 { name: 'Music/Voice Channel', value: 'voice', inline: true },
                 { name: 'Moderator', value: 'mod', inline:true },
                 { name: 'Messages', value: 'msg', inlin: true },
                 { name: 'Bot Creator:', value: 'creator', inline: true }
             )
         message.channel.send(embed);
     } else if (args[0] === 'all') {
         console.log('Someone use ' + config.prefix + 'help'.green);
         const embed = new Discord.MessageEmbed()
             .setTitle('Help')
             .setColor(config.color)
             .setDescription('')
             .setAuthor(config.author, config.avatar, config.url)
             .setThumbnail(config.img)
             .addFields(
                 { name: 'Music/Voice Channel', value: 'voice', inline: true },
                 { name: 'Moderator', value: 'mod', inline:true },
                 { name: 'Messages', value: 'msg', inlin: true },
                 { name: 'Bot Creator:', value: 'creator', inline: true }
             )
             message.channel.send(embed);
     } else if (args[0] === 'voice') {
        console.log('Someone use ' + config.prefix + 'voice');
        const embed = new Discord.MessageEmbed()
          .setTitle('Help Music/Voice Channel')
          .setColor(config.color)
          .setDescription('')
          .setAuthor(config.author, config.avatar, config.url)
          .setThumbnail(config.img)
          .addFields(
            { name: 'play', value: 'play music from YouTube' },
            { name: 'skip', value: 'skip a song from YouTube' },
            { name: 'stop', value: 'stop the music form ' }
          )
        message.channel.send(embed);
     } else if (args[0] === 'mod') {
        console.log('Someone use ' + config.prefix + 'mod');
        const embed = new Discord.MessageEmbed()
          .setTitle('Help Modoration')
          .setColor(config.color)
          .setDescription('')
          .setAuthor(config.author, config.avatar, config.url)
          .setThumbnail(config.img)
          .addFields(
            { name: 'kick', value: 'kick a member' },
            { name: 'ban', value: 'ban a member' }
          )
        message.channel.send(embed);
     } else if (args[0] === 'msg') {
        console.log('Someone use ' + config.prefix + 'msg');
        const embed = new Discord.MessageEmbed()
          .setTitle('Help Messages')
          .setColor(config.color)
          .setDescription('')
          .setAuthor(config.author, config.avatar, config.url)
          .setThumbnail(config.img)
          .addFields(
            { name: 'help', value: 'to become help' },
            { name: 'hi', value: 'to say hi to the bot' },
            { name: 'info', value: 'gives information of the server' },
            { name: 'say', value: 'let the bot say what you want' }
          )
        message.channel.send(embed);
     }
   } else if (command === 'info') {
    const embed = new Discord.MessageEmbed()
    .setTitle('Serverinfo')
    .setColor(config.color)
    .setDescription('')
    .setAuthor(config.author, config.avatar, config.url)
    .addFields(
      { name: 'Name:', value: `${message.guild.name}`, inline: true },
      { name: 'Member: ', value: `${message.guild.memberCount}`, inline:true },
      { name: 'Owner:', value: `${message.own}`, inline: true }
    )
   } else if (command === 'kick') {
    if (!message.member.hasPermission("KICK_MEMBER")) {
      msg.channel.send("You don't have permissions for that");
      return;
    }
    const user = message.mentions.users.first();
    if (user) {
      const member = message.guild.member(user);
      if (member) {
        member
          .kick(`${args[1]}`)
          .then(() => {
            message.reply(`Successfully kicked ${user.tag}`);
          })
          .catch(err => {
            message.reply('I was unable to kick the member');
            console.error(err);
          });
      } else {
        message.reply("That user isn't in this guild!");
      }
    } else {
      message.reply("You didn't mention the user to kick!");
    }
   } else if (command === 'ban') {
    if (!message.member.hasPermission("BAN_MEMBER")) {
      message.channel.send("You don't have permissions for that!");
      return;
    };
    const user = message.mentions.users.first();
    if (user) {
      const member = message.guild.member(user);
      if (member) {
        member
          .ban({
            reason: `${args[1]}`,
          })
          .then(() => {
            message.reply(`Successfully banned ${user.tag}`);
          })
          .catch(err => {
            message.reply('I was unable to ban the member');
            console.error(err);
          });
       } else {
        message.reply("That user isn't in this guild!");
      }
    } else {
      message.reply("You didn't mention the user to ban!");
    };
  } else if (command === 'creator') {
    console.log('Someone use ' + config.prefix + 'creator yay :)'.green);
    const embed = new Discord.MessageEmbed()
      .setTitle('TPBot created bye Minecodes#1043')
      .setColor(config.color)
      .setDescription('')
      .setAuthor(config.author, config.avatar, config.url)
      .addFields(
        { name: 'Creator:', value: 'Minecodes#1043' },
        { name: 'YouTube Channel:', value: 'https://www.youtube.com/channel/UCxt0A5bz_CCSDMoFiYQdWNQ' }
      )
    message.channel.send(embed);
  } else if (command === 'avatar') {
    console.log('Someone use ' + config.prefix + 'avatar'.green);
    message.reply(message.author.displayAvatarURL());
  } else if (command === 'hi') {
    console.log('Someone use ' + config.prefix + 'hi'.green);
    message.reply('hi')
  } else if (command === 'info') {
    console.log('Someone use ' + config.prefix + 'info');
		const embed = new Discord.MessageEmbed()
      .setTitle('Serverinfo')
      .setColor(config.color)
      .setDescription('')
      .setAuthor(config.author, config.avatar, config.url)
      .addFields(
        { name: 'Name:', value: `${message.guild.name}`, inline: true },
        { name: 'Member: ', value: `${message.guild.memberCount}`, inline:true },
        { name: 'Owner:', value: `${message.own}`, inline: true }
      )
    message.channel.send(embed);
  } else if (command === 'say') {
    message.channel.send(args)
  }
});

client.on('message', message => {
  if (message.content === 'call pizza') {
    message.delete();
    message.channel.send(`${message.author} says`);
    const embed = new Discord.MessageEmbed()
      .setTitle('Call Pizza')
      .setDescription('https://pizza.de/ (https://commons.wikimedia.org/wiki/File:Pizza_Napoli.jpg), �Pizza Napoli�, https://creativecommons.org/licenses/by-sa/4.0/legalcode')
      .setColor(config.color)
      .setImage('https://upload.wikimedia.org/wikipedia/commons/b/b8/Pizza_Napoli.jpg')
    message.channel.send(embed);
  }
})

client.login(config.token);
