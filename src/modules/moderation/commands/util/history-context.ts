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

    // create command interaction options for the history command
    const cmd = new CommandInteraction(
      {
        type: 1,
        data: {
          name: "history",
          options: [
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
          ],
          type: Constants.ApplicationCommandTypes.CHAT_INPUT,
          id: interaction.id,
        },
        guild_id: interaction.guildID!,
        channel_id: interaction.channelID,
        id: interaction.id,
        token: interaction.token,
        version: 1,
        app_permissions: "0", // Add default permissions
        application_id: this.bot.user.id, // Use bot's application ID
        authorizing_integration_owners: {} // Provide an empty object matching Partial<Record<"0" | "1", string>>
      },
      this.bot
    )

		await new History(this.bot).execute(cmd);
    return;
	}
}