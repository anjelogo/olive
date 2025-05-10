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
    this.version = "1.1";
    this.path = "modules/moderation";
    this.db = true;

  }

  public run = async (): Promise<void> => {
    await this.load();
  }

  readonly moduleData: ModerationModuleData = {
    version: this.version,
    guildID: "",
    cases: [],
    settings: {
      caseLimit: 100,
      infractionUntilBan: 12,
      infractionUntilKick: 6,
      infractionUntilTimeout: 3
    }
  }

}