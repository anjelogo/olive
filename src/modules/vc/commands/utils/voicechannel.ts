import { CommandInteraction, Constants, Embed, Guild, GuildChannel, InteractionDataOptionsSubCommand, InteractionDataOptionsSubCommandGroup, Member, Message, Role, VoiceChannel } from "eris";
import { Category, Channel } from "../../internals/interfaces";
import { moduleData } from "../../main";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";

export default class Voicechannel extends Command {
	
	constructor(bot: Bot) {

		super(bot);

		this.commands = ["voicechannel", "vc"];
		this.description = "The main Voicechannel command";
		this.example = "voicechannel";
		this.permissions = ["vc.view"];
		this.options = [
			{
				name: "set",
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
				description: "Set values",
				permissions: ["vc.edit"],
				options: [
					{
						name: "name",
						type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
						description: "Set a new name for the voice channel",
						permissions: ["vc.edit.name"],
						options: [
							{
								name: "name",
								type: Constants.ApplicationCommandOptionTypes.STRING,
								description: "The new name of the voicechannel",
								required: true
							}
						]
					}, {
						name: "category",
						type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
						description: "Set a category as a Private VC category",
						permissions: ["vc.edit.category"],
						options: [
							{
								name: "channel",
								type: Constants.ApplicationCommandOptionTypes.CHANNEL,
								description: "The channel",
								required: true
							}
						]
					}, {
						name: "owner",
						type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
						description: "Set the new owner of the channel",
						permissions: ["vc.edit.owner"],
						options: [
							{
								name: "member",
								type: Constants.ApplicationCommandOptionTypes.USER,
								description: "The new owner of the channel",
								required: true
							}	
						]
					}
				]
			}, {
				name: "lock",
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				description: "Lock the private voice channel",
				permissions: ["vc.lock"],
			}, {
				name: "unlock",
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				description: "Unlock the private voice channel",
				permissions: ["vc.unlock"],
			}, {
				name: "information",
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				description: "Get information about the channel",
				options: [
					{
						name: "channel",
						type: Constants.ApplicationCommandOptionTypes.CHANNEL,
						description: "The channel you want information on",
						required: false
					}
				]
			}
		];
	}

	public execute = async (interaction: CommandInteraction): Promise<Message | void> => {
		//Since the voicechannel command takes a bit to load data, we'll defer the interaction.
		await interaction.defer();

		const member = interaction.member as Member,
			guild = this.bot.findGuild(interaction.guildID) as Guild,
			data: moduleData = (await this.bot.getModuleData("VC", guild) as unknown) as moduleData,
			subcommand = interaction.data.options?.[0]!! as InteractionDataOptionsSubCommandGroup;

		switch(subcommand.name) {

		case "set": {
			const suboption = subcommand.options?.[0] as InteractionDataOptionsSubCommand,
			suboptionvalue = suboption.options?.[0].value as string;

			switch (suboption.name) {

			case "name": {
				if (!member.voiceState.channelID)
					return interaction.createMessage("You need to be in a Private Voice channel to run this command!");

				const channel: VoiceChannel = this.bot.findChannel(guild, member.voiceState.channelID) as VoiceChannel,
					cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

				if (!channel || !cat)	
					return interaction.createMessage("Could not find channel.");
		
				const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);
				if (!channelObj)
					return interaction.createMessage("That Voice Channel is not a Private Voice Channel!");
				if (channelObj.owner !== member.id) return interaction.createMessage("You're not the owner of this voice channel!");
				if (!await this.bot.getModule("Main").handlePermission(member, "vc.edit.name", interaction)) return;
			
				try {
					await channel.edit({ name: suboptionvalue });
					return interaction.createMessage(`${this.constants.emojis.tick} Successfully changed the name of the channel to \`${suboptionvalue}\``);
				} catch (e) {
					return interaction.createMessage(`${this.constants.emojis.warning.red} Error trying to edit the channel name! Perhaps insufficient permissions?`);
				}
			}

			case "owner": {
				const newOwner: Member = this.bot.findMember(guild, suboptionvalue) as Member;

				if (!member.voiceState.channelID)
					return interaction.createMessage("You need to be in a Private Voice channel to run this command!");

				const channel: VoiceChannel = this.bot.findChannel(guild, member.voiceState.channelID) as VoiceChannel,
					cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

				if (!channel || !cat)	
					return interaction.createMessage("Could not find channel.");
		
				const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);
				if (!channelObj)
					return interaction.createMessage("That Voice Channel is not a Private Voice Channel!");
				if (channelObj.owner !== member.id) return interaction.createMessage("You're not the owner of this voice channel!");
				if (!await this.bot.getModule("Main").handlePermission(member, "vc.edit.owner", interaction)) return;

				if (!newOwner || !channel.voiceMembers.map((m) => m.id).includes(newOwner.id))
					return interaction.createMessage("The new owner needs to be in the voicechannel!");
						
				channelObj.owner = newOwner.id;
						
				try {
					await this.bot.updateModuleData("VC", data, guild);

					return interaction.createMessage(`${this.constants.emojis.tick} Successfully transferred ownership of Private Channel to \`${newOwner.username}\``);
				} catch (e) {
					return interaction.createMessage(`${this.constants.emojis.warning.red} Error trying to edit the channel owner!`);
				}
			}

			case "category": {
				const channel: GuildChannel = this.bot.findChannel(guild, suboptionvalue) as GuildChannel;

				if (channel.type !== 4)
					return interaction.createMessage("That channel is not a category!");

				const categories: Category[] = data.categories;

				if (categories.map((c) => c.catID).includes(channel.id))
					return interaction.createMessage("That category already exists as a Private Voice Channel Category!");
				if (!await this.bot.getModule("Main").handlePermission(member, "vc.edit.category", interaction)) return;

				const voice = await guild.createChannel(data.defaultName.category, 2, { parentID: channel.id }),
					newCat: Category = {
						catID: channel.id,
						channelID: voice.id,
						channels: []
					};

				categories.push(newCat);

				try {
					await this.bot.updateModuleData("VC", data, guild);
					await interaction.createMessage(`${this.constants.emojis.tick} Successfully made \`${channel.name}\` a Private VC category. You can manually rename \`${voice.name}\` to change the name.`);
					return interaction.createFollowup({ content: `${this.bot.constants.emojis.warning.yellow} To remove the channel, simply delete the channel.`, flags: Constants.MessageFlags.EPHEMERAL});
				} catch (e) {
					return interaction.createMessage(`${this.constants.emojis.warning.red} Error trying to add category!`);
				}
			}

			}

			break;
		}

		case "lock": {
			if (!member.voiceState.channelID)
				return interaction.createMessage("You need to be in a Private Voice channel to run this command!");

			const channel: VoiceChannel = this.bot.findChannel(guild, member.voiceState.channelID) as VoiceChannel,
				cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

			if (!channel || !cat)	
				return interaction.createMessage("Could not find channel.");

			const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);
			if (!channelObj)
				return interaction.createMessage("That Voice Channel is not a Private Voice Channel!");
			if (channelObj.owner !== member.id) return interaction.createMessage("You're not the owner of this voice channel!");
			if (!await this.bot.getModule("Main").handlePermission(member, "VC.lock", interaction)) return;
			
			if (channelObj.locked)
				return interaction.createMessage("This channel is already locked!");

			channelObj.locked = true;

			try {
				const existingOverwrites = channel.permissionOverwrites.map((p) => ({ id: p.id, type: p.type, allow: Number(p.allow.toString()), deny: Number(p.deny.toString()) }));

				for (const overwrite of existingOverwrites)
					await channel.editPermission(overwrite.id, 35652096, 1048576, overwrite.type);

				await channel.editPermission((this.bot.findRole(guild, "@everyone") as Role).id, 35652096, 1048576, Constants.PermissionOverwriteTypes.ROLE);

				await this.bot.updateModuleData("VC", data, guild);
				return interaction.createMessage({ content: `${this.bot.constants.emojis.tick} Locked channel!`, flags: Constants.MessageFlags.EPHEMERAL });
			} catch (e) {
				return interaction.createMessage(`${this.constants.emojis.warning.red} Error trying to lock channel!`);
			}
		}

		case "unlock": {
			if (!member.voiceState.channelID)
				return interaction.createMessage("You need to be in a Private Voice channel to run this command!");

			const channel: VoiceChannel = this.bot.findChannel(guild, member.voiceState.channelID) as VoiceChannel,
				cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

			if (!channel || !cat)	
				return interaction.createMessage("Could not find channel.");

			const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);
			if (!channelObj)
				return interaction.createMessage("That Voice Channel is not a Private Voice Channel!");
			if (channelObj.owner !== member.id) return interaction.createMessage("You're not the owner of this voice channel!");
			if (!await this.bot.getModule("Main").handlePermission(member, "vc.lock", interaction)) return;

			channelObj.locked = false;

			try {
				for (const overwrite of channelObj.parentOverwrites)
					await channel.editPermission(overwrite.id, overwrite.allow, overwrite.deny, overwrite.type);

				await channel.editPermission((this.bot.findRole(guild, "@everyone") as Role).id, 0, 0, Constants.PermissionOverwriteTypes.ROLE);

				await this.bot.updateModuleData("VC", data, guild);
				return interaction.createMessage({ content: `${this.bot.constants.emojis.tick} Unlocked channel!`, flags: Constants.MessageFlags.EPHEMERAL });
			} catch (e) {
				return interaction.createMessage(`${this.constants.emojis.warning.red} Error trying to unlock channel!`);
			}
		}

		case "information": {
			const selectedChannel = subcommand.options
				? (subcommand.options?.[0] as InteractionDataOptionsSubCommand).value as string
				: member.voiceState.channelID ?? undefined;

			if (!selectedChannel)
				return interaction.createMessage("Specify or join a private voice channel to the information of a channel!");
			
			const status = {
					locked: ":lock: Locked",
					unlocked: ":unlock: Unlocked"
				},	
				channel: GuildChannel | undefined = this.bot.findChannel(guild, selectedChannel);

			if (!channel)
				return interaction.createMessage("Not a valid channel!");

			const cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

			if (!cat)
				return interaction.createMessage("That's not a Private Voice Channel!");

			const channelObj: Channel | undefined = cat.channels.find((c) => c.channelID === channel.id);
				
			if (!channelObj)
				return interaction.createMessage("That's not a Private Voice Channel!");
				
			const owner: Member | undefined = this.bot.findMember(guild, channelObj.owner),
				embed: Embed = {
					title: channel.name,
					fields: [
						{
							name: "Owner",
							value: owner ? owner.mention : "Error! Could not find VC Owner"
						}, {
							name: "Status",
							value: status[channelObj.locked ? "locked" : "unlocked"]
						}, {
							name: "Time Elapsed",
							value: this.bot.constants.utils.HMS(Date.now() - channelObj.createdAt)
						}
					],
					color: this.bot.constants.config.colors.default,
					type: "rich"
				};

			return interaction.createMessage({ embeds: [embed] });
		}

		}

	}
}