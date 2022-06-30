import { CommandInteraction, ComponentInteraction, Constants, Embed, InteractionDataOption, Member, Message } from "eris";
import { Options } from "../../../Base/Command";
import Bot from "../../../main";
import Main from "../main";

export const commandHandler = async (bot: Bot, interaction: CommandInteraction): Promise<Message | void | boolean> => {
	
	const member: Member = interaction.member as Member,
		command = interaction.data.type === Constants.ApplicationCommandTypes.MESSAGE
		? bot.commands.filter((c) => c.commands[0] === "Create/Edit Reaction Role")[0]
		: bot.commands.filter((c) => c.commands.includes(interaction.data.name))[0],
		mainModule: Main = bot.getModule("Main");	

	if (!command) return;
	if (interaction.channel && interaction.channel.type !== 0) return interaction.createMessage(`${bot.constants.emojis.x} You can only run these commands in servers!`);

	const requirePerms: string[] = [],
		permissions: string[] = [];

	if (command.devOnly && !bot.constants.config.developers.includes(interaction.member?.id))
		return interaction.createMessage(`${bot.constants.emojis.x} You can't run this command!`);

	if (command.permissions) {
		for (const p of command.permissions) {
			if (!await mainModule.hasPerm(interaction.member, p)) permissions.push(p);
		}
	}

	//Replace subcommands permissions here
	/* 		if (command.subcommands && args.length) {
			const subcommand = command.subcommands.find((cmd: Subcommands) => cmd.name.toLowerCase() === args[0].toLowerCase());

			if (subcommand && subcommand.permissions) {
				for (const p of subcommand.permissions) {
					const Module: Main = bot.getModule("Main");
					if (!await Module.hasPerm(msg.member, p)) permissions.push(p);
				}
			}
		} */

	if (command.options && interaction.data.options) {
		const options = interaction.data.options,
			commandOption: Options = command.options.find((cmd) => cmd.name.toLowerCase() === options[0].name.toLowerCase())!!;

		if (commandOption) {
			if (commandOption.permissions) {
				for (const p of commandOption.permissions) {
					if (!await mainModule.hasPerm(interaction.member, p)) permissions.push(p);
				}
			}

			if (commandOption.type === Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP
				&& commandOption.options
				&& options.length > 0) {
				const subcommand = commandOption.options.find((cmd) => cmd.name.toLowerCase() === options[0].name.toLowerCase()) as Options;

				if (subcommand && subcommand.permissions) {
					for (const p of subcommand.permissions) {
						if (!await mainModule.hasPerm(interaction.member, p)) permissions.push(p);
					}
				}
			}
		}
	}

	if (requirePerms.length)
		return interaction.createMessage(`${bot.constants.emojis.x} I need more permissions to run that command.\n\n Permissions neede: \`${requirePerms.join("`, `")}\``);

	if (permissions.length)
		return await mainModule.handlePermission(member, [... new Set(permissions)], interaction);

	//Missing arguments thing (Review later, i dont think it's necessary)
	/* 	if (command.args && args.length < command.args.filter((arg: Arguments) => !arg.optional).length)
		return msg.channel.createMessage(bot.getModule("Main").createHelpEmbed(command, `${bot.constants.emojis.warning.yellow} You're missing some arguments!`));

	if (command.subcommands && args.length) {
		for (let i = 0; i < command.subcommands.length; i++) {
			const subcommand = command.subcommands[i];
			if (args[0].toLowerCase() === subcommand.name.toLowerCase()) {
				if (subcommand.args && args.length - 1 < subcommand.args.filter((arg: Arguments) => !arg.optional).length) {
					return msg.channel.createMessage(bot.getModule("Main").createHelpEmbed(command, `${bot.constants.emojis.warning.yellow} You're missing some arguments!`));
				}
			}
		}
	} */

	try {
		await command.execute(interaction);
	} catch (e) {
		const embed: Embed = {
			author: {
				name: "Command Error"
			},
			color: bot.constants.config.colors.red,
			fields: [{
				name: "Error",
				value: `\`\`\`x1\n${e}\n\`\`\``
			},
			{
				name: "What do I do?",
				value: "Report the error to an admin if you cannot solve this"
			}
			],
			type: "rich"
		};
		interaction.createMessage({ embeds: [embed], flags: Constants.MessageFlags.EPHEMERAL });
		console.error(e);
	}

};

export const updateHandler = async (bot: Bot, component: ComponentInteraction, authorID: string): Promise<Message | void> => {

	const command = bot.commands.filter((c) => c.commands.includes(component.data.custom_id.split("_")[0]))[0];
	if (!command) return;

	const member = component.member as Member;
	
	if (member.id !== authorID) return;

	try {
		await command.update(component);
	} catch (e) {
		const embed: Embed = {
			author: {
				name: "Command Error"
			},
			color: bot.constants.config.colors.red,
			fields: [{
				name: "Error",
				value: `\`\`\`x1\n${e}\n\`\`\``
			},
			{
				name: "What do I do?",
				value: "Report the error to an admin if you cannot solve this"
			}
			],
			type: "rich"
		};
		component.createMessage({ embeds: [embed], flags: Constants.MessageFlags.EPHEMERAL });
		throw new Error(e as string);
	}

};