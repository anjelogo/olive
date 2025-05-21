import { Guild } from "oceanic.js";
import Module from "../../Base/Module";
import ExtendedClient from "../../Base/Client";
import { RolesMessage, RolesModuleData } from "../../Database/interfaces/RolesModuleData";

export default class Roles extends Module {

  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly db: boolean;

  constructor(bot: ExtendedClient) {
    super(bot);

    this.name = "Roles";
    this.version = "1.1";
    this.path = "modules/roles";
    this.db = true;

  }

  readonly getReactionMessage = async (id: string, guild: string | Guild): Promise<RolesMessage | undefined> => {
    if (!id || !guild) return;

    if (typeof guild === "string") guild = this.bot.findGuild(guild) as Guild;

    const data = await this.data(guild.id) as RolesModuleData,
      messages = data.messages;

    console.log("Messages", messages);

    if (!messages.length) return;

    return messages.find((m) => m.id === id);
  }

  readonly moduleData = {
    version: this.version,
    guildID: "",
    roles: [],
    autoRoles: [],
    messages: [],
    savedRoles: {
      enabled: false,
      roles: []
    }
  }

}