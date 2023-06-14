import { Guild, Message, TextChannel } from "oceanic.js";
import Bot from "../../../main";
import Logging from "../../logging/main";
import { messageDataStructure, moduleData } from "../main";
import { moduleData as LoggingModuleData } from "../../logging/main";

export const createLogEntry = async (bot: Bot, guild: Guild, message: Message): Promise<void> => {

	const star = {
			small: "⭐",
			medium: "🌟",
			large: "💫"
		},
		logging = await bot.getModule("Logging") as Logging,
		guildData = await bot.getModuleData("Starboard", guild) as moduleData,
		messageData = guildData.messages.find((m) => m.messageID === message.id) as messageDataStructure,
		stars = messageData.stars.length <= 3 ? star.small : messageData.stars.length <= 10 ? star.medium : star.large;

	const loggingObj: any = {
		content: `${stars} **${messageData.stars.length}** <#${message.channelID}>\n(${messageData.messageID})`,
		embeds: [{  
			type: "rich",
			author: {
				name: message.author.username,
				iconURL: message.author.avatarURL()
			},
			description: message.content ?? undefined,
			fields: [
				{
					name: "Source",
					value: `[Jump to message](https://discordapp.com/channels/${guild.id}/${message.channelID}/${message.id})`
				}
			],
			timestamp: new Date().toISOString(),
			color: 16448210
		}]
	};

	if (message.attachments.size)
		loggingObj.embeds[0].image = { url: message.attachments.first()!.url };

	logging.log(guild, "starboard", loggingObj, {
		channelID: message.channelID,
		starID: message.id
	});

};

export async function removeLogEntry(bot: Bot, guild: Guild, starID: string): Promise<void> {

	const guildLoggingData = await bot.getModuleData("Logging", guild) as LoggingModuleData,
		loggingChannels = guildLoggingData.channels.filter((c) => c.types.includes("starboard"));

	if (loggingChannels.length) {
		for (const channels of loggingChannels) {
			if (!channels.stars) continue;
			const star = channels.stars.find((s) => s.starID === starID);
			if (!star) continue;

			const message = bot.findMessage(bot.getChannel(channels.channelID) as TextChannel, star.messageID);

			if (!message) continue;

			channels.stars = channels.stars.filter((s) => s.starID !== starID);

			try {
				await message.delete();
				await bot.updateModuleData("Logging", guildLoggingData, guild);
			} catch (e) {
				throw new Error("Could not delete message");
			}
		}
	}

}

export async function updateLogEntry(bot: Bot, guild: Guild, starID: string) {

	const guildLoggingData = await bot.getModuleData("Logging", guild) as LoggingModuleData,
		loggingChannels = guildLoggingData.channels.filter((c) => c.types.includes("starboard"));

	if (loggingChannels.length) {
		for (const starboard of loggingChannels) {
			if (!starboard.stars) continue;
			const star = starboard.stars.find((s) => s.starID === starID);
			if (!star) continue;

			const message = bot.findMessage(bot.getChannel(starboard.channelID) as TextChannel, star.messageID);

			if (!message) continue;

			const starStrings = {
					small: "⭐",
					medium: "🌟",
					large: "💫"
				},
				guildData = await bot.getModuleData("Starboard", guild) as moduleData,
				messageData = guildData.messages.find((m) => m.messageID === starID) as messageDataStructure,
				channel = bot.findChannel(guild, messageData.channelID) as TextChannel,
				stars = messageData.stars.length <= 3 ? starStrings.small : messageData.stars.length <= 10 ? starStrings.medium : starStrings.large;

			try {
				await message.edit({
					content: `${stars} **${messageData.stars.length}** <#${channel.id}>\n(${messageData.messageID})`,
					embeds: [message.embeds[0]]
				});
			} catch (e) {
				throw new Error("Could not delete message");
			}
		}
	}

}