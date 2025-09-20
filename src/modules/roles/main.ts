import { Guild } from "oceanic.js";
import Module from "../../Base/Module";
import ExtendedClient from "../../Base/Client";
import { RolesMessage, RolesModuleData } from "../../Database/interfaces/RolesModuleData";

export default class Roles extends Module<"guild"> {

  readonly name = "Roles";
  readonly version: string;
  readonly path: string;
  readonly db: boolean;

  constructor(bot: ExtendedClient) {
    super(bot);

    this.version = "1.2";
    this.path = "modules/roles";
    this.db = true;
    this.serviceEnabled = true;

  }

  readonly getReactionMessage = async (id: string, guild: string | Guild): Promise<RolesMessage | undefined> => {
    if (!id || !guild) return;

    if (typeof guild === "string") guild = this.bot.findGuild(guild) as Guild;

    const data = await this.data({ guildID: guild.id}) as RolesModuleData,
      messages = data.messages;

    if (!messages.length) return;

    return messages.find((m) => m.id === id);
  };

  readonly moduleData: RolesModuleData = {
    enabled: true,
    version: this.version,
    guildID: "",
    roles: [],
    autoRoles: [],
    messages: [],
    savedRoles: {
      enabled: false,
      roles: []
    }
  };

}