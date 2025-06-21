import { AutocompleteChoice, AutocompleteInteraction, CommandInteraction, Constants, Guild, Member } from "oceanic.js";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";
import Command from "../../../../Base/Command";
import ExtendedClient from "../../../../Base/Client";
import { autoCalculateInfractions, isPunishable, punish } from "../../internals/punishmentHandler";
import { parseDuration, prettifyDuration, validateDuration } from "../../internals/durationHandler";
import { generateCase } from "../../internals/caseHandler";

export default class Timeout extends Command {

  public type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["timeout"];
    this.example = "timeout @user being very mean";
    this.description = "Puts the user on timeout, preventing them from sending messages or joining voice channels.";
    this.permissions = ["moderation.punish.timeout", "moderation.punish.*"];
    this.options = [
      {
        name: "user",
        description: "The user to timeout",
        required: true,
        type: Constants.ApplicationCommandOptionTypes.USER,
      }, {
        name: "reason",
        description: "The reason for the timeout",
        required: false,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      }, {
        name: "time",
        description: "The duration of the timeout",
        required: false,
        autocomplete: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      }
    ];

  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction> | void> => {
    const guild = this.bot.findGuild(interaction.guildID) as Guild,
      moderator = interaction.member,
      user = interaction.data.options.getUser("user", true);

    if (!moderator)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I couldn't find you in the server!`
      });

    if (!user)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} You must specify a user to timeout!`
      });

    const memberToTimeOut = this.bot.findMember(guild, user.id) as Member;

    if (!memberToTimeOut)
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I couldn't find that user!`
      });

    if (await isPunishable(this.bot, moderator, memberToTimeOut)) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} I can't time that user out!`,
      });
    }
    
    let reason = interaction.data.options.getString("reason", false);
    if (!reason || reason.length < 1) reason = "No reason provided";

    const time = interaction.data.options.getString("time", false);

    if (time && !validateDuration(parseDuration(time) as string)) {
      return interaction.createFollowup({
        content: `${this.bot.constants.emojis.x} Invalid time format! Please use a valid duration like \`5m\`, \`1h\`, \`7d\`, etc.`
      });
    }

    const caseData = generateCase("timeout", memberToTimeOut.id, moderator.id, time ?? null, reason);

    await punish(this.bot, guild, caseData);
    await autoCalculateInfractions(this.bot, guild.id, memberToTimeOut.user);

    return interaction.createFollowup({
      content: `${this.bot.constants.emojis.tick} Placed <@${memberToTimeOut.id}> on Time Out for \`${reason}\``
    });
  };

  public autocomplete = async (
    interaction: AutocompleteInteraction
  ): Promise<void> => {
    const focusedOption = interaction.data.options.getFocused(true);
  
    if (focusedOption.name !== "time") return;
  
    const input = focusedOption.value?.toString().trim().toLowerCase() || "";
    const choices: AutocompleteChoice[] = [];
  
    // Case 1: No input → default suggestions
    if (!input) {
      const defaults = ["5m", "1h", "7d", "1mo"];
      for (const val of defaults) {
        const pretty = prettifyDuration(val);
        if (pretty) {
          choices.push({ name: `${val} (${pretty})`, value: val });
        }
      }
      await interaction.result(choices);
      return;
    }
  
    // Case 2: Pure number (e.g. "30") → show options for all units
    if (/^\d+$/.test(input)) {
      for (const unit of ["s", "m", "h", "d"]) {
        const value = `${input}${unit}`;
        const pretty = prettifyDuration(value);
        if (pretty) {
          choices.push({ name: `${value} (${pretty})`, value });
        }
      }
      await interaction.result(choices);
      return;
    }
  
    // Case 3: Valid full input → return specific result only
    const parsed = parseDuration(input);
    if (!parsed || !validateDuration(parsed)) {
      await interaction.result([]);
      return;
    }
  
    const pretty = prettifyDuration(parsed);
    if (pretty) {
      choices.push({ name: `${parsed} (${pretty})`, value: parsed });
      await interaction.result(choices);
    } else {
      await interaction.result([]);
    }
  };

}