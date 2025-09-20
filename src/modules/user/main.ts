import ExtendedClient from "../../Base/Client";
import Module from "../../Base/Module";
import { UserModuleData } from "../../Database/interfaces/UserModuleData";

export default class UserModule extends Module {
  public name = "User" as const;
  public serviceEnabled = true;
  public readonly version = "1.0.0";
  public readonly path = "modules/user";
  public readonly db = true;
  
  public readonly moduleData: UserModuleData = {
    userID: "",
    version: this.version,
    enabled: true,
    notifications: {
      vc: true,
    },
  };

  constructor(bot: ExtendedClient) {
    super(bot);
  }

}
