import Eris, { CommandInteraction, Constants } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";

export default class Eval extends Command {
	
	constructor(bot: ExtendedClient) {

		super(bot);

		this.disabled = false;
		this.commands = ["eval"];
		this.example = "eval 2+2";
		this.devOnly = true;
		this.options = [
			{
				name: "expression",
				type: Constants.ApplicationCommandOptionTypes.STRING,
				description: "The expression you want to be evaluated",
				required: true
			}
		];
	
	}

	readonly execute = async (interaction: CommandInteraction): Promise<void> => {

		const code = (interaction.data.options.getStringOption("expression"))?.value as string;


		try {
			const evaled = await eval(code);

			/* const MAX_CHARS = 3 + 2 + evaled.toString().length + 3;

			if (MAX_CHARS > 4000) {
				interaction.reply("Output exceeded 4000 characters");
			} */

			return interaction.createMessage({
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
						]
					}
				],
				flags: Constants.MessageFlags.EPHEMERAL
			});
		} catch (e) {
			return interaction.createMessage({
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
						]
					}
				],
				flags: Constants.MessageFlags.EPHEMERAL
			});
		}
	}

}