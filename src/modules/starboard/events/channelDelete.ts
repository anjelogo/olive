import { TextChannel } from "oceanic.js";
import Bot from "../../../main";
import { moduleData } from "../main";

export const run = async (bot: Bot, channel: TextChannel) => {
	const StarboardData = await bot.getModuleData("Starboard", channel.guild.id) as moduleData;

	if (!StarboardData.messages) return;
    
	const channelObj = StarboardData.messages.find((m) => m.channelID === channel.id);
	if (!channelObj) return;

	StarboardData.messages = StarboardData.messages.filter((m) => m.channelID !== channel.id);

	try {
		await bot.updateModuleData("Starboard", StarboardData, channel.guild.id);
	} catch (e) {
		throw new Error("Could not update starboard data");
	}
};