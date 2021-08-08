import { Embed, EmbedField } from "eris";
import ApplicationCommandManager from "../../../../Base/Application/ApplicationCommandManager";
import ComponentManager from "../../../../Base/Application/ComponentManger";
import FollowupManager from "../../../../Base/Application/FollowupManager";
import { ApplicationComponents } from "../../../../Base/Application/types";
import Command from "../../../../Base/Command";
import Module from "../../../../Base/Module";
import Bot from "../../../../main";
import { Permnodes } from "../../../../resources/interfaces";

export default class Help extends Command {
	
	constructor(bot: Bot) {

		super(bot);

		this.commands = ["help"];
		this.description = "View information about the bot";
		this.example = "help";
		this.permissions = ["main.help"];

	}

	readonly execute = async (interaction: ApplicationCommandManager): Promise<ApplicationCommandManager | FollowupManager> => {
		const embed: Embed = {
			type: "rich",
			author: {
				name: this.bot.user.username,
				icon_url: this.bot.user.avatarURL
			},
			color: this.bot.constants.config.colors.default,
			description: "🌴 *A Multi-Purpose Bot made by a community, for a community.* 🌴\n\n**OLIVE** is a multi-purpose bot that includes a variety of modules to help your community thrive! Get start by viewing a list of commands by clicking on the button below!"
		},
			components: ApplicationComponents[] = [
				{
					type: 1,
					components: [
						{
							type: 2,
							style: 5,
							url: "https://discord.gg/DEhvVXdVvv",
							label: "Support Server"			
						}, {
							type: 2,
							style: 5,
							url: "https://discord.gg/DEhvVXdVvv",
							label: "Website"			
						}, {
							type: 2,
							style: 5,
							url: "https://discord.gg/DEhvVXdVvv",
							label: "Donate"			
						}, {
							type: 2,
							style: 5,
							url: this.bot.constants.config.invite,
							label: "Invite"			
						}
					]
				}, {
					type: 1,
					components: [
						{
							type: 2,
							style: 1,
							custom_id: "help_commandembed",
							label: "View Commands"
						}
					]
				}
			];

		if (await this.bot.getModule("Main").hasPerm(interaction.member, "main.permnode.view"))
			if (components[1].components)
				components[1].components.push(
					{
						type: 2,
						style: 2,
						custom_id: "help_permissionembed",
						label: "View Permissions"
					}
				);

		return await interaction.reply(
			{
				embeds: [embed],
				components
			}
		);
	}

	readonly update = async (component: ComponentManager): Promise<ApplicationCommandManager | FollowupManager | undefined> => {

		const interaction = component.root;

		switch (component.name) {

		case "help_commandembed": {
			await interaction.defer();

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

			await component.ack();
			return await interaction.edit(
				{
					content: null,
					embeds: [embed],
					components: [
						{
							type: 1,
							components: [
								{
									type: 3,
									custom_id: "help_commandmenu",
									placeholder: "Choose a command",
									min_values: 1,
									max_values: 1,
									options: commands.map((c) => ({ label: c.commands[0].replace(/^\w/, c => c.toUpperCase()), value: c.commands[0], description: c.description }))
								}
							]
						}, {
							type: 1,
							components: [
								{
									type: 2,
									style: 1,
									label: "Permissions List",
									custom_id: "help_permissionembed"
								}, {
									type: 2,
									style: 2,
									label: "Back to Main Menu",
									custom_id: "help_home"
								}
							]
						}
					]
				}
			);
		}

		case "help_permissionembed": {
			await interaction.defer();
			
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

			await component.ack();
			return await interaction.edit(
				{
					embeds: [embed],
					components: [
						{
							type: 1,
							components: [
								{
									type: 3,
									custom_id: "help_modulecomponent",
									placeholder: "Choose a module",
									min_values: 1,
									max_values: 1,
									options: this.bot.modules.map((m: Module) => ({ label: m.name, value: m.name }))
								}
							]
						}, {
							type: 1,
							components: [
								{
									type: 2,
									style: 1,
									label: "Permissions List",
									custom_id: "help_permissionembed"
								}, {
									type: 2,
									style: 2,
									label: "Back to Main Menu",
									custom_id: "help_home"
								}
							]
						}
					]
				}
			);
		}

		case "help_commandmenu": {
			await interaction.defer();

			const command = this.bot.commands.find((c) => c.commands[0] === component.values[0]);

			if (!command)
				return interaction.deny("Could not find the command!");

			const helpEmbed = await this.bot.getModule("Main").createHelpEmbed(command);

			await component.ack();
			return await interaction.edit(
				{
					embeds: [helpEmbed.embed],
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 1,
									custom_id: "help_home",
									label: "Back to help"
								}
							]
						}
					]
				}
			);
		}

		case "help_modulecomponent": {
			await interaction.defer();

			const moduleName = component.values[0],
				perms = this.bot.perms.filter((p) => p.name.split(/[.\-_]/)[0].toLowerCase() === moduleName.toLowerCase());

			await component.ack();
			return await interaction.edit(
				{
					components: [
						{
							type: 1,
							components: [
								{
									type: 3,
									custom_id: "help_permissionmenu",
									placeholder: "Choose a permission",
									min_values: 1,
									max_values: 1,
									options: perms.map((p) => ({ label: p.name, value: p.name }))
								}
							]
						}, {
							type: 1,
							components: [
								{
									type: 2,
									style: 1,
									label: "Permissions List",
									custom_id: "help_permissionembed"
								}, {
									type: 2,
									style: 2,
									label: "Back to Main Menu",
									custom_id: "help_home"
								}
							]
						}
					]
				}
			);
		}

		case "help_permissionmenu": {
			await interaction.defer();

			const permnode: Permnodes = this.bot.perms.find((p) => p.name === component.values[0]) as Permnodes;

			const embed: Embed = {
				title: permnode.name,
				description: `**${permnode.description}**${permnode.default ? " (Default)" : ""}`,
				color: this.bot.constants.config.colors.default,
				type: "rich"
			};

			await component.ack();
			return await interaction.edit(
				{
					embeds: [embed],
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 1,
									custom_id: "help_home",
									label: "Back to help"
								}
							]
						}
					]
				}
			);
		}

		case "help_home": {
			component.ack();

			return await this.execute(component.root);
		}

		}

	}

}