import { CommandInteraction, ComponentInteraction, Constants, Guild, Member, Message, TextChannel } from "oceanic.js";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { ModmailModuleData } from "../../../../Database/interfaces/ModmailModuleData";
import { createTicket } from "../../internals/ticketHandler";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Modmail extends Command {

	public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

	constructor(bot: ExtendedClient) {

		super(bot);

		this.commands = ["modmail"];
		this.description = "Manage the Modmail module";
		this.example = "modmail setup";
		this.permissions = ["modmail.staff"];
		this.options = [
			{
				name: "setup",
				type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
				description: "Configure the Modmail module for this server",
				options: [
					{
						name: "entry-channel",
						type: Constants.ApplicationCommandOptionTypes.CHANNEL,
						description: "The channel members open tickets from",
						channelTypes: [Constants.ChannelTypes.GUILD_TEXT],
						required: true
					}, {
						name: "category",
						type: Constants.ApplicationCommandOptionTypes.CHANNEL,
						description: "The category ticket channels are created under",
						channelTypes: [Constants.ChannelTypes.GUILD_CATEGORY],
						required: true
					}, {
						name: "log-channel",
						type: Constants.ApplicationCommandOptionTypes.CHANNEL,
						description: "The channel closed ticket transcripts are posted to",
						channelTypes: [Constants.ChannelTypes.GUILD_TEXT],
						required: true
					}, {
						name: "ticket-limit",
						type: Constants.ApplicationCommandOptionTypes.INTEGER,
						description: "Max concurrent open tickets per member (default 1)",
						required: false,
						minValue: 1
					}
				]
			}
		];

	}

	readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {

		const guild = this.bot.findGuild(interaction.guildID) as Guild,
			subcommand = interaction.data.options.raw[0].name;

		switch (subcommand) {

		case "setup": {
			const entryChannel = interaction.data.options.getChannel("entry-channel", true),
				category = interaction.data.options.getChannel("category", true),
				logChannel = interaction.data.options.getChannel("log-channel", true),
				ticketLimit = interaction.data.options.getInteger("ticket-limit", false) ?? 1;

			await this.bot.updateModuleData("Modmail", {
				entryChannelID: entryChannel.id,
				categoryID: category.id,
				logChannelID: logChannel.id,
				ticketLimit
			} as Partial<ModmailModuleData>, { guildID: guild.id });

			const channel = this.bot.findChannel(guild, entryChannel.id) as TextChannel;

			await channel.createMessage({
				embeds: [{
					description: "Click the button below to open a modmail ticket with our staff team.",
					color: this.bot.constants.config.colors.default
				}],
				components: [{
					type: Constants.ComponentTypes.ACTION_ROW,
					components: [{
						type: Constants.ComponentTypes.BUTTON,
						style: Constants.ButtonStyles.PRIMARY,
						customID: "modmail_0_open",
						label: "Open Ticket"
					}]
				}]
			});

			return interaction.createFollowup({
				content: `${this.bot.constants.emojis.tick} Modmail configured. Entry: <#${entryChannel.id}>, Category: <#${category.id}>, Log: <#${logChannel.id}>, Limit: ${ticketLimit}.`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
		}

		}

	}

	readonly update = async (component: ComponentInteraction): Promise<Message | void> => {

		if (component.data.customID.split("_")[2] !== "open") return;

		const guild = this.bot.findGuild(component.guildID) as Guild,
			member = component.member as Member,
			data = await this.bot.getModuleData("Modmail", { guildID: guild.id }) as ModmailModuleData;

		if (!data.entryChannelID) {
			await component.createFollowup({
				content: `${this.bot.constants.emojis.x} Modmail isn't configured for this server yet.`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
			return;
		}

		if (data.blockedUserIDs.includes(member.id)) {
			await component.createFollowup({
				content: `${this.bot.constants.emojis.x} You are blocked from opening modmail tickets.`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
			return;
		}

		const memberTickets = data.openTickets.filter((t) => t.memberID === member.id);

		if (memberTickets.length >= data.ticketLimit) {
			if (memberTickets.length === 1) {
				await component.createFollowup({
					content: `${this.bot.constants.emojis.warning.yellow} You already have an open ticket: <#${memberTickets[0].channelID}>`,
					flags: Constants.MessageFlags.EPHEMERAL
				});
				return;
			}

			await component.createFollowup({
				content: `${this.bot.constants.emojis.warning.yellow} You've reached your open ticket limit (${data.ticketLimit}).`,
				flags: Constants.MessageFlags.EPHEMERAL
			});
			return;
		}

		const channel = await createTicket(this.bot, guild, member, data);

		await component.createFollowup({
			content: `${this.bot.constants.emojis.tick} Ticket opened: <#${channel.id}>`,
			flags: Constants.MessageFlags.EPHEMERAL
		});
	}

}
