import { CommandInteraction, ComponentInteraction, Constants, Embed, EmbedField, Message, MessageActionRow, MessageComponentSelectMenuInteractionData } from "oceanic.js";
import Command from "../../../../Base/Command";
import Module from "../../../../Base/Module";
import ExtendedClient from "../../../../Base/Client";
import { Permnodes } from "../../../../resources/interfaces";

export default class Help extends Command {
	
	constructor(bot: ExtendedClient) {

		super(bot);

		this.commands = ["help"];
		this.description = "View information about the bot";
		this.example = "help";
		this.permissions = ["main.help"];

	}

	readonly execute = async (interaction: CommandInteraction): Promise<Message | void> => {
		const embed: Embed = {
			type: "rich",
			author: {
				name: this.bot.user.username,
				iconURL: this.bot.user.avatarURL()
			},
			color: this.bot.constants.config.colors.default,
			description: "🌴 *A Multi-Purpose Bot made by a community, for a community.* 🌴\n\n**OLIVE** is a multi-purpose bot that includes a variety of modules to help your community thrive! Get start by viewing a list of commands by clicking on the button below!"
		},
			components: MessageActionRow[] = [
				{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.LINK,
							url: "https://discord.gg/DEhvVXdVvv",
							label: "Support Server"			
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.LINK,
							url: "https://discord.gg/DEhvVXdVvv",
							label: "Website"			
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.LINK,
							url: "https://discord.gg/DEhvVXdVvv",
							label: "Donate"			
						}, {
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.LINK,
							url: this.bot.constants.config.invite,
							label: "Invite"			
						}
					]
				}, {
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [
						{
							type: Constants.ComponentTypes.BUTTON,
							style: Constants.ButtonStyles.PRIMARY,
							label: "View Commands",
							customID: `help_${interaction.member?.id}_commandembed`,
						}
					]
				}
			];

		if (await this.bot.getModule("Main").hasPerm(interaction.member, "main.permnode.view"))
			if (components[1].components)
				components[1].components.push(
					{
						type: Constants.ComponentTypes.BUTTON,
						style: Constants.ButtonStyles.PRIMARY,
						label: "View Permissions",
						customID: `help_${interaction.member?.id}_permissionembed`,
					}
				);

		return await interaction.createMessage(
			{
				embeds: [embed],
				components
			}
		);
	}

	readonly update = async (component: ComponentInteraction): Promise<Message | void> => {

		switch (component.data.customID.split("_")[1]) {

		case "commandembed": {
			await component.deferUpdate();

			const commands: Command[] = this.bot.commands.filter((c) => !c.devOnly);

			const fields: EmbedField[] = [];

			for (const command of commands) {
				const field = fields.find((f) => f.name === command.category);
				if (field)
					fields[fields.indexOf(field)].value += `, \`${command.commands[0]}\``;
				else {
					fields[fields.length] = {
						name: command.category,
						value: `\`${command.commands[0]}\``,
						inline: false
					};
				}
			}

			fields.sort((a, b) => {
				if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
				else if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
				return 0;
			});

			const desc = `You can view more help/information on a command using \`${this.bot.constants.config.prefix}help <command>\`.`;

			const embed: Embed = {
				title: "List of commands",
				color: this.bot.constants.config.colors.default,
				description: desc,
				fields,
				footer: {
					text: `${commands.length.toString()} Commands | ${fields.length.toString()} Categories`
				},
				type: "rich"
			};

			return await component.editParent(
				{
					content: undefined,
					embeds: [embed],
					components: [
						{
							type: Constants.ComponentTypes.ACTION_ROW,
							components: [
								{
									type: Constants.ComponentTypes.STRING_SELECT,
									customID: `help_${component.member?.id}_commandmenu`,
									placeholder: "Choose a command",
									minValues: 1,
									maxValues: 1,
									options: commands.map((c) => ({ label: c.commands[0].replace(/^\w/, c => c.toUpperCase()), value: c.commands[0], description: c.description }))
								}
							]
						}, {
							type: Constants.ComponentTypes.ACTION_ROW,
							components: [
								{
									type: Constants.ComponentTypes.BUTTON,
									style: Constants.ButtonStyles.PRIMARY,
									label: "Permissions List",
									customID: `help_${component.member?.id}_permissionembed`
								}, {
									type: Constants.ComponentTypes.BUTTON,
									style: Constants.ButtonStyles.PRIMARY,
									label: "Back to Main Menu",
									customID: `help_${component.member?.id}_home`
								}
							]
						}
					]
				}
			);
		}

		case "permissionembed": {
			await component.deferUpdate();
			
			const fields: EmbedField[] = [];

			fields.push({ name: "Administrator", value: "`*` (All Permissions)", inline: false });

			for (const perm of this.bot.perms) {
				if (perm.name === "*") continue;

				const Module: string = this.bot.modules.find((m: Module) => m.name.toLowerCase() === perm.name.split(/[.\-_]/)[0].toLowerCase())
					? this.bot.modules.find((m: Module) => m.name.toLowerCase() === perm.name.split(/[.\-_]/)[0].toLowerCase()).name
					: perm.name.split(/[.\-_]/)[0].replace(/^\w/, c => c.toUpperCase()),
					field: EmbedField | undefined = fields.find((f) => f.name === Module);

				if (field)
					field.value += perm.default ? `, *\`${perm.name}\`*` : `, \`${perm.name}\``;
				else {
					fields[fields.length] = {
						name: Module,
						value: `\`${perm.name}\``,
						inline: false
					};
				}
			}

			const embed: Embed = {
				title: "Permission Nodes",
				description: `This is a list of all available permission nodes.\nYou can view more help/information on a permission using \`${this.bot.constants.config.prefix}help <permission>\`.\n\n*\`permission\`* = Available to all users by default.`,
				fields,
				color: this.bot.constants.config.colors.default,
				footer: {
					text: `${this.bot.perms.length} Permissions | ${fields.length} Categories`
				},
				type: "rich"
			};

			return await component.editParent(
				{
					embeds: [embed],
					components: [
						{
							type: Constants.ComponentTypes.ACTION_ROW,
							components: [
								{
									type: Constants.ComponentTypes.STRING_SELECT,
									customID: `help_${component.member?.id}_modulecomponent`,
									placeholder: "Choose a module",
									minValues: 1,
									maxValues: 1,
									options: this.bot.modules.map((m: Module) => ({ label: m.name, value: m.name }))
								}
							]
						}, {
							type: Constants.ComponentTypes.ACTION_ROW,
							components: [
								{
									type: Constants.ComponentTypes.BUTTON,
									style: Constants.ButtonStyles.PRIMARY,
									label: "Permissions List",
									customID: `help_${component.member?.id}_permissionembed`
								}, {
									type: Constants.ComponentTypes.BUTTON,
									style: Constants.ButtonStyles.PRIMARY,
									label: "Back to Main Menu",
									customID: `help_${component.member?.id}_home`
								}
							]
						}
					]
				}
			);
		}

		case "commandmenu": {
			await component.deferUpdate();

			const command = this.bot.commands.find((c) => c.commands[0] === (component.data as MessageComponentSelectMenuInteractionData).values.getStrings()[0]);

			if (!command)
				return component.createMessage({content: "Could not find the command!"});

			const helpEmbed = await this.bot.getModule("Main").createHelpEmbed(command);

			return await component.editParent(
				{
					embeds: [helpEmbed.embed],
					components: [
						{
							type: Constants.ComponentTypes.ACTION_ROW,
							components: [
								{
									type: Constants.ComponentTypes.BUTTON,
									style: Constants.ButtonStyles.PRIMARY,
									label: "Back to help",
									customID: `help_${component.member?.id}_home`,
								}
							]
						}
					]
				}
			);
		}

		case "modulecomponent": {
			await component.deferUpdate();

			const moduleName = (component.data as MessageComponentSelectMenuInteractionData).values.getStrings()[0],
				perms = this.bot.perms.filter((p) => p.name.split(/[.\-_]/)[0].toLowerCase() === moduleName.toLowerCase());

			return await component.editParent(
				{
					components: [
						{
							type: Constants.ComponentTypes.ACTION_ROW,
							components: [
								{
									type: Constants.ComponentTypes.STRING_SELECT,
									customID: `help_${component.member?.id}_permissionmenu`,
									placeholder: "Choose a permission",
									minValues: 1,
									maxValues: 1,
									options: perms.map((p) => ({ label: p.name, value: p.name }))
								}
							]
						}, {
							type: Constants.ComponentTypes.ACTION_ROW,
							components: [
								{
									type: Constants.ComponentTypes.BUTTON,
									style: Constants.ButtonStyles.PRIMARY,
									label: "Permissions List",
									customID: `help_${component.member?.id}_permissionembed`
								}, {
									type: Constants.ComponentTypes.BUTTON,
									style: Constants.ButtonStyles.PRIMARY,
									label: "Back to Main Menu",
									customID: `help_${component.member?.id}_home`
								}
							]
						}
					]
				}
			);
		}

		case "permissionmenu": {
			await component.deferUpdate();

			const permnode: Permnodes = this.bot.perms.find((p) => p.name === ((component.data as MessageComponentSelectMenuInteractionData).values.getStrings()[0])) as Permnodes;

			const embed: Embed = {
				title: permnode.name,
				description: `**${permnode.description}**${permnode.default ? " (Default)" : ""}`,
				color: this.bot.constants.config.colors.default,
				type: "rich"
			};

			return await component.editParent(
				{
					embeds: [embed],
					components: [
						{
							type: Constants.ComponentTypes.ACTION_ROW,
							components: [
								{
									type: Constants.ComponentTypes.BUTTON,
									style: Constants.ButtonStyles.PRIMARY,
									label: "Back to help",
									customID: `help_${component.member?.id}_home`,
								}
							]
						}
					]
				}
			);
		}

		case "home": {
			return await this.execute((component as unknown) as CommandInteraction);
		}

		}

	}

}