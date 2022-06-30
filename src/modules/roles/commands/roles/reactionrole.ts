import { ActionRow, CommandInteraction, ComponentInteraction, Constants, Embed, Emoji, Guild, InteractionComponentSelectMenuData, InteractionDataOptionsSubCommand, Member, Message, Role, SelectMenuOptions, TextChannel } from "eris";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import { upsertCustomData, getCustomData } from "../../../main/internals/CustomDataHandler";
import { moduleData, RolesMessage } from "../../main";

interface CustomDataStructure {
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
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				name: "modify",
				description: "Create/Edit reaction role messages",
				permissions: ["roles.reaction.modify"],
				options: [
					{
						type: Constants.ApplicationCommandOptionTypes.STRING,
						name: "messageid",
						description: "The ID of the message",
						required: true
					}
				]
			}
		];

	}

	private roles = async (bot: Bot, interaction: (CommandInteraction | ComponentInteraction)): Promise<Role[]> => {

		const customData = await getCustomData(bot, interaction instanceof CommandInteraction ? interaction.id : interaction.message.interaction?.id!!)?.data!! as CustomDataStructure,
			guild = bot.findGuild(interaction.guildID!!) as Guild,
			member = interaction.member as Member,
			botMember = this.bot.findMember(guild, this.bot.user.id) as Member,
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
	
			if (customData) {
				if (customData.reactionRoles.find((rr) => rr.role === r)) continue;
			}
			if (role.position >= botHighestRole.position) continue;
			if (member.roles.length && role.position > memberHighestRole.position && !member.permissions.has("administrator")) continue;
			if (role.id === guild.id) continue;
			if (role.managed) continue;
	
			roles.push(role);
		}
	
		return [...new Set(roles)];
	}

	private components = async (bot: Bot, interaction: (CommandInteraction | ComponentInteraction)):
	Promise<
		{
			home: ActionRow[];
			exit: ActionRow[];
			addSelectRole: ActionRow[];
			addSelectReaction: ActionRow[];
			removeSelectRole: ActionRow[];
		}
	> => {
		const customData = await getCustomData(bot, interaction instanceof CommandInteraction ? interaction.id : interaction.message.interaction?.id!!)?.data!! as CustomDataStructure,
			guild = bot.findGuild(interaction.guildID!!) as Guild,
			emotes: Partial<Emoji>[] = Object.values(this.bot.constants.emojis.numbers)
				.map((e) => this.bot.constants.utils.resolveEmoji(e))
				.filter((e: Partial<Emoji>) => !customData.reactionRoles.find((r) => r.emote.id === e.id));

		return {
			home: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.PRIMARY,
							label: "Add Role",
							disabled: customData.reactionRoles.length > 10 || !(await this.roles(bot, interaction)).length,
							custom_id: `reactionrole_${interaction.member?.id}_addselectrole`
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.SECONDARY,
							label: "Remove Role",
							disabled: customData.reactionRoles.length < 1,
							custom_id: `reactionrole_${interaction.member?.id}_removeselectrole`
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.SUCCESS,
							label: "Done",
							disabled: customData.reactionRoles.length < 1,
							custom_id: `reactionrole_${interaction.member?.id}_save`
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.DANGER,
							label: "Cancel",
							custom_id: `reactionrole_${interaction.member?.id}_cancel`
						}
					]
				}
			],
			exit: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.PRIMARY,
							label: "Back",
							custom_id: `reactionrole_${interaction.member?.id}_home`
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.DANGER,
							label: "Cancel",
							custom_id: `reactionrole_${interaction.member?.id}_cancel`
						}
					]
				}
			],
			addSelectRole: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.SELECT_MENU,
							placeholder: "Choose role",
							custom_id: `reactionrole_${interaction.member?.id}_addselectreaction`,
							max_values: 1,
							min_values: 1,
							options: (await this.roles(bot, interaction)).map((r) => ({ label: r.name, value: r.id }))
						}
					]
				},
				(await this.components(bot, interaction)).exit[0]
			],
			addSelectReaction: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.SELECT_MENU,
							placeholder: "Choose Emote",
							custom_id: `reactionrole_${interaction.member?.id}_add`,
							max_values: 1,
							min_values: 1,
							options: emotes.map((e) => ({ label: e.name, value: e.id, emoji: e })) as SelectMenuOptions[]
						}
					]
				}, {
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.PRIMARY,
							label: "Back",
							custom_id: `reactionrole_${interaction.member?.id}_home`
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.DANGER,
							label: "Cancel",
							custom_id: `reactionrole_${interaction.member?.id}_cancel`
						}
					]
				}
			],
			removeSelectRole: [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.SELECT_MENU,
							placeholder: "Choose role",
							custom_id: `reactionrole_${interaction.member?.id}_remove`,
							max_values: 1,
							min_values: 1,
							options: customData.reactionRoles.map((r) => ({ label: bot.findRole(guild, r.role)!!.name, value: r.role, }))
						}
					]
				}, {
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.PRIMARY,
							label: "Back",
							custom_id: `reactionrole_${interaction.member?.id}_home`
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.DANGER,
							label: "Cancel",
							custom_id: `reactionrole_${interaction.member?.id}_cancel`
						}
					]
				}
			]
		};
	}

	private create(bot: Bot, interaction: (CommandInteraction | ComponentInteraction), msg: Message): Embed {
		const customData = getCustomData(bot, interaction instanceof CommandInteraction ? interaction.id : interaction.message.interaction?.id!!)?.data!! as CustomDataStructure,
			guild = bot.findGuild(interaction.guildID) as Guild,
			embed = {
				type: "rich",
				title: "Reaction Role Editor",
				color: this.bot.constants.config.colors.default,
				description: msg.content,
				fields: [
					{
						name: "Reaction Roles",
						value: customData.reactionRoles.length
							? customData.reactionRoles.map((r) => `${this.bot.constants.utils.parseEmoji(r.emote)} - ${(this.bot.findRole(guild, r.role) as Role).mention}`).join("\n")
							:	"No Reaction Roles"
					}
				],
				footer: {
					text: msg.id
				}
			};

		return embed;
	}

	readonly execute = async (interaction: (CommandInteraction)): Promise<Message | void> => {
		await interaction.defer();

		const guild = this.bot.findGuild(interaction.guildID!!) as Guild,
			channel = interaction.channel as TextChannel,
			data = await this.bot.getModuleData("Roles", guild) as moduleData,
			subcommand = interaction.data.options?.[0]!! as InteractionDataOptionsSubCommand,
			subcommandvalue = subcommand.options?.[0].value!! as string;

		switch (subcommand.name) {

		case "modify": {
			let message: Message | undefined;

			try {
				message = await this.bot.getMessage(channel.id, subcommandvalue);
			} catch (e) {
				return interaction.createMessage("I could not find a message with that ID.");
			}

			if (!message)
				return interaction.createMessage("I could not find a message with that ID.");

			const msgData: RolesMessage | undefined = data.messages.find((m) => m.id === (message as Message).id);

			upsertCustomData(this.bot, interaction, {
				id: message.id,
				channelID: message.channel.id,
				reactionRoles: msgData?.roles ?? [],
				partial: {
					role: "",
					emote: ""
				}
			})

			return interaction.createMessage(
				{
					embeds: [this.create(this.bot, interaction, message)],
					components: (await this.components(this.bot, interaction)).home
				}
			);
		}
		
		}

	}

	readonly update = async (component: ComponentInteraction): Promise<Message | void> => {

		const guild = this.bot.findGuild(component.guildID!!) as Guild,
			customData = await getCustomData(this.bot, component.message.interaction?.id!!)?.data!! as CustomDataStructure,
			moduleData = await this.bot.getModuleData("Roles", guild) as moduleData;

		switch (component.data.custom_id.split("_")[2]) {

		case "addselectrole": {

			return component.editParent(
				{
					components: (await this.components(this.bot, component)).addSelectRole
				}
			);
		}

		case "removeselectrole": {

			return await component.editParent(
				{
					components: (await this.components(this.bot, component)).removeSelectRole
				}
			);
		}

		case "addselectreaction": {
			await component.deferUpdate();

			customData.partial.role = (component.data as InteractionComponentSelectMenuData).values[0];

			return component.editParent(
				{
					components: (await this.components(this.bot, component)).addSelectReaction
				}
			);
		}

		case "add": {
			await component.deferUpdate();

			const emojiGuild = this.bot.findGuild("868329965991657483") as Guild,
				emote = emojiGuild.emojis.find((r) => r.id === (component.data as InteractionComponentSelectMenuData).values[0]);

			customData.partial.emote = emote;

			let message: Message | undefined;

			try {
				message = await this.bot.getMessage(customData.channelID, customData.id);
			} catch (e) {
				return component.editParent({ content: "I could not find that message." });
			}

			if (!message)
				return component.editParent({ content: "I could not find that message." });

			customData.reactionRoles.push(customData.partial as { role: string; emote: Partial<Emoji>; });

			customData.partial = {};

			const embed = this.create(this.bot, component, message);

			return await component.editParent(
				{
					content: undefined,
					embeds: [embed],
					components: (await this.components(this.bot, component)).home
				}
			);
		}

		case "remove": {
			await component.deferUpdate();

			const emote = guild.emojis.find((r) => r.id === (component.data as InteractionComponentSelectMenuData).values[0]);

			customData.partial.emote = emote;

			let message: Message | undefined;

			try {
				message = await this.bot.getMessage(customData.channelID, customData.id);
			} catch (e) {
				return component.editParent({ content: "I could not find that message." });
			}

			if (!message)
				return component.editParent({ content: "I could not find that message." });

			customData.reactionRoles.splice(customData.reactionRoles.findIndex((r) => r.role === customData.partial.role), 1);

			customData.partial = {};

			const embed = this.create(this.bot, component, message);

			return await component.editParent(
				{
					content: undefined,
					embeds: [embed],
					components: (await this.components(this.bot, component)).home
				}
			);
		}

		case "home": {
			let message: Message | undefined;

			try {
				message = await this.bot.getMessage(customData.channelID, customData.id);
			} catch (e) {
				return component.editParent({ content: "I could not find that message." });
			}

			if (!message)
				return component.editParent({ content: "I could not find that message." });

			customData.partial = {};

			return await component.editParent(
				{
					content: undefined,
					embeds: [this.create(this.bot, component, message)],
					components: (await this.components(this.bot, component)).home
				}
			);
		}

		case "save": {
			await component.deferUpdate();

			const obj: RolesMessage = {
				id: customData.id,
				channelID: customData.channelID,
				roles: customData.reactionRoles
			};

			//if data found, delete existing data
			if (moduleData.messages.find((m) => m.id === customData.id))
				moduleData.messages.splice(moduleData.messages.findIndex((m) => m.id === customData.id), 1);

			moduleData.messages.push(obj);

			try {
				await component.editParent(
					{
						content: `${this.bot.constants.emojis.tick} Message is being constructed...`,
						embeds: [],
						components: []
					}
				);
				await this.bot.updateModuleData("Roles", moduleData, guild);

				const message: Message | undefined = await this.bot.getMessage(customData.channelID, customData.id),
					reactions = obj.roles.map((r) => r.emote);

				await message.removeReactions();

				for (const reaction of reactions) {
					if (!reaction.id || !reaction.name) continue;

					const emote: string = this.bot.constants.utils.parseEmoji(reaction).replace("<", "").replace(">", "");

					await message.addReaction(emote);
				}
				return await component.editParent(
					{
						content: `${this.bot.constants.emojis.tick} Successfully edited Reactions Roles for Message: \`${customData.id}\``,
						embeds: [],
						components: []
					}
				);
			} catch (e) {
				component.editParent({ content: "There was an error while editing." });
				throw new Error(e as string);
			}
		}

		case "cancel": {
			return component.editParent(
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