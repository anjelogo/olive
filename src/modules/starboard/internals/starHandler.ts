import { Guild, Message } from "eris";
import Bot from "../../../main";
import  { messageDataStructure, moduleData } from "../main";
import { createLogEntry, removeLogEntry, updateLogEntry } from "./logHandler";
import { moduleData as LoggingModuleData } from "../../logging/main";

export const getStarredMessage = async (bot: Bot, messageID: string, guild: Guild): Promise<messageDataStructure | undefined> => {
    const data = await bot.getModuleData("Starboard", guild) as moduleData;

    if (!data) return undefined;
    if (!data.messages || !data.messages.length) return undefined;

    return data.messages.filter((m) => m.messageID === messageID)[0];
}

export const handleStarredMessage = async (bot: Bot, guild: Guild, message: Message, action: ("add" | "remove"), reactorID: string) => {
    let msg = message;
    
    //Check if message is the message on the starboard log
    const loggingData = await bot.getModuleData("Logging", guild) as LoggingModuleData,
        loggingChannels = loggingData.channels.filter((c) => c.channelID === message.channel.id);

    if (loggingChannels.length) {
        const loggingChannel = loggingChannels[0],
            stars = loggingChannel.stars ? loggingChannel.stars.filter((s) => s.messageID === msg.id) : [];

        if (stars.length)
            msg = await bot.getMessage(stars[0].channelID, stars[0].starID)
    }

    const starData = await getStarredMessage(bot, msg.id, guild);

    if (starData)
        await updateStarredMessage(bot, guild, msg, action, reactorID);
    else if (!starData && action === "add")
        await createStarredMessage(bot, guild, msg, reactorID);
}

export const createStarredMessage = async (bot: Bot, guild: Guild, message: Message, reactorID: string) => {

    const data = await bot.getModuleData("Starboard", guild) as moduleData;

    if (!data) return;

    const obj = {
        channelID: message.channel.id,
        messageID: message.id,
        authorID: message.author.id,
        stars: [
            reactorID
        ]
    }

    data.messages ? data.messages.push(obj) : data.messages = [obj];

    try {
        await bot.updateModuleData("Starboard", data, guild);
        await createLogEntry(bot, guild, message);
    } catch (e) {
        throw new Error(e as string);
    }
}

export const updateStarredMessage = async (bot: Bot, guild: Guild, message: Message, action: ("add"| "remove"), reactorID: string) => {
    
    const data = await bot.getModuleData("Starboard", guild) as moduleData;

    if (!data) return;

    let starredMessageData = data.messages.find((m) => m.messageID === message.id)!! as messageDataStructure;

    if (!starredMessageData) return;

    const beforeCount = starredMessageData.stars.length;

    switch (action) {
        case "add":
            if (!starredMessageData.stars.includes(reactorID))
            starredMessageData.stars.push(reactorID);
            break;
        case "remove":
            if (starredMessageData.stars.includes(reactorID))
            starredMessageData.stars.splice(starredMessageData.stars.indexOf(reactorID), 1)
    }

    if (beforeCount === starredMessageData.stars.length) return;
    if (starredMessageData.stars.length === 0) {
        await removeStarredMessage(bot, guild, message);
        return;
    }

    try {
        await bot.updateModuleData("Starboard", data, guild);
        await updateLogEntry(bot, guild, message.id);
    } catch (e) {
        return console.log(e)
    }
}

export const removeStarredMessage = async (bot: Bot, guild: Guild, message: Message) => {
    const starboardData = await bot.getModuleData("Starboard", guild) as moduleData;

    if (!starboardData) return;

    const data = starboardData.messages.filter((m) => m.messageID === message.id)[0];

    if (!data) return;

    starboardData.messages.splice(starboardData.messages.indexOf(data), 1);

    try {
        await bot.updateModuleData("Starboard", starboardData, guild);
        await removeLogEntry(bot, guild, message.id);
        await message.removeReactions();
    } catch (e) {
        throw new Error("Could not update data");
    }
}
