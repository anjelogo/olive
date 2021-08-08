import { CategoryChannel, NewsChannel, TextChannel, VoiceChannel } from "eris";
import Bot from "../../../main";
import { moduleData } from "../main";

export const run = async (bot: Bot, channel: (TextChannel | NewsChannel | VoiceChannel | CategoryChannel)): Promise<void> => {
	if ([0, 5, 13].includes(channel.type)) return;

	const data: moduleData = (await bot.getModuleData("VC", channel.guild) as unknown) as moduleData;

	async function deleteCategory(guildData: moduleData, channel: string) {
		if (!guildData) return;
	
		const i = guildData.categories.findIndex((c) => c.catID === channel);
		if (i > -1) guildData.categories.splice(i, 1);

		try {
			await bot.updateModuleData("VC", guildData, guildData.guildID);
		} catch (e) {
			throw new Error("Could not delete channel!");
		}
	}

	if (channel.type === 4) {
		const catData = data.categories.find((c) => c.catID === channel.id);
		
		if (catData)
			await deleteCategory(data, catData.catID);
	}

	if (channel.type === 2) {
		const catData = data.categories.find((c) => c.channelID === channel.id);
		
		if (catData)
			await deleteCategory(data, catData.catID);
	}
};