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
    guildData = await bot.getModuleData("Starboard", guild.id) as StarboardModuleData,
    messageData = guildData.messages.find((m) => m.messageID === message.id) as messageDataStructure,
    stars = messageData.stars.length <= 3 ? star.small : messageData.stars.length <= 10 ? star.medium : star.large;

  // TODO: When revamping logging, use components v2 instead of embeds
  const loggingObj: MessageComponent[] = [
    {
      type: Constants.ComponentTypes.CONTAINER,
      components: [
        {
          type: Constants.ComponentTypes.SECTION,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `# ${stars} ${messageData.stars.length} ${message.author.username}\n## <#${message.channelID}>`,
            }
          ],
          accessory: {
            type: Constants.ComponentTypes.THUMBNAIL,
            media: {
              url: message.author.avatarURL() ?? "",
            }
          }
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          divider: true
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `${message.content}`
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `-# Jump to message: [Click Here](https://discordapp.com/channels/${guild.id}/${message.channelID}/${message.id})`
        }
      ]
        
    }
  ];

  if (message.attachments.size) {
    const attachment = message.attachments.first();

    if (!attachment) return;

    (loggingObj[0] as ContainerComponent).components = [
      ...(loggingObj[0] as ContainerComponent).components,
      {
        type: Constants.ComponentTypes.MEDIA_GALLERY,
        items: [
          {
            media: { url: attachment.url },
            description: "Attachment",
          }
        ]
      }
    ];
  }

  logging.log(guild, "starboard", loggingObj, {
    channelID: message.channelID,
    starID: message.id
  });

};

export async function removeLogEntry(bot: ExtendedClient, guild: Guild, starID: string): Promise<void> {

  const guildLoggingData = await bot.getModuleData("Logging", guild.id) as LoggingModuleData,
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
        await bot.updateModuleData("Logging", guildLoggingData, guild);
      } catch (e) {
        throw new Error("Could not delete message");
      }
    }
  }

}

export async function updateLogEntry(bot: ExtendedClient, guild: Guild, starID: string) {

  const guildLoggingData = await bot.getModuleData("Logging", guild.id) as LoggingModuleData,
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
        guildData = await bot.getModuleData("Starboard", guild.id) as StarboardModuleData,
        messageData = guildData.messages.find((m) => m.messageID === starID) as messageDataStructure,
        channel = bot.findChannel(guild, messageData.channelID) as TextChannel,
        stars = messageData.stars.length <= 3 ? starStrings.small : messageData.stars.length <= 10 ? starStrings.medium : starStrings.large;

      try {
        await message.edit({
          content: `${stars} **${messageData.stars.length}** <#${channel.id}>\n(${messageData.messageID})`,
          embeds: [message.embeds[0]]
        });
      } catch (e) {
        throw new Error("Could not delete message");
      }
    }
  }

}