/** Imports */
import { Client, Intents } from 'discord.js';
import dotenv from 'dotenv';

/** Initialize bot */
dotenv.config();
const bot = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

/** Login the bot */
bot.login(process.env.TOKEN);

/** Set bot status and log bot name */
bot.on('ready', () => {
	bot.user.setStatus('available');
	bot.user.setActivity('music', { type: 'LISTENING' });
	console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('messageCreate', (msg) => {
	if (msg.content.includes('jiro')) {
		msg.channel.send('Hey!');
	}
});
