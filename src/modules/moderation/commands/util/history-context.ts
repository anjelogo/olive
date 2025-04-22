import { CommandInteraction, Constants, Message } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import History from "./history";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class HistoryContext extends Command {
    
	constructor(bot: ExtendedClient) {
		super(bot);

		this.commands = ["View History"];
		this.permissions = ["moderation.history.view", "moderation.history.*"];
		this.example = null;
		this.type = Constants.ApplicationCommandTypes.USER;
	}

	public execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {

		const member = interaction.data.resolved.members.first();
		if (!member) return interaction.createFollowup({content: "Member not found"});

		(interaction as any).data.options = [
			{
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				name: "view",
				options: [
					{
						type: Constants.ApplicationCommandOptionTypes.USER,
						name: "user",
						value: member.id
					}
				]
			}
		];

		await new History(this.bot).execute(interaction as unknown as CommandInteraction);
    return;
	}
}