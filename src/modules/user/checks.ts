import ExtendedClient from "../../Base/Client";
import UserModule from "./main";
import { UserModuleData } from "../../Database/interfaces/UserModuleData";

export default class Checks {
  readonly bot: ExtendedClient;
  readonly module: UserModule;

  constructor(bot: ExtendedClient, Module: UserModule) {
    this.bot = bot;
    this.module = Module;
  }

  // Validate existing user documents and clean up dangling ones
  readonly run = async (): Promise<string> => {
    const collection = this.bot.db.get(this.module.name);
    const data = (await collection.find({})) as UserModuleData[];

    const promises: Promise<unknown>[] = [];
    let deletedUsers = 0;
    let fixedUsers = 0;
    let failed = 0;

    async function deleteUser(checks: Checks, userID: string) {
      if (!userID) return;
      try {
        await checks.bot.db.get(checks.module.name).findOneAndDelete({ userID });
        deletedUsers++;
      } catch {
        failed++;
      }
    }

    async function fixUser(checks: Checks, doc: UserModuleData) {
      try {
        // Ensure required fields and defaults
        const updated: UserModuleData = {
          userID: doc.userID,
          version: checks.module.version,
          enabled: typeof doc.enabled === "boolean" ? doc.enabled : true,
          notifications: {
            vc: doc.notifications?.vc ?? true,
          },
        };

        await checks.bot.updateModuleData("User", updated, { userID: doc.userID });
        fixedUsers++;
      } catch {
        failed++;
      }
    }

    for (const userDoc of data) {
      const user = this.bot.findUser(userDoc.userID);
      if (!user) {
        // Mirror other modules' behavior: purge entries that no longer resolve
        promises.push(deleteUser(this, userDoc.userID));
        continue;
      }

      // Basic shape checks; queue fixes if needed
      const needsFix =
        userDoc.version !== this.module.version ||
        typeof userDoc.enabled !== "boolean" ||
        typeof userDoc.notifications?.vc !== "boolean";

      if (needsFix) promises.push(fixUser(this, userDoc));
    }

    await Promise.all(promises);

    return `${deletedUsers} User(s) Deleted. ${fixedUsers} Setting(s) Fixed. ${failed} Failed Operation(s).`;
  };

  // Migrate versions of the user document to the current module.version
  readonly checkVersion = async (newVersion: string): Promise<string> => {
    const collection = this.bot.db.get(this.module.name);
    const data = (await collection.find({})) as UserModuleData[];

    const promises: Promise<unknown>[] = [];

    for (const doc of data) {
      if (doc.version === this.module.version) continue;

      switch (doc.version) {
        // Initial migration path: coerce to current shape and bump version
        case undefined as unknown as string:
        default: {
          const updated: UserModuleData = {
            userID: doc.userID,
            version: newVersion,
            enabled: typeof doc.enabled === "boolean" ? doc.enabled : true,
            notifications: {
              vc: doc.notifications?.vc ?? true,
            },
          };

          promises.push(
            this.bot.updateModuleData("User", updated, { userID: doc.userID })
          );
          break;
        }
      }
    }

    await Promise.all(promises);
    return `${promises.length} User(s) Versions Migrated.`;
  };
}
