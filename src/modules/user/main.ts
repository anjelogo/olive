import ExtendedClient from "../../Base/Client";
import Module from "../../Base/Module";
import { defaultUserModuleData, UserModuleData } from "../../Database/interfaces/UserModuleData";

export default class UserModule extends Module {
  public name = "User" as const;
  public serviceEnabled = true;
  public readonly version = "1.0.0";
  public readonly path = "modules/user";
  public readonly db = true;
  public moduleData = defaultUserModuleData;

  constructor(bot: ExtendedClient) {
    super(bot);
  }

  // Fetch or create user-scoped module data (mirrors Module.data for guilds)
  readonly data = async (userID: string): Promise<UserModuleData | undefined> => {
    if (!this.db || !userID) return;

    const user = this.bot.findUser(userID);
    if (!user) return;

    let data = await this.bot.db.get(this.name).findOne({ userID: user.id }) as UserModuleData | undefined;
    if (!data) {
      const moduleData: UserModuleData = { ...defaultUserModuleData, userID: user.id };

      this.bot.constants.utils.log(
        this.name,
        `Module data not found for user "${user.username}" (${user.id}). Creating now...`
      );
      await this.bot.db
        .get(this.name)
        .bulkWrite([
          {
            updateOne: {
              filter: { userID: user.id },
              update: { $set: moduleData },
              upsert: true,
            },
          },
        ]);
      this.bot.constants.utils.log(
        this.name,
        `Module data created for user "${user.username}" (${user.id}).`
      );
    }

    data = await this.bot.db.get(this.name).findOne({ userID: user.id }) as UserModuleData | undefined;
    return data;
  };

  // Update user-scoped module data (mirrors Client.updateModuleData for guilds)
  public async update(userID: string, data: UserModuleData): Promise<UserModuleData> {
    const user = this.bot.findUser(userID);
    if (!user) throw new Error("Could not find user!");
    if (!data) throw new Error("No data provided!");

    const collection = this.bot.db.get(this.name);
    const existing = await collection.findOne({ userID: user.id }) as UserModuleData | undefined;

    data.userID = user.id;
    data.version = this.version;

    if (!existing) {
      await collection.insert(data);
    } else {
      await collection.findOneAndUpdate({ userID: user.id }, { $set: data });
    }
    return data;
  }
}
