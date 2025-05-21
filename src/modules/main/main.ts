import { CommandInteraction, Constants, Embed, Member, PrivateChannel } from "oceanic.js";
import { Permnodes } from "../../resources/interfaces";
import Module from "../../Base/Module";
import ExtendedClient from "../../Base/Client";
import { MainModuleData } from "../../Database/interfaces/MainModuleData";


export interface helpEmbed {
  content: string;
  embed: Embed;
}

export default class Main extends Module {

  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly weight: number;
  readonly db: boolean;

  constructor (bot: ExtendedClient) {
    super(bot);

    this.name = "Main";
    this.version = "1.1";
    this.path = "modules/main";
    this.weight = 0; //Load this module before everything
    this.db = true; //Uses database

  }

  readonly getPerms = async (member: Member | undefined): Promise<string[] | null> => {
    if (!member) return null;

    const moduleData = await this.bot.getModuleData("Main", member.guild.id) as MainModuleData,
      permissions = moduleData.permissions;

    let perms: string[] = [...this.bot.perms.filter((p) => p.default).map((p) => p.name)];
    const userData = permissions.find((p) => p.userID === member.id);

    if (userData) {
      const userPerms: (Permnodes | undefined)[] = userData.permissions
        .filter((p) => p.value)
        .map((p) => this.bot.perms.find((permnode) => permnode.name === p.permission));

      if (userPerms)
        perms = [...userPerms.map((p) => (p as Permnodes).name)];
    }
  
    if (member.roles.length) {
      for (const r of member.roles) {
        const roleData = permissions.find((p) => p.roleID === r);

        if (!roleData) continue;
      
        const rolePerms = roleData.permissions
          .filter((p) => p.value)
          .map((p) => this.bot.perms.find((permnode) => permnode.name === p.permission));

        perms = [...perms, ...rolePerms.map((p) => (p as Permnodes).name)];
      }
    }

    return perms;
  }

  readonly hasPerm = async (member: Member | null, perm: string): Promise<boolean> => {
    if (!member || !perm) return false;

    const masterPerm = `${perm.split(/[.\-_]/)[0]}.*`,
      permission = this.bot.perms.find((p: Permnodes) => p.name === perm),
      moduleData = await this.bot.getModuleData("Main", member.guild.id) as MainModuleData,
      permissions = moduleData.permissions;

    if (!permission || !permissions) return false;
    if (member.permissions.has("ADMINISTRATOR")) return true;

    const perms = [...new Set(await this.getPerms(member))];

    return [masterPerm, perm, "*"].some(p => perms.includes(p));
  }

  public handlePermission = async (member: Member, permission: string[] | string, interaction?: CommandInteraction): Promise<boolean> => {
    if (typeof permission === "string") permission = [permission];

    const permissions = [];

    for (const perm of permission) {
      const permnode = this.bot.perms.find((p) => p.name === perm);

      if (!permnode) continue;

      const bool = await this.hasPerm(member, permnode.name);

      if (!bool) permissions.push(permnode);
    }

    // permissions.map((p) => p.name).join("`, `")
    if (permissions.length) {
      const dmChannel: PrivateChannel | undefined = await member.user.createDM() as PrivateChannel;

      if (interaction) {
        interaction.createFollowup({
          components: [
            {
              type: Constants.ComponentTypes.CONTAINER,
              components: [
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: "# You don't have permission for this action.",
                },
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: `## Permissions needed:\n\`${permissions.map((p) => p.name).join("`, `")}\``
                },
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: "### Contact a server administrator if you think this is a mistake."
                }
              ]
            }
          ],
          flags: Constants.MessageFlags.IS_COMPONENTS_V2
        });
      } else if (dmChannel) {
        dmChannel.createMessage({
          components: [
            {
              type: Constants.ComponentTypes.CONTAINER,
              components: [
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: "# You don't have permission for this action",
                },
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: `## Permissions needed:\n\`${permissions.map((p) => p.name).join("`, `")}\``
                },
                {
                  type: Constants.ComponentTypes.TEXT_DISPLAY,
                  content: "### Contact a server administrator if you think this is a mistake."
                }
              ]
            }
          ],
          flags: Constants.MessageFlags.IS_COMPONENTS_V2
        });
      }
        

      return false;
    }
    else return true;
  }

  readonly moduleData = {
    version: this.version,
    guildID: this.bot.constants.config.guildID,
    permissions: [],
    disabledModules: []
  }

}