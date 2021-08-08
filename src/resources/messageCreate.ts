/* import { Embed, Message } from "eris";
import { Options } from "../../../resources/interfaces";
import Bot from "../../../main";
import Command from "../../../Base/Command";
import Main from "../main";

export const run = async (bot: Bot, msg: Message): Promise<Message | void> => {

	if (msg.author.bot) return;

	const prefix = bot.constants.config.prefix;
	
	if (!msg.content.startsWith(prefix)) return;
	
	const command: Command = bot.commands.filter((cmd: Command) => cmd.commands.includes(msg.content.toLowerCase().replace(prefix.toLowerCase(), "").split(" ")[0]))[0],
		args: string[] = ((msg.content.replace(prefix, "").trim().split(/ +/g).length > 1)
			? msg.content.replace(prefix, "").trim().split(/ +/g).slice(1)
			: []
		);

	if (!command) return;
	if (msg.channel.type !== 0) return msg.channel.createMessage(`${bot.constants.emojis.x} You can only run this command in servers!`);
	
	const requirePerms: string[] = [],
		permissions: string[] = [];
	
	if (msg.channel.type == 0) {

		if (command.permissions) {
			for (const p of command.permissions) {
				const Module: Main = bot.getModule("Main");
				if (!await Module.hasPerm(msg.member, p)) permissions.push(p);
			}
		}

		if (command.subcommands && args.length) {
			const subcommand = command.subcommands.find((cmd: Subcommands) => cmd.name.toLowerCase() === args[0].toLowerCase());

			if (subcommand && subcommand.permissions) {
				for (const p of subcommand.permissions) {
					const Module: Main = bot.getModule("Main");
					if (!await Module.hasPerm(msg.member, p)) permissions.push(p);
				}
			}
		}

	}

	if (requirePerms.length)
		return msg.channel.createMessage(`${bot.constants.emojis.x} I need more permissions to run that command.\n\n Permissions neede: \`${requirePerms.join("`, `")}\``);

	if (permissions.length)
		return await bot.getModule("Main").handlePermission(msg.member, permissions, msg.channel);

	if (command.args && args.length < command.args.filter((arg: Arguments) => !arg.optional).length)
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
	}

	try {
		await command.execute(msg, args);
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
		msg.channel.createMessage({ embed });
		console.error(e);
	}

}; */