import { ComponentTypes, Guild, Member, Uncached, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Logging from "../main";

export const run = async (bot: ExtendedClient, UncachedMember: Member | User, UncachedGuild: Guild | Uncached): Promise<void> => {

  const logging = bot.getModule("Logging") as Logging;

  const user = UncachedMember instanceof User ? UncachedMember : UncachedMember.user;

  logging.log(bot.findGuild(UncachedGuild.id) as Guild, "welcome", [
    {
      type: ComponentTypes.CONTAINER,
      accentColor: bot.constants.config.colors.green,
      components: [
        {
          type: ComponentTypes.TEXT_DISPLAY,
          content: `# Joined the Server\n\n### ${user.username} joined the server!`,
        }, {
          type: ComponentTypes.TEXT_DISPLAY,
          content: `-# Joined at: ${new Date().toLocaleString("en-US")} | User ID: ${user.id}`,
        }
      ]
    }
  ]);

};