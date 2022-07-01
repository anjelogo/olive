import { Guild, Member, User } from "eris";
import Bot from "../../../main";
import Logging from "../main";

export const run = async (bot: Bot, guild: Guild, member: Member | { id: string; user: User }): Promise<void> => {

    const logging = await bot.getModule("Logging") as Logging;

    let user = member.user

    logging.log(guild, "welcome", {
        type: "rich",
        title: `${user.username}#${user.discriminator}`,
        description: `Left the server`,
        author: {
            name: "Left Server",
            icon_url: user.avatarURL
        },
        color: bot.constants.config.colors.red,
        timestamp: new Date(),
        footer: {
            text: `ID: ${member.id}`
        }
    });

}