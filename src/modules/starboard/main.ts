import { Guild } from "oceanic.js";
import Module, { moduleDataStructure } from "../../Base/Module";
import ExtendedClient from "../../Base/Client";

export interface messageDataStructure {
  channelID: string;
    messageID: string;
  authorID: string;
    stars: string[];
}

export interface moduleData extends moduleDataStructure {
    messages: messageDataStructure[];
}

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

  public run = async (): Promise<void> => {
    await this.load();
  }

  readonly getReactionMessage = async (id: string, guild: string | Guild): Promise<messageDataStructure | undefined> => {
    if (!id || !guild) return;

    if (typeof guild === "string") guild = this.bot.findGuild(guild) as Guild;

    const data: moduleData = await this.data(guild.id) as moduleData,
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