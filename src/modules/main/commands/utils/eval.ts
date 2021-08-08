import ApplicationCommandManager from "../../../../Base/Application/ApplicationCommandManager";
import FollowupManager from "../../../../Base/Application/FollowupManager";
import { ApplicationCommandOption } from "../../../../Base/Application/types";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";

export default class Eval extends Command {
	
	constructor(bot: Bot) {

		super(bot);

		this.disabled = true;
		this.commands = ["eval"];
		this.description = "Evalulate Code";
		this.example = "eval 2+2";
		this.devOnly = true;
		this.guildSpecific = ["793439337063645184"]; //Olive Support
		this.options = [
			{
				name: "expression",
				type: 3,
				description: "The expression you want to be evaluated",
				required: true
			}
		];
	
	}

	readonly execute = async (interaction: ApplicationCommandManager): Promise<ApplicationCommandManager | FollowupManager> => {

		const code = ((interaction.getOption("expression") as unknown as ApplicationCommandOption).value as string);

		try {
			const evaled = await eval(code);

			/* const MAX_CHARS = 3 + 2 + evaled.toString().length + 3;

			if (MAX_CHARS > 4000) {
				interaction.reply("Output exceeded 4000 characters");
			} */

			return interaction.reply({
				embeds: [
					{
						color: 1416145,
						description: `**Returns** ${typeof (evaled)}`,
						fields: [
							{
								name: "📥 Input",
								value: `\`\`\`xl\n${code}\n\`\`\``
							},
							{
								name: "📤 Output",
								value: `\`\`\`xl\n${evaled}\n\`\`\``
							}
						],
						type: "rich"
					}
				],
				hidden: true
			});
		} catch (e) {
			return interaction.reply({
				embeds: [
					{
						color: 14161450,
						description: "**Returns** Error",
						fields: [
							{
								name: "📥 Input",
								value: `\`\`\`xl\n${code}\n\`\`\``
							},
							{
								name: "Error",
								value: `\`\`\`xl\n${e}\n\`\`\``
							}
						],
						type: "rich"
					}
				],
				hidden: true
			});
		}
	}

}