import { ComponentTypes, Member } from "oceanic.js";
import ExtendedClient  from "../../../Base/Client";
import Logging from "../main";

export const run = async (bot: ExtendedClient, member: Member): Promise<void> => {

  const logging = bot.getModule("Logging") as Logging;

  logging.log(member.guild, "welcome", [
    {
      type: ComponentTypes.CONTAINER,
      accentColor: bot.constants.config.colors.green,
      components: [
        {
          type: ComponentTypes.TEXT_DISPLAY,
          content: `# Joined the Server\n\n### ${member.user.username} joined the server!`,
        }, {
          type: ComponentTypes.TEXT_DISPLAY,
          content: `-# Joined at: ${new Date().toLocaleString("en-US")} | User ID: ${member.user.id}`,
        }
      ]
    }
  ]);

};