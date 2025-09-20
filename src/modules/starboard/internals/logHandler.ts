import { Constants, ContainerComponent, Guild, Message, MessageComponent, TextChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Logging from "../../logging/main";
import { LoggingModuleData } from "../../../Database/interfaces/LoggingModuleData";
import { messageDataStructure, StarboardModuleData } from "../../../Database/interfaces/StarboardModuleData";

export const createLogEntry = async (bot: ExtendedClient, guild: Guild, message: Message): Promise<void> => {

  const star = {
      small: "⭐",
      medium: "🌟",
      large: "💫"
    },
    logging = bot.getModule("Logging") as Logging,
  guildData = await bot.getModuleData("Starboard", { guildID: guild.id }) as StarboardModuleData,
    messageData = guildData.messages.find((m) => m.messageID === message.id) as messageDataStructure,
    stars = messageData.stars.length <= 3 ? star.small : messageData.stars.length <= 10 ? star.medium : star.large;

  const baseContainer: ContainerComponent = {
    type: Constants.ComponentTypes.CONTAINER,
    components: [
      {
        type: Constants.ComponentTypes.SEPARATOR,
        divider: true,
        spacing: Constants.SeparatorSpacingSize.LARGE
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `-# <t:${Math.floor(Date.now() / 1000)}:f> • ||${messageData.messageID}||`
      }
    ]
  };

  const textFields: ContainerComponent["components"] = [
    {
      type: Constants.ComponentTypes.SECTION,
      components: [
        {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `## <@${message.author.id}>`,
        }
      ],
      accessory: {
        type: Constants.ComponentTypes.BUTTON,
        style: Constants.ButtonStyles.LINK,
        label: "Jump to message",
        url: `https://discordapp.com/channels/${guild.id}/${message.channelID}/${message.id}`
      }
    }
  ];

  if (message.content) {
    textFields.push(
      {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: message.content.length > 2000 ? `${message.content.slice(0, 2000)}...` : message.content
      }
    );
  }

  if (message.attachments.size) {
    const attachment = message.attachments.first();

    if (!attachment) return;

    textFields.push(
      {
        type: Constants.ComponentTypes.MEDIA_GALLERY,
        items: [
          {
            media: { url: attachment.url as string },
            description: "Attachment",
          }
        ]
      }
    );
  }

  const components: MessageComponent[] = [
    {
      type: Constants.ComponentTypes.TEXT_DISPLAY,
      content: `## ${stars} ${messageData.stars.length} <#${message.channelID}>`
    }, {
      ...baseContainer,
      components: [
        ...textFields,
        ...baseContainer.components
      ]
    }
  ];

  logging.log(guild, "starboard", components, {
    channelID: message.channelID,
    starID: message.id
  });

};

export async function removeLogEntry(bot: ExtendedClient, guild: Guild, starID: string): Promise<void> {

  const guildLoggingData = await bot.getModuleData("Logging", { guildID: guild.id }) as LoggingModuleData,
    loggingChannels = guildLoggingData.channels.filter((c) => c.types.includes("starboard"));

  if (loggingChannels.length) {
    for (const channels of loggingChannels) {
      if (!channels.stars) continue;
      const star = channels.stars.find((s) => s.starID === starID);
      if (!star) continue;

      const message = bot.findMessage(bot.getChannel(channels.channelID) as TextChannel, star.messageID);

      if (!message) continue;

      channels.stars = channels.stars.filter((s) => s.starID !== starID);

      try {
        await message.delete();
        await bot.updateModuleData("Logging", guildLoggingData, { guildID: guild.id });
      } catch (e) {
        throw new Error("Could not delete message");
      }
    }
  }

}

export async function updateLogEntry(bot: ExtendedClient, guild: Guild, starID: string) {

  const guildLoggingData = await bot.getModuleData("Logging", { guildID: guild.id }) as LoggingModuleData,
    loggingChannels = guildLoggingData.channels.filter((c) => c.types.includes("starboard"));

  if (loggingChannels.length) {
    for (const starboard of loggingChannels) {
      if (!starboard.stars) continue;
      const star = starboard.stars.find((s) => s.starID === starID);
      if (!star) continue;

      const message = bot.findMessage(bot.getChannel(starboard.channelID) as TextChannel, star.messageID);

      if (!message) continue;

      const starStrings = {
          small: "⭐",
          medium: "🌟",
          large: "💫"
        },
  guildData = await bot.getModuleData("Starboard", { guildID: guild.id }) as StarboardModuleData,
        messageData = guildData.messages.find((m) => m.messageID === starID) as messageDataStructure,
        stars = messageData.stars.length <= 3 ? starStrings.small : messageData.stars.length <= 10 ? starStrings.medium : starStrings.large;

      try {
        await message.edit({
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `## ${stars} ${messageData.stars.length} <#${messageData.channelID}>`
            },
            ...message.components.slice(1),
          ]
        });
      } catch (e) {
        throw new Error("Could not delete message");
      }
    }
  }

}