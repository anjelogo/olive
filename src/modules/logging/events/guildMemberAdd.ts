import { Guild, Member } from "oceanic.js";
import Bot from "../../../main";
import Logging from "../main";

export const run = async (bot: Bot, guild: Guild,  member: Member): Promise<void> => {

    const logging = await bot.getModule("Logging") as Logging;

    logging.log(guild, "welcome", {embeds: [{
        type: "rich",
        title: `${member.username}#${member.discriminator}`,
        description: `Joined the server`,
        author: {
            name: "Joined Server",
            iconURL: member.avatarURL()
        },
        color: bot.constants.config.colors.green,
        timestamp: new Date().toDateString(),
        footer: {
            text: `ID: ${member.id}`
        }
    }]});

}