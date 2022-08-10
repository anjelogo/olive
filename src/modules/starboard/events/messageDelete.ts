import { Message, TextChannel } from "eris";
import Bot from "../../../main";
import { moduleData } from "../main";

export const run = async (bot: Bot, message: Message | { id: string, channel: (TextChannel | { id: string; }), guildID: string, guild: { id: string }}) => {
    const StarboardData = await bot.getModuleData("Starboard", message.guildID!!) as moduleData;

    if (!StarboardData.messages) return;
    
    const msg = StarboardData.messages.find((m) => m.messageID === message.id);
    if (!msg) return;

    StarboardData.messages = StarboardData.messages.filter((m) => m.messageID !== message.id);

    try {
        await bot.updateModuleData("Starboard", StarboardData, message.guildID!!);
    } catch (e) {
        throw new Error("Could not update starboard data");
    }
}