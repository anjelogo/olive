import { Guild } from "oceanic.js";
import Module from "../../Base/Module";
import ExtendedClient from "../../Base/Client";
import { messageDataStructure, StarboardModuleData } from "../../Database/interfaces/StarboardModuleData";

export default class Starboard extends Module {

  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly db: boolean;

  constructor (bot: ExtendedClient) {
    super(bot);

    this.name = "Starboard";
    this.version = "1.0";
    this.path = "modules/starboard";
    this.db = true;

  }
  
  readonly getReactionMessage = async (id: string, guild: string | Guild): Promise<messageDataStructure | undefined> => {
    if (!id || !guild) return;

    if (typeof guild === "string") guild = this.bot.findGuild(guild) as Guild;

    const data = await this.data(guild.id) as StarboardModuleData,
      messages = data.messages;

    if (!messages.length) return;

    return messages.find((m) => m.messageID === id);
  }

  readonly moduleData = {
    version: this.version,
    guildID: "",
    messages: []
  }

}