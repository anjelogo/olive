import { Category, Channel } from "../internals/interfaces";
import { Constants, Member, VoiceChannel } from "oceanic.js";
import { create } from "../internals/handler";
import ExtendedClient from "../../../Base/Client";
import { moduleData } from "../main";
import Logging from "../../logging/main";
import Main from "../../main/main";

export const run = async (bot: ExtendedClient, member: Member, channel: VoiceChannel): Promise<void> => {

  if (!channel.parentID) return;

  const data: moduleData = (await bot.getModuleData("VC", channel.guild.id) as unknown) as moduleData,
    mainModule = bot.getModule("Main") as Main,
    cat: Category | undefined = data.categories.find((c: Category) => c.catID === channel.parentID);

  if (!cat) return;

  if (channel.id === cat.channelID) await create(bot, member, channel);

  const channelObj = cat.channels.find((c: Channel) => c.channelID === channel.id);

  if (channelObj) {
    if (await mainModule.handlePermission(member, "vc.join")) {
      //get logging module
      const logging =  bot.getModule("Logging") as Logging;
      // logging.log(channel.guild, "vc", {embeds: [{
      //   type: "rich",
      //   title: `${member.username}`,
      //   description: `Joined \`${channel.name}\``,
      //   author: {
      //     name: "Joined Private Voice Channel",
      //     iconURL: member.avatarURL()
      //   },
      //   color: bot.constants.config.colors.green,
      //   timestamp: new Date().toISOString(),
      //   footer: {
      //     text: `ID: ${member.id}`
      //   }
      // }]});
      logging.log(channel.guild, "vc", [
        {
          type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `# Joined Private Voice Channel\n## ${member.username} joined the channel\n### \`${channel.name}\``,
            }, {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `-# Joined at: ${new Date().toLocaleString("en-US")} | User ID: ${member.id}`,
            }
          ],
          accentColor: bot.constants.config.colors.green,
        }
      ]);
    }
    else 
      member.edit({ channelID: null });
  }
};