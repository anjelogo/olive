import { CommandInteraction, Constants } from "oceanic.js";
import ExtendedClient from "../../../../Base/Client";
import Command from "../../../../Base/Command";
import { FollowupMessageInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Emoji extends Command {

  constructor(bot: ExtendedClient) {

    super(bot);

    this.commands = ["emoji"];
    this.description = "Copy an emoji and save it in the server"
    this.example = "emoji copy <emoji>";
    this.options = [
      {
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        name: "copy",
        description: "Copy an emoji and save it in the server",
        permissions: ["main.emoji.copy"],
        options: [
          {
            type: Constants.ApplicationCommandOptionTypes.STRING,
            name: "emoji",
            description: "The emoji you want to copy",
            required: true
          }
        ]
      }
    ]

  }

  readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction>> => {
    await interaction.defer();

    const content = interaction.data.options.getString("emoji") as string;

    if (!content) return interaction.createFollowup({ content: `${this.bot.constants.emojis.x} Please provide an emoji` });

    // regex for emojis
    const animated = /<a?:.+?:\d{17,19}>/gu;

    const emojis = content.match(animated);

    if (!emojis) return interaction.createFollowup({ content: `${this.bot.constants.emojis.x} Please provide a valid emoji` });

    let createdEmojis = [];

    for (const emoji of emojis) {
      const emojiName = emoji.split(":")[1].replace(">", "");
      const emojiId = emoji.split(":")[2].replace(">", "");

      const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${emoji.startsWith("<a:") ? "gif" : "png"}`;

      const res = await fetch(emojiUrl);

      if (!res.ok) return interaction.createFollowup({ content: `${this.bot.constants.emojis.x} Failed to fetch emoji: "${emoji}"` });

      const buffer = await res.arrayBuffer();
      const b64 = Buffer.from(buffer).toString("base64");

      const newEmoji = await interaction.guild?.createEmoji({
        image: `data:image/${emoji.startsWith("<a:") ? "gif" : "png"};base64,${b64}`,
        name: emojiName,
        reason: `Emoji added by ${interaction.user.username}`
      });

      createdEmojis.push(newEmoji);
    }

    return interaction.createFollowup({
      content: `${this.bot.constants.emojis.tick} Emoji(s): "${createdEmojis.map(e => `<${e?.animated ? "a" : ""}:${e?.name}:${e?.id}>`).join(", ")}" added to the server`,
      flags: Constants.MessageFlags.EPHEMERAL
    });
  }

}