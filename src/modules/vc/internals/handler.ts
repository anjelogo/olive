import { Category, Channel } from "./interfaces";
import { CategoryChannel, Constants, ContainerComponent, Member, MessageComponent, StageChannel, VoiceChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";
import Logging from "../../logging/main";
import Main from "../../main/main";

export const create = async (bot: ExtendedClient, member: Member, channel: VoiceChannel): Promise<void> => {
  const mainModule = bot.getModule("Main") as Main;  

  if (!await mainModule.handlePermission(member, "vc.join")) return;

  const data: moduleData = (await bot.getModuleData("VC", channel.guild.id) as unknown) as moduleData,
    category: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

  if (!category || (category && category.channelID !== channel.id)) return;

  const parentOverwrites = (bot.findChannel(channel.guild, category.catID) as CategoryChannel).permissionOverwrites.map((p) => ({ id: p.id, type: p.type, allow: p.allow, deny: p.deny}));

  const voice = await member.guild.createChannel(
    Constants.ChannelTypes.GUILD_VOICE,
    {
      name: data.defaultName.channel.replace("{user}", member.username),
      parentID: channel.parentID as string,
      permissionOverwrites: [
        ...parentOverwrites
      ]
    });
        
  const newChannel: Channel = {
    channelID: voice.id,
    owner: member.id,
    createdAt: Date.now(),
    locked: false,
    parentOverwrites
  };

  member.edit({ channelID: voice.id });
    
  category.channels.push(newChannel);
  await bot.updateModuleData("VC", data, channel.guild);

  // send a message to the user
  try {
    const dm = await member.user.createDM();
    await dm.createMessage({
      components: [
        {
          type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `You have created \`${voice.name}\`!\n\nYou can lock the channel by using \`/vc lock\` and unlock it by using \`/vc unlock\`.\nView information about the channel by using \`/vc info\`.\n\nLeaving the channel will delete it or transfer ownership to another member if there are other members in the channel.`,
            }, {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `-# Created at: ${new Date().toLocaleString("en-US")} | User ID: ${member.id}`,
            }
          ],
          accentColor: bot.constants.config.colors.default,
        }
      ]
    });
  } catch (e) {
    console.error(e);
  }
  
  await createLogEntry(bot, "create", voice, member);
};

export const remove = async (bot: ExtendedClient, member: Member, channel: VoiceChannel | StageChannel): Promise<void> => {
  const data: moduleData = (await bot.getModuleData("VC", channel.guild.id) as unknown) as moduleData,
    category: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

  if (!category) return;

  const channelObj = category.channels.find((c) => c.channelID === channel.id);

  if (!channelObj) return;

  await createLogEntry(bot, "leave", channel, member);

  if (channel.voiceMembers.size <= 0) {

    await channel.delete();

    const i = category.channels.findIndex((c: Channel) => c.channelID === channel.id);
    if (i > -1) category.channels.splice(i, 1);
    await bot.updateModuleData("VC", data, channel.guild);

    await createLogEntry(bot, "end", channel, member, { createdAt: channelObj.createdAt });
    
  } else if (member.id === channelObj.owner) {
    const members = channel.voiceMembers.filter((m) => m.id !== member.id).map((m) => m.id),
      newOwner = bot.findMember(channel.guild, members[Math.floor(Math.random() * members.length)]) as Member;

    channelObj.owner = newOwner.id;

    await bot.updateModuleData("VC", data, channel.guild);

    await createLogEntry(bot, "newOwner", channel, member, { newOwner });

    try {
      const newOwnerDM = await newOwner.user.createDM();
      await newOwnerDM.createMessage({content: `${bot.constants.emojis.warning.yellow} You are now the owner of \`${channel.name}\` in \`${channel.guild.name}\`!`});
      const oldOwnerDM = await member.user.createDM();
      await oldOwnerDM.createMessage({content: `${bot.constants.emojis.warning.yellow} Ownership of \`${channel.name}\` has been transferred to \`${newOwner.tag}\` for \`${channel.guild.name}\`!`});
    } catch (e) {
      console.error(e);
    }
  }
};

export const createLogEntry = async (
  bot: ExtendedClient,
  type: ("join" | "newOwner" | "leave" | "create" | "end" | "information"),
  channel: VoiceChannel | StageChannel,
  member: Member,
  options?: {
    newOwner? : Member,
    locked?: boolean,
    createdAt?: number,
    owner?: Member,
    skipLog?: boolean
  }
): Promise<MessageComponent[] | void> => {
  const logging = bot.getModule("Logging") as Logging,
    baseContainer: ContainerComponent = {
      type: Constants.ComponentTypes.CONTAINER,
      components: [
        {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `-# ${new Date().toLocaleString("en-US")} | User ID: ${member.id}`,
        }
      ]
    };

  let textFields: ContainerComponent["components"] = [];

  switch (type) {
  case "join": {
    textFields = [
      {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: "## Joined Private Voice Channel",
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        spacing: Constants.SeparatorSpacingSize.LARGE,
        divider: false
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `${member.username} joined the channel \`${channel.name}\``,
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        divider: true,
        spacing: Constants.SeparatorSpacingSize.LARGE
      }, {
        type: Constants.ComponentTypes.SECTION,
        components: [
          {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "View more information about the channel.",
          }
        ],
        accessory: {
          type: Constants.ComponentTypes.BUTTON,
          style: Constants.ButtonStyles.SECONDARY,
          customID: `voicechannel_info_${channel.id}`,
          label: "View",
        }
      }
    ];
    break;
  }
  case "create": {
    textFields = [
      {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: "## Created Private Voice Channel",
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        spacing: Constants.SeparatorSpacingSize.SMALL,
        divider: false
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `${member.username} created the channel \`${channel.name}\``,
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        divider: true,
        spacing: Constants.SeparatorSpacingSize.LARGE
      }, {
        type: Constants.ComponentTypes.SECTION,
        components: [
          {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "View more information about the channel.",
          }
        ],
        accessory: {
          type: Constants.ComponentTypes.BUTTON,
          style: Constants.ButtonStyles.SECONDARY,
          customID: `voicechannel_info_${channel.id}`,
          label: "View",
        }
      }
    ];
    break;
  }
  case "leave": {
    textFields = [
      {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: "## Left Private Voice Channel",
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        spacing: Constants.SeparatorSpacingSize.SMALL,
        divider: false
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `${member.username} left the channel \`${channel.name}\``,
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        divider: true,
        spacing: Constants.SeparatorSpacingSize.LARGE
      }, {
        type: Constants.ComponentTypes.SECTION,
        components: [
          {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "View more information about the channel.",
          }
        ],
        accessory: {
          type: Constants.ComponentTypes.BUTTON,
          style: Constants.ButtonStyles.SECONDARY,
          customID: `voicechannel_info_${channel.id}`,
          label: "View",
        }
      }
    ];
    break;
  }
  case "end": {
    if (!options?.createdAt) return;

    textFields = [
      {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: "## Ended Private Voice Channel",
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        spacing: Constants.SeparatorSpacingSize.SMALL,
        divider: false
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `${member.username} ended the channel \`${channel.name}\``,
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        divider: false,
        spacing: Constants.SeparatorSpacingSize.SMALL
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: "### Elapsed Time:",
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `${options?.createdAt ? `${bot.constants.utils.HMS(Date.now() - options.createdAt)} ago` : "Unknown"}`,
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        divider: true,
        spacing: Constants.SeparatorSpacingSize.LARGE
      }
    ];
    break;
  }
  case "newOwner": {
    if (!options?.newOwner) return;
    textFields = [
      {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: "## Transferred Ownership",
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        spacing: Constants.SeparatorSpacingSize.SMALL,
        divider: false
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `### ${member.username} -> ${options.newOwner.username}`,
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `${member.username} -> ${options.newOwner.username}\nSet ${options.newOwner.username} the owner of \`${channel.name}\``,
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        divider: true
      }, {
        type: Constants.ComponentTypes.SECTION,
        components: [
          {
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: "View more information about the channel.",
          }
        ],
        accessory: {
          type: Constants.ComponentTypes.BUTTON,
          style: Constants.ButtonStyles.SECONDARY,
          customID: `voicechannel_information_${channel.id}`,
          label: "View",
        }
      }
    ];
    break;
  }
  case "information": {
    if (!options?.owner || !options.createdAt || !options.locked) return;

    textFields = [
      {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: "# Private Voice Channel Information",
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `${options.locked ? ":lock:" : ":unlock:"} ${(channel as VoiceChannel).name}`,
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        divider: false,
        spacing: Constants.SeparatorSpacingSize.SMALL
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: "## Owner:",
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `${options.owner ? `<@${options.owner.id}>` : "Unknown"}`,
      }, {
        type: Constants.ComponentTypes.SEPARATOR,
        divider: false,
        spacing: Constants.SeparatorSpacingSize.SMALL
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: "## Time Elapsed:",
      }, {
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `${options.createdAt ? `${bot.constants.utils.HMS(Date.now() - options.createdAt)} ago` : "Unknown"}`,
      },
    ];
    break;
  }
  default:
    return;
  }

  const components: MessageComponent[] = [
    {
      ...baseContainer,
      components: [
        ...textFields,
        ...baseContainer.components
      ]
    }
  ];

  if (options?.skipLog) {
    return components;
  } else {
    await logging.log(channel.guild, "vc", components);
    return components;
  }
};