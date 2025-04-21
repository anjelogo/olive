import { CommandInteraction, Constants, Guild, Message } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { getCases, removeCase } from "../../internals/caseHandler";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class History extends Command {

	constructor(bot: ExtendedClient) {

		super(bot);

		this.commands = ["history"];
		this.example = "history view @user";
		this.description = "Views the moderation history of a user";
		this.permissions = ["moderation.history.view", "moderation.history.*"];
		this.options = [
			{
				name: "view",
				description: "View the moderation history of a user",
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				options: [
					{
						name: "user",
						description: "The user to view the moderation history of",
						required: true,
						type: Constants.ApplicationCommandOptionTypes.USER,
					}
				]
			}, {
				name: "clear",
				description: "Clear the moderation history of a user",
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				options: [
					{
						name: "user",
						description: "The user to clear the moderation history of",
						required: true,
						type: Constants.ApplicationCommandOptionTypes.USER,
					}
				]
			}
		];

	}

	readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
		await interaction.defer(Constants.MessageFlags.EPHEMERAL);
		
		const guild = this.bot.findGuild(interaction.guildID) as Guild,
			subcommand = interaction.data.options.raw[0].name;

		const user = interaction.data.options.getUser("user", true);

		if (!user)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} I couldn't find that user!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});

		const cases = await getCases(this.bot, guild, user.id);

		if (!cases)
			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.x} I couldn't find any cases for that user!`,
				flags: Constants.MessageFlags.EPHEMERAL
			});

		switch (subcommand) {
		case "view": {
			let infractions = 0;

			const hierarchy = {
					warn: 1,
					timeout: 2,
					kick: 2,
					ban: 3
				},
				arr = [];

			for (const Case of cases) {
				if (!Case.resolved) infractions += hierarchy[Case.action];
					
				let string = `\`Case (${Case.id}) [${Case.action.substring(0, 1).toUpperCase()}]\``;
				Case.resolved ? string = `~~${string}~~` : string;
				arr.push(string);
			}

			const embed = {
				title: `History for ${user.tag}`,
				description: "`[W]` - Warn\n`[K]` - Kick\n`[T]` - Timeout\n`[B]` - Ban",
				fields: [
					{
						name: `Cases (${arr.length})`,
						value: arr.length ? arr.join(", ") : "None"
					}
				],
				color: this.bot.constants.config.colors.default,
				footer: {
					text: `Infractions: ${infractions}`,
				}, 
				timestamp: new Date().toISOString()
			};

			return interaction.createFollowup({
				content: undefined,
				embeds: [embed],
				flags: Constants.MessageFlags.EPHEMERAL
			});
		}

		case "clear": {
			for (const Case of cases) {
				await removeCase(this.bot, guild, Case.id);
			}

			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.check} Successfully cleared the moderation history of ${user.mention}`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		}
		}
	}

}