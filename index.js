/** Imports */
import Discord from 'discord.js';
import dotenv from 'dotenv';
import ytdl from 'ytdl-core';

/** Initialize bot */
dotenv.config();
const bot = new Discord.Client();

const queue = new Map();

/** Login the bot */
bot.login(process.env.TOKEN);

/** Set bot status and log bot name */
bot.on('ready', () => {
	bot.user.setStatus('available');
	bot.user.setActivity('music', { type: 'LISTENING' });
	console.info(`Logged in as ${bot.user.tag}!`);
});

/** Message listener */
bot.on('message', (msg) => {
	if (msg.author.bot) return;

	/** Get server ID */
	const serverQueue = queue.get(msg.guild.id);

	/** Commands */
	if (msg.content.startsWith('jiro play')) {
		player(msg, serverQueue);
	} else if (msg.content.startsWith('jiro skip')) {
		skip(msg, serverQueue);
	} else if (msg.content.startsWith('jiro stop')) {
		stop(msg, serverQueue);
	}
});

/** Main function for playing songs */
async function player(msg, serverQueue) {
	const args = msg.content.split(' ');

	const voiceChannel = msg.member.voice.channel;
	if (!voiceChannel)
		return msg.channel.send(
			'You need to be in a voice channel for me to play music!'
		);
	const permissions = voiceChannel.permissionsFor(msg.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return msg.channel.send(
			'I need the permissions to join and speak in your voice channel!'
		);
	}

	const songInfo = await ytdl.getInfo(args[2]);
	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
	};

	if (!serverQueue) {
		const queueContruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};

		queue.set(msg.guild.id, queueContruct);

		queueContruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueContruct.connection = connection;
			play(msg.guild, queueContruct.songs[0]);
		} catch (err) {
			console.log(err);
			queue.delete(msg.guild.id);
			return msg.channel.send(err);
		}
	} else {
		serverQueue.songs.push(song);
		return msg.channel.send(`I've added **${song.title}** to the queue!`);
	}
}

/** Play function */
function play(guild, song) {
	const serverQueue = queue.get(guild.id);
	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	const dispatcher = serverQueue.connection
		.play(ytdl(song.url))
		.on('finish', () => {
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', (error) => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	serverQueue.textChannel.send(`Okay! Playing **${song.title}**`);
}

/** Skip function */
function skip(msg, serverQueue) {
	if (!msg.member.voice.channel)
		return msg.channel.send(
			'You have to be in a voice channel to stop the music!'
		);
	if (!serverQueue)
		return msg.channel.send('There is no song that I could skip!');
	serverQueue.connection.dispatcher.end();
}

/** Stop function */
function stop(msg, serverQueue) {
	if (!msg.member.voice.channel)
		return msg.channel.send(
			'You have to be in a voice channel to stop the music!'
		);

	if (!serverQueue)
		return msg.channel.send('There is no song that I could stop!');

	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}
