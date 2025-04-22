import { Message, TextChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";

export const run = async (bot: ExtendedClient, message: Message | { id: string, channel: (TextChannel | { id: string; }), guildID: string, guild: { id: string }}) => {
	const StarboardData = await bot.getModuleData("Starboard", message.guildID as string) as moduleData;

	if (!StarboardData.messages) return;
    
	const msg = StarboardData.messages.find((m) => m.messageID === message.id);
	if (!msg) return;

	StarboardData.messages = StarboardData.messages.filter((m) => m.messageID !== message.id);

	try {
		await bot.updateModuleData("Starboard", StarboardData, message.guildID as string);
	} catch (e) {
		throw new Error("Could not update starboard data");
	}
};