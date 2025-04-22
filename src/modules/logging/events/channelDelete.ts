import { TextChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";

export const run = async (bot: ExtendedClient, channel: (TextChannel)): Promise<void> => {
	if (![0, 5].includes(channel.type)) return;

	const data: moduleData = (await bot.getModuleData("VC", channel.guild.id) as unknown) as moduleData;

	async function deleteChannel(guildData: moduleData, channel: string) {
		if (!guildData) return;

		const i = guildData.channels.findIndex((c) => c.channelID === channel);
		if (i > -1) guildData.channels.splice(i, 1);

		try {
			await bot.updateModuleData("VC", guildData, guildData.guildID);
		} catch (e) {
			throw new Error("Could not delete channel!");
		}
	}

	const logChannel = data.channels.find((c) => c.channelID === channel.id);

	if (logChannel)
		await deleteChannel(data, channel.id);
    
};