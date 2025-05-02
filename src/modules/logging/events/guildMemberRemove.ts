import { Constants, Guild, Member, Uncached, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Logging from "../main";

export const run = async (bot: ExtendedClient, UncachedMember: Member | User, UncachedGuild: Guild | Uncached): Promise<void> => {

  const logging = bot.getModule("Logging") as Logging;

  const user = UncachedMember instanceof User ? UncachedMember : UncachedMember.user;

  logging.log(bot.findGuild(UncachedGuild.id) as Guild, "welcome", [
    {
      type: Constants.ComponentTypes.CONTAINER,
      accentColor: bot.constants.config.colors.red,
      components: [
        {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: "## Left the Server",
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          spacing: Constants.SeparatorSpacingSize.SMALL,
          divider: false
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `<@${user.id}> has left the server!`,
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