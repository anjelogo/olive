import { CommandInteraction, Constants, Guild, ApplicationIntegrationTypes, InteractionContextTypes } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { StarboardModuleData } from "../../../../Database/interfaces/StarboardModuleData";

export default class Starboard extends Command {

  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

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
    this.integrationTypes = [ApplicationIntegrationTypes.GUILD_INSTALL];
    this.contexts = [InteractionContextTypes.GUILD];

  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {

    const guild = this.bot.findGuild(interaction.guildID) as Guild,
  data = await this.bot.getModuleData("Starboard", { guildID: guild.id }) as StarboardModuleData,
      subcommand = interaction.data.options.raw[0].name;

    switch (subcommand) {

    case "view": {
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
  };
}