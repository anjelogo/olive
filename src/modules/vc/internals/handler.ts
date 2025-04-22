import { Category, Channel } from "./interfaces";
import { CategoryChannel, Constants, Member, StageChannel, VoiceChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";
import Logging from "../../logging/main";

export const create = async (bot: ExtendedClient, member: Member, channel: VoiceChannel): Promise<void> => {
	if (!await bot.getModule("Main").handlePermission(member, "vc.join")) return;

	const data: moduleData = (await bot.getModuleData("VC", channel.guild.id) as unknown) as moduleData,
		category: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

	if (!category || (category && category.channelID !== channel.id)) return;

	const parentOverwrites = (bot.findChannel(channel.guild, category.catID) as CategoryChannel).permissionOverwrites.map((p) => ({ id: p.id, type: p.type, allow: p.allow, deny: p.deny}));

	const voice = await member.guild.createChannel(
		Constants.ChannelTypes.GUILD_VOICE,
		{
			name: data.defaultName.channel.replace("{user}", member.username),
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

  // send a message to the user
  try {
    const dm = await member.user.createDM();
    await dm.createMessage({
      embeds: [{
        description: `You have created \`${voice.name}\`!\n\nYou can lock the channel by using \`/vc lock\` and unlock it by using \`/vc unlock\`.\nView information about the channel by using \`/vc info\`.\n\nLeaving the channel will delete it or transfer ownership to another member if there are other members in the channel.`,
        author: {
          name: "Private Voice Channel Created",
        },
        color: bot.constants.config.colors.default,
        timestamp: new Date().toISOString(),
      }]
    })
  } catch (e) {
    console.error(e);
  }
  
  const logging = await bot.getModule("Logging") as Logging;
	logging.log(channel.guild, "vc", {embeds: [{
		type: "rich",
		title: `${member.username}`,
		description: `Created \`${voice.name}\``,
		author: {
			name: "Create New Private Voice Channel",
			iconURL: member.avatarURL()
		},
		color: bot.constants.config.colors.default,
		timestamp: new Date().toISOString(),
		footer: {
			text: `ID: ${member.id}`
		}
	}]});
};

export const remove = async (bot: ExtendedClient, member: Member, channel: VoiceChannel | StageChannel): Promise<void> => {
	const data: moduleData = (await bot.getModuleData("VC", channel.guild.id) as unknown) as moduleData,
		category: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

	if (!category) return;

	const channelObj = category.channels.find((c) => c.channelID === channel.id);

	if (!channelObj) return;

	const logging = await bot.getModule("Logging") as Logging;
	logging.log(channel.guild, "vc", {embeds: [{
		type: "rich",
		title: `${member.username}`,
		description: `Left \`${channel.name}\``,
		author: {
			name: "Left Private Voice Channel",
			iconURL: member.avatarURL()
		},
		color: bot.constants.config.colors.red,
		timestamp: new Date().toISOString(),
		footer: {
			text: `ID: ${member.id}`
		}
	}]});

	if (channel.voiceMembers.size <= 0) {

		await channel.delete();

		const i = category.channels.findIndex((c: Channel) => c.channelID === channel.id);
		if (i > -1) category.channels.splice(i, 1);
		await bot.updateModuleData("VC", data, channel.guild);

		logging.log(channel.guild, "vc", {embeds: [{
			type: "rich",
			title: `${member.username}`,
			description: `Ended \`${channel.name}\``,
			author: {
				name: "Ended Private Voice Channel",
				iconURL: member.avatarURL()
			},
			fields: [
				{
					name: "Time Elapsed",
					value: bot.constants.utils.HMS(Date.now() - channelObj.createdAt)
				}
			],
			color: bot.constants.config.colors.default,
			timestamp: new Date().toISOString(),
			footer: {
				text: `ID: ${member.id}`
			}
		}]});
		
	} else if (member.id === channelObj.owner) {
		const members = channel.voiceMembers.filter((m) => m.id !== member.id).map((m) => m.id),
			newOwner = bot.findMember(channel.guild, members[Math.floor(Math.random() * members.length)]) as Member;

		channelObj.owner = newOwner.id;

		await bot.updateModuleData("VC", data, channel.guild);

		logging.log(channel.guild, "vc", {embeds: [{
			type: "rich",
			title: `${member.username} -> ${newOwner.username}`,
			description: `Set \`${newOwner.username}\` the owner of \`${channel.name}\``,
			author: {
				name: "Transferred Private Voice Channel Ownership",
				iconURL: member.avatarURL()
			},
			color: bot.constants.config.colors.default,
			timestamp: new Date().toISOString(),
			footer: {
				text: `ID: ${member.id}`
			}
		}]});

    try {
      const newOwnerDM = await newOwner.user.createDM();
      await newOwnerDM.createMessage({content: `${bot.constants.emojis.warning.yellow} You are now the owner of \`${channel.name}\` in \`${channel.guild.name}\`!`});
      const oldOwnerDM = await member.user.createDM();
      await oldOwnerDM.createMessage({content: `${bot.constants.emojis.warning.yellow} Ownership of \`${channel.name}\` has been transferred to \`${newOwner.tag}\` for \`${channel.guild.name}\`!`});
    } catch (e) {
      console.error(e);
    }
	}
};