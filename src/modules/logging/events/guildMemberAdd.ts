import { Constants, Member } from "oceanic.js";
import ExtendedClient  from "../../../Base/Client";
import Logging from "../main";

export const run = async (bot: ExtendedClient, member: Member): Promise<void> => {

  const logging = bot.getModule("Logging") as Logging;

  logging.log(member.guild, "welcome", [
    {
      type: Constants.ComponentTypes.CONTAINER,
      accentColor: bot.constants.config.colors.green,
      components: [
        {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: "## Joined the Server",
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          spacing: Constants.SeparatorSpacingSize.SMALL,
          divider: false
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `<@${member.user.id}> has joined the server!`,
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          divider: true,
          spacing: Constants.SeparatorSpacingSize.LARGE
        },{
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `${bot.constants.emojis.user} <t:${Math.floor(Date.now() / 1000)}:f>`,
        }
      ]
    }
  ]);

};