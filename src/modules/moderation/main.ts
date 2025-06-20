import Module from "../../Base/Module";
import ExtendedClient from "../../Base/Client";
import { ModerationModuleData } from "../../Database/interfaces/ModerationModuleData";

export default class Moderation extends Module {

  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly db: boolean;

  constructor (bot: ExtendedClient) {
    super(bot);

    this.name = "Moderation";
    this.version = "1.3";
    this.path = "modules/moderation";
    this.db = true;

  }

  readonly moduleData: ModerationModuleData = {
    enabled: true,
    version: this.version,
    guildID: "",
    cases: [],
    settings: {
      caseLimit: 100,
      autoPunish: {
        enabled: true,
        infractionsUntilWarn: 1,
        infractionsUntilBan: 12,
        infractionsUntilKick: 6,
        infractionsUntilTimeout: 3
      }
    }
  };

}