import { Category, Channel } from "./interfaces";
import { GuildChannel, Member, VoiceChannel } from "eris";
import Bot from "../../../main";
import { moduleData } from "../main";

export const create = async (bot: Bot, member: Member, channel: VoiceChannel): Promise<void> => {
	if (!await bot.getModule("Main").handlePermission(member, "vc.join")) return;

	const data: moduleData = (await bot.getModuleData("VC", channel.guild) as unknown) as moduleData,
		category: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

	if (!category || (category && category.channelID !== channel.id)) return;

	const parentOverwrites = (bot.findChannel(channel.guild, category.catID) as GuildChannel).permissionOverwrites.map((p) => ({ id: p.id, type: p.type, allow: Number(p.allow.toString()), deny: Number(p.deny.toString())}));

	const voice = await member.guild.createChannel(
		data.defaultName.channel.replace("{user}", member.username),
		2,
		{
			parentID: channel.parentID as string,
			permissionOverwrites: [
				...parentOverwrites
			]
		});
				
	const newChannel: Channel = {
		channelID: voice.id,
		owner: member.id,
		createdAt: Date.now(),
		locked: false,
		parentOverwrites
	};

	member.edit({ channelID: voice.id });
		
	category.channels.push(newChannel);
	await bot.updateModuleData("VC", data, channel.guild);
};

export const remove = async (bot: Bot, member: Member, channel: VoiceChannel): Promise<void> => {
	const data: moduleData = (await bot.getModuleData("VC", channel.guild) as unknown) as moduleData,
		category: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

	if (!category) return;

	const channelObj = category.channels.find((c) => c.channelID === channel.id);

	if (!channelObj) return;

	if (channel.voiceMembers.size <= 0) {

		await channel.delete();

		const i = category.channels.findIndex((c: Channel) => c.channelID === channel.id);
		if (i > -1) category.channels.splice(i, 1);
		await bot.updateModuleData("VC", data, channel.guild);
		
	} else if (member.id === channelObj.owner) {
		const members = channel.voiceMembers.filter((m) => m.id !== member.id).map((m) => m.id),
			newOwner = members[Math.floor(Math.random() * members.length)];

		channelObj.owner = newOwner;

		await bot.updateModuleData("VC", data, channel.guild);
	}
};