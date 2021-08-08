import { Embed, Emoji, Guild, Member, Message, Role, TextChannel } from "eris";
import ApplicationCommandManager from "../../../../Base/Application/ApplicationCommandManager";
import ComponentManager from "../../../../Base/Application/ComponentManger";
import FollowupManager from "../../../../Base/Application/FollowupManager";
import { ApplicationCommandOption, ApplicationComponents, SelectOptionStructure } from "../../../../Base/Application/types";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { moduleData, RolesMessage } from "../../main";

interface interactionData {
	id: string,
	channelID: string,
	reactionRoles: {
		role: string;
		emote: Partial<Emoji>;	
	}[],
	partial: Partial<
	{
		role: string;
		emote: Partial<Emoji>;
	}>
}

export default class Reactionrole extends Command {

	constructor(bot: Bot) {

		super(bot);

		this.commands = ["reactionrole"];
		this.description = "Create/edit reactionroles";
		this.example = "reactionrole create 867761105245831188";
		this.options = [
			{
				type: 1,
				name: "create",
				description: "Create reaction role messages",
				permissions: ["roles.reaction.create"],
				options: [
					{
						type: 3,
						name: "messageid",
						description: "The ID of the message",
						required: true
					}
				]
			}, {
				type: 1,
				name: "edit",
				description: "Edit reaction role messages",
				permissions: ["roles.reaction.edit"],
				options: [
					{
						type: 3,
						name: "messageid",
						description: "The ID of the message",
						required: true
					}
				]
			}
		];

	}

	private roles = async (interaction: ApplicationCommandManager): Promise<Role[]> => {

		const	data = interaction.data as interactionData,
			guild: Guild = interaction.guild as Guild,
			member: Member = interaction.member as Member,
			botMember: Member = this.bot.findMember(guild, this.bot.user.id) as Member,
			botHighestRoleID = botMember.roles
				.map((r) => 
					({
						name: (this.bot.findRole(guild, r) as Role).name,
						position: (this.bot.findRole(guild, r) as Role).position
					}))
				.sort((a, b) => b.position - a.position).map((r) => r.name),
			botHighestRole: Role = this.bot.findRole(guild, botHighestRoleID[0]) as Role,
			memberHighestRoleID = member.roles.length
				? member.roles
					.map((r) => 
						({
							name: (this.bot.findRole(guild, r) as Role).name,
							position: (this.bot.findRole(guild, r) as Role).position
						}))
					.sort((a, b) => b.position - a.position).map((r) => r.name)
				: guild.id,
			memberHighestRole: Role = this.bot.findRole(guild, memberHighestRoleID[0]) as Role;

		const roles: Role[] = [];

		for (const r of guild.roles.map((r) => r.id )) {
			const role: Role = this.bot.findRole(guild, r) as Role;
	
			if (!role) continue;
	
			if (data) {
				if (data.reactionRoles.find((rr) => rr.role === r)) continue;
			}
			if (role.position >= botHighestRole.position) continue;
			if (member.roles.length && role.position > memberHighestRole.position && !member.permissions.has("administrator")) continue;
			if (role.id === guild.id) continue;
			if (role.managed) continue;
	
			roles.push(role);
		}
	
		return [...new Set(roles)];
	}

	private components = async (interaction: ApplicationCommandManager):
	Promise<
		{
			home: ApplicationComponents[];
			addSelectRole: ApplicationComponents[];
			addSelectReaction: ApplicationComponents[];
			removeSelectRole: ApplicationComponents[];
		}
	> => {
		const interactionData: interactionData = interaction.data as interactionData,
			emotes: Partial<Emoji>[] = Object.values(this.bot.constants.emojis.numbers)
				.map((e) => this.bot.constants.utils.resolveEmoji(e))
				.filter((e: Partial<Emoji>) => !interactionData.reactionRoles.find((r) => r.emote.id === e.id));

		return {
			home: [
				{
					type: 1,
					components: [
						{
							type: 2,
							style: 1,
							label: "Add Role",
							disabled: interactionData.reactionRoles.length > 10 || !(await this.roles(interaction)).length,
							custom_id: "reactionrole_add_selectrole"
						}, {
							type: 2,
							style: 1,
							label: "Remove Role",
							disabled: interactionData.reactionRoles.length < 1,
							custom_id: "reactionrole_remove_selectrole"
						}, {
							type: 2,
							style: 3,
							label: "Done",
							disabled: interactionData.reactionRoles.length < 1,
							custom_id: "reactionrole_save"
						}, {
							type: 2,
							style: 4,
							label: "Cancel",
							custom_id: "reactionrole_cancel"
						}
					]
				}
			],
			addSelectRole: [
				{
					type: 1,
					components: [
						{
							type: 3,
							placeholder: "Choose role",
							custom_id: "reactionrole_add_selectreaction",
							max_values: 1,
							min_values: 1,
							options: (await this.roles(interaction)).map((r) => ({ label: r.name, value: r.id }))
						}
					]
				}, {
					type: 1,
					components: [
						{
							type: 2,
							style: 2,
							label: "Back",
							custom_id: "reactionrole_home"
						}, {
							type: 2,
							style: 4,
							label: "Cancel",
							custom_id: "reactionrole_cancel"
						}
					]
				}
			],
			addSelectReaction: [
				{
					type: 1,
					components: [
						{
							type: 3,
							placeholder: "Choose Emote",
							custom_id: "reactionrole_add",
							max_values: 1,
							min_values: 1,
							options: emotes.map((e) => ({ label: e.name, value: e.id, emoji: e })) as SelectOptionStructure[]
						}
					]
				}, {
					type: 1,
					components: [
						{
							type: 2,
							style: 2,
							label: "Back",
							custom_id: "reactionrole_home"
						}, {
							type: 2,
							style: 4,
							label: "Cancel",
							custom_id: "reactionrole_cancel"
						}
					]
				}
			],
			removeSelectRole: [
				{
					type: 1,
					components: [
						{
							type: 3,
							placeholder: "Choose role",
							custom_id: "reactionrole_remove",
							max_values: 1,
							min_values: 1,
							options: (await this.roles(interaction)).map((r) => ({ label: r.name, value: r.id }))
						}
					]
				}, {
					type: 1,
					components: [
						{
							type: 2,
							style: 2,
							label: "Back",
							custom_id: "reactionrole_home"
						}, {
							type: 2,
							style: 4,
							label: "Cancel",
							custom_id: "reactionrole_cancel"
						}
					]
				}
			]
		};
	}

	private create(interaction: ApplicationCommandManager, msg: Message): Embed {
		const interactionData: interactionData = interaction.data as interactionData,
			embed: Embed = {
				type: "rich",
				title: "Reaction Role Editor",
				color: this.bot.constants.config.colors.default,
				description: msg.content,
				fields: [
					{
						name: "Reaction Roles",
						value: interactionData.reactionRoles.length
							? interactionData.reactionRoles.map((r) => `${this.bot.constants.utils.parseEmoji(r.emote)} - ${(this.bot.findRole(interaction.guild as Guild, r.role) as Role).mention}`).join("\n")
							:	"No Reaction Roles"
					}
				],
				footer: {
					text: msg.id
				}
			};

		return embed;
	}

	readonly execute = async (interaction: ApplicationCommandManager): Promise<ApplicationCommandManager | FollowupManager | undefined> => {
		await interaction.defer();

		const guild: Guild = interaction.guild as Guild,
			channel: TextChannel = interaction.channel as TextChannel,
			data: moduleData = await this.bot.getModuleData("Roles", guild) as moduleData,
			subcommand: ApplicationCommandOption = (interaction.options as ApplicationCommandOption[])[0] as ApplicationCommandOption,
			subcommandvalue: string = (subcommand.options as ApplicationCommandOption[])[0].value as string;

		switch (subcommand.name) {

		case "create": {
			let message: Message | undefined;

			try {
				message = await this.bot.getMessage(channel.id, subcommandvalue);
			} catch (e) {
				return interaction.deny("I could not find a message with that ID.");
			}

			if (!message)
				return interaction.deny("I could not find a message with that ID.");

			interaction.data = {
				id: message.id,
				channelID: message.channel.id,
				reactionRoles: [],
				partial: {
					role: "",
					emote: ""
				}
			};

			const msgData: RolesMessage | undefined = data.messages.find((m) => m.id === (message as Message).id);

			if (msgData)
				return interaction.reply(
					{
						content: `${this.bot.constants.emojis.warning.yellow} There's already Reaction Roles for that message! Would you like to edit it?`,
						components: [
							{
								type: 1,
								components: [
									{
										type: 2,
										style: 3,
										label: "Yes",
										custom_id: "reactionrole_edit"
									}, {
										type: 2,
										style: 4,
										label: "No",
										custom_id: "reactionrole_cancel"
									}
								]
							}
						]
					}
				);

			return interaction.reply(
				{
					embeds: [this.create(interaction, message)],
					components: (await this.components(interaction)).home
				}
			);
		}

		case "edit": {
			let message: Message | undefined;

			try {
				message = await this.bot.getMessage(channel.id, subcommandvalue);
			} catch (e) {
				return interaction.deny("I could not find a message with that ID.");
			}

			if (!message)
				return interaction.deny("I could not find a message with that ID.");

			const msgData: RolesMessage | undefined = data.messages.find((m) => m.id === (message as Message).id);

			if (!msgData)
				return interaction.reply(
					{
						content: `${this.bot.constants.emojis.warning.yellow} There's no Reaction Roles for that message! Would you like to create one?`,
						components: [
							{
								type: 1,
								components: [
									{
										type: 2,
										style: 3,
										label: "Yes",
										custom_id: "reactionrole_create"
									}, {
										type: 2,
										style: 4,
										label: "No",
										custom_id: "reactionrole_cancel"
									}
								]
							}
						]
					}
				);

			interaction.data = {
				id: msgData.id,
				channelID: msgData.channelID,
				reactionRoles: msgData.roles,
				partial: {}
			};

			return interaction.reply(
				{
					embeds: [this.create(interaction, message)],
					components: (await this.components(interaction)).home
				}
			);
		}
		
		}

	}

	readonly update = async (component: ComponentManager): Promise<ApplicationCommandManager | FollowupManager | undefined> => {

		const interaction = component.root,
			interactionData: interactionData = interaction.data as interactionData,
			guild: Guild = interaction.guild as Guild,
			data: moduleData = await this.bot.getModuleData("Roles", guild) as moduleData;

		switch (component.name) {

		case "reactionrole_add_selectrole": {
			component.ack();

			return interaction.reply(
				{
					components: (await this.components(interaction)).addSelectRole
				}
			);
		}

		case "reactionrole_add_selectreaction": {
			await interaction.defer();

			interactionData.partial.role = component.values[0];

			component.ack();
			return interaction.reply(
				{
					components: (await this.components(interaction)).addSelectReaction
				}
			);
		}

		case "reactionrole_add": {
			await interaction.defer();

			const emojiGuild = this.bot.findGuild("868329965991657483") as Guild;

			const emote = emojiGuild.emojis.find((r) => r.id === component.values[0]);

			interactionData.partial.emote = emote;

			let message: Message | undefined;

			try {
				message = await this.bot.getMessage(interactionData.channelID, interactionData.id);
			} catch (e) {
				return interaction.deny("Could not find message");
			}

			if (!message)
				return interaction.deny("Could not find message");

			interactionData.reactionRoles.push(interactionData.partial as { role: string; emote: Partial<Emoji>; });

			interactionData.partial = {};

			const embed = this.create(interaction, message);

			await component.ack();
			return await interaction.edit(
				{
					content: null,
					embeds: [embed],
					components: (await this.components(interaction)).home
				}
			);
		}

		case "reactionrole_remove_selectrole": {
			component.ack();

			return interaction.reply(
				{
					components: (await this.components(interaction)).removeSelectRole
				}
			);
		}

		case "reactionrole_remove": {
			await interaction.defer();

			const emote = guild.emojis.find((r) => r.id === component.values[0]);

			interactionData.partial.emote = emote;

			let message: Message | undefined;

			try {
				message = await this.bot.getMessage(interactionData.channelID, interactionData.id);
			} catch (e) {
				return interaction.deny("Could not find message");
			}

			if (!message)
				return interaction.deny("Could not find message");

			const i = interactionData.reactionRoles.findIndex((r) => r.role === interactionData.partial.role);
			if (i > -1) interactionData.reactionRoles.splice(i, 0);

			interactionData.partial = {};

			const embed = this.create(interaction, message);

			await component.ack();
			return await interaction.edit(
				{
					content: null,
					embeds: [embed],
					components: (await this.components(interaction)).home
				}
			);
		}

		case "reactionrole_home": {
			await interaction.defer();

			let message: Message | undefined;

			try {
				message = await this.bot.getMessage(interactionData.channelID, interactionData.id);
			} catch (e) {
				return interaction.deny("Could not find message");
			}

			if (!message)
				return interaction.deny("Could not find message");

			interactionData.partial = {};

			const embed = this.create(interaction, message);

			await component.ack();
			return await interaction.edit(
				{
					content: null,
					embeds: [embed],
					components: (await this.components(interaction)).home
				}
			);
		}

		case "reactionrole_save": {
			await interaction.defer();

			const obj: RolesMessage = {
				id: interactionData.id,
				channelID: interactionData.channelID,
				roles: interactionData.reactionRoles
			};

			data.messages.push(obj);

			try {
				await this.bot.updateModuleData("Roles", data, guild);

				const message: Message | undefined = await this.bot.getMessage(interactionData.channelID, interactionData.id),
					reactions = obj.roles.map((r) => r.emote);

				await message.removeReactions();

				for (const reaction of reactions) {
					if (!reaction.id || !reaction.name) continue;

					const emote: string = this.bot.constants.utils.parseEmoji(reaction).replace("<", "").replace(">", "");

					await message.addReaction(emote);
				}
				
				await component.ack();
				return await interaction.edit(
					{
						content: `${this.bot.constants.emojis.tick} Successfully edited Reactions Roles for Message: \`${interactionData.id}\``,
						embeds: [],
						components: []
					}
				);
			} catch (e) {
				console.error(e);
				await component.ack();
				return interaction.deny("There was an error while editing this");
			}
		}

		case "reactionrole_create": {
			await component.ack();

			interaction.options = [
				{
					type: 1,
					name: "create",
					options: [
						{
							type: 3,
							name: "messageid",
							value: ((interaction.options as ApplicationCommandOption[])[0].options as ApplicationCommandOption[])[0].value
						}
					]
				}
			];

			return await this.execute(interaction);
		}

		case "reactionrole_edit": {
			await component.ack();

			interaction.options = [
				{
					type: 1,
					name: "edit",
					options: [
						{
							type: 3,
							name: "messageid",
							value: ((interaction.options as ApplicationCommandOption[])[0].options as ApplicationCommandOption[])[0].value
						}
					]
				}
			];

			return await this.execute(interaction);
		}

		case "reactionrole_cancel": {
			await component.ack();

			return interaction.edit(
				{
					content: `${this.bot.constants.emojis.x} Cancelled.`,
					embeds: [],
					components: []
				}
			);
		}

		}

	}
}