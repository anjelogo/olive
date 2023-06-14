import { CommandInteraction, Constants, Message } from "oceanic.js";
import Command from "../../../../Base/Command";
import Bot from "../../../../main";
import Reactionrole from "./reactionrole";

export default class ReactionroleContext extends Command {
	constructor(bot: Bot) {
		super(bot);

		this.commands = ["Create/Edit Reaction Role"];
		this.permissions = ["roles.reaction.modify"];
		this.example = null;
		this.type = Constants.ApplicationCommandTypes.MESSAGE;
	}

	public execute = async (interaction: CommandInteraction): Promise<Message | undefined | void> => {

		const message = interaction.data.resolved.messages.first();

		if (!message) return await interaction.createMessage({content: "Message not found", flags: Constants.MessageFlags.EPHEMERAL});

		(interaction as any).data.options = [
			{
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				name: "modify",
				options: [
					{
						type: Constants.ApplicationCommandOptionTypes.STRING,
						name: "messageid",
						value: message.id
					}
				]
			}
		];

		return await new Reactionrole(this.bot).execute(interaction as unknown as CommandInteraction);
	}
}