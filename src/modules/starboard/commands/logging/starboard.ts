import { CommandInteraction, Constants, Guild, Message } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { moduleData } from "../../main";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Starboard extends Command {

	constructor(bot: ExtendedClient) {

		super(bot);

		this.commands = ["starboard"];
		this.description = "View Starboard Data for a user";
		this.example = "starboard view @user";
		this.options = [
			{
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				name: "view",
				description: "View Starboard Data for a user",
				permissions: ["starboard.view"],
				options: [
					{
						type: Constants.ApplicationCommandOptionTypes.USER,
						name: "user",
						description: "The user to view Starboard Data for",
						required: true
					}
				]
			}
		];

	}

	readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {

		const guild = this.bot.findGuild(interaction.guildID) as Guild,
			data = await this.bot.getModuleData("Starboard", guild.id) as moduleData,
			subcommand = interaction.data.options.raw[0].name;

		switch (subcommand) {

		case "view": {
			await interaction.defer();

			const member = interaction.data.options.getMember("user", true),
				stars = data.messages.filter((m) => m.authorID === member.id).map((s) => s.stars).length;

			if (!member)
				return interaction.createFollowup({
					content: "User not found.",
					flags: Constants.MessageFlags.EPHEMERAL
				});

			await interaction.createFollowup({
				embeds: [
					{
						description: `User has ⭐ **${stars}** stars.`,
						color: this.bot.constants.config.colors.default
					}
				],
				flags: Constants.MessageFlags.EPHEMERAL
			});
		}
		}
	}
}