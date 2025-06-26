import Module from "../../Base/Module";
import ExtendedClient from "../../Base/Client";
import { VCModuleData } from "../../Database/interfaces/VCModuleData";

export default class VC extends Module {

  readonly name = "VC"
  readonly version: string;
  readonly path: string;
  readonly db: boolean;

  constructor (bot: ExtendedClient) {
    super(bot);

    this.version = "1.3";
    this.path = "modules/vc";
    this.db = true;
    this.serviceEnabled = true;

  }

  readonly moduleData: VCModuleData = {
    enabled: true,
    version: this.version,
    guildID: "",
    categories: [],
    defaultName: {
      channel: ["{user}'s channel"]
    }
  };

}