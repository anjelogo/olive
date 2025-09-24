import { CommandInteraction, Constants, Embed, Member, PrivateChannel, User } from "oceanic.js";
import { Permnodes } from "../../resources/interfaces";
import Module from "../../Base/Module";
import ExtendedClient from "../../Base/Client";
import { MainModuleData } from "../../Database/interfaces/MainModuleData";
import { getGuildMember, getGuildRoles } from "../../shared/discordRest";

export interface helpEmbed {
  content: string;
  embed: Embed;
}

export default class Main extends Module<"guild"> {

  readonly name = "Main";
  readonly version: string;
  readonly path: string;
  readonly weight: number;
  readonly db: boolean;

  constructor (bot: ExtendedClient) {
    super(bot);

    this.version = "1.2";
    this.path = "modules/main";
    this.weight = 0; //Load this module before everything
    this.db = true; //Uses database

  }

  readonly getPerms = async (member: Member | undefined): Promise<string[] | null> => {
    if (!member) return null;

  const moduleData = await this.bot.getModuleData("Main", { guildID: member.guild.id }) as MainModuleData,
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
  };

  readonly hasPerm = async (user: User | Member | null, perm: string, guildID?: string): Promise<boolean> => {
    if (!user || !perm) return false;

    let member: Member | null = null;

    if (user instanceof Member) {
      member = user;
    } else if (guildID && user && "id" in user) {
      const guild = this.bot.findGuild(guildID);

      if (guild) {
        member = guild.members.get(user.id) || null;
      }
    }

    const masterPerm = `${perm.split(/[.\-_]/)[0]}.*`;
    const permission = this.bot.perms.find((p: Permnodes) => p.name === perm);
    if (!permission) return false;

    const guildIdToUse = member ? member.guild.id : guildID;
    if (!guildIdToUse) return false;

    const moduleData = await this.bot.getModuleData("Main", { guildID: guildIdToUse }) as MainModuleData;
    const storedPerms = moduleData?.permissions ?? [];

    // If we have a cached member, reuse existing logic fast path
    if (member) {
      if (member.permissions.has("ADMINISTRATOR")) return true;
      const perms = [...new Set(await this.getPerms(member))];
      return [masterPerm, perm, "*"].some((p) => (perms ?? []).includes(p));
    }

    // REST fallback: fetch member roles and guild roles to evaluate ADMINISTRATOR and role-driven permnodes
    if (!(user as User).id) return false;
    const userID = (user as User).id;

    const memberData = await getGuildMember(guildIdToUse, userID);
    if (!memberData) return false; // not in guild

    // Compute ADMINISTRATOR from role permissions
    try {
      const roles = await getGuildRoles(guildIdToUse);
      const roleMap = new Map<string, string>(
        roles.map((r: { id: string; permissions: string }) => [r.id, r.permissions] as [string, string])
      );
      const ADMIN = 0x00000008n;
      const hasAdmin = memberData.roles.some((rid: string) => {
        const permsStr = roleMap.get(rid);
        if (!permsStr) return false;
        const bits = BigInt(permsStr);
        return (bits & ADMIN) === ADMIN;
      });
      if (hasAdmin) return true;
    } catch (e) {
      // If role fetch fails, proceed without admin shortcut
    }

    // Build effective permnode names based on defaults, user grants, and role grants from storedPerms
    const defaults = this.bot.perms.filter((p) => p.default).map((p) => p.name);
    const effective: Set<string> = new Set(defaults);

    // user-level grants
    const userEntry = storedPerms.find((p) => p.userID === userID);
    if (userEntry) {
      for (const p of userEntry.permissions) if (p.value) effective.add(p.permission);
    }
    // role-level grants
    for (const rid of memberData.roles) {
      const roleEntry = storedPerms.find((p) => p.roleID === rid);
      if (roleEntry) for (const p of roleEntry.permissions) if (p.value) effective.add(p.permission);
    }

    return [masterPerm, perm, "*"].some((p) => effective.has(p));
  };

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
  };

  readonly moduleData: MainModuleData = {
    enabled: true,
    version: this.version,
    guildID: this.bot.constants.config.guildID,
    permissions: [],
    disabledModules: []
  };

}