import { Guild, Member, Role } from "eris";
import Bot from "../../main";
import Roles, { moduleData, RolesMessage } from "./main";

export default class Checks {

	readonly bot: Bot;
	readonly module: Roles

	constructor(bot: Bot, Module: Roles) {
		this.bot = bot;
		this.module = Module;
	}

	readonly run = async (): Promise<string> => {

		const data: moduleData[] = (await this.bot.getAllData(this.module.name) as unknown) as moduleData[],
			promises = [];

		let deletedGuilds = 0,
			deletedMessages = 0,
			deletedRoles = 0,
			failed = 0;

		async function deleteGuild(checks: Checks, guild: string) {
			if (!guild) return;
	
			try {
				await checks.bot.db.get(checks.module.name).findOneAndDelete({ guildID: guild});
				deletedGuilds++;
			} catch (e) {
				failed++;
			}
		}

		async function deleteMessage(checks: Checks, guildData: moduleData, msg: string) {
			if (!guildData) return;

			const i = guildData.messages.findIndex((m) => m.id === msg);
			if (i > -1) guildData.messages.splice(i, 1);

			try {
				await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
				deletedMessages++;
			} catch (e) {
				failed++;
			}
		}

		async function deleteRole(checks: Checks, guildData: moduleData, msgData: RolesMessage, role: string) {
			if (!guildData || !msgData)
				return;

			const i = msgData.roles.findIndex((r) => r.role === role);
			if (i > -1) msgData.roles.splice(i, 1);

			try {
				await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
				deletedRoles++;
			} catch (e) {
				failed++;
			}
		}

		async function deleteRoleFromList(checks: Checks, guildData: moduleData, role: string) {
			if (!guildData) return;

			const i = guildData.roles.indexOf(role);
			if (i > -1) guildData.roles.splice(i, 1);

			try {
				await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
				deletedRoles++;
			} catch (e) {
				failed++;
			}
		}

		async function deleteAutoRole(checks: Checks, guildData: moduleData, role: string) {
			if (!guildData) return;

			const i = guildData.autoRoles.indexOf(role);
			if (i > -1) guildData.autoRoles.splice(i, 1);

			try {
				await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
				deletedRoles++;
			} catch (e) {
				failed++;
			}
		}

		if (data.length) {
			for (const guildData of data) {
				const guild: Guild = this.bot.findGuild(guildData.guildID) as Guild;

				if (!guild) {
					promises.push(await deleteGuild(this, guildData.guildID));
					continue;
				}

				//Reaction Roles
				if (guildData.messages.length) {

					for (const msgData of guildData.messages) {
						const msg = await this.bot.getMessage(msgData.channelID, msgData.id)
							.catch(async () => {
								promises.push(await deleteMessage(this, guildData, msgData.id));
							});

						if (!msg || (msg && !msgData.roles.length)) {
							promises.push(await deleteMessage(this, guildData, msgData.id));
							continue;
						}

						for (const roleData of msgData.roles) {
							const role: Role = this.bot.findRole(guild, roleData.role) as Role;

							if (!role) {
								promises.push(await deleteRole(this, guildData, msgData, roleData.role));
								continue;
							}
						}
					}

				}

				//Roles List
				for (const roleID of guildData.roles) {
					const role: Role = this.bot.findRole(guild, roleID) as Role,
						botMember: Member = this.bot.findMember(guild, this.bot.user.id) as Member,
						botHighestRoleID = botMember.roles
							.map((r) => 
								({
									name: (this.bot.findRole(guild, r) as Role).name,
									position: (this.bot.findRole(guild, r) as Role).position
								}))
							.sort((a, b) => b.position - a.position).map((r) => r.name),
						botHighestRole: Role = this.bot.findRole(guild, botHighestRoleID[0]) as Role;

					if (!role || (role && botHighestRole && (role.position > botHighestRole.position))) {
						promises.push(deleteRoleFromList(this, guildData, roleID));
						continue;
					}
				}

				//Auto Roles
				for (const roleID of guildData.autoRoles) {
					const role: Role = this.bot.findRole(guild, roleID) as Role,
						botMember: Member = this.bot.findMember(guild, this.bot.user.id) as Member,
						botHighestRoleID = botMember.roles
							.map((r) => 
								({
									name: (this.bot.findRole(guild, r) as Role).name,
									position: (this.bot.findRole(guild, r) as Role).position
								}))
							.sort((a, b) => b.position - a.position).map((r) => r.name),
						botHighestRole: Role = this.bot.findRole(guild, botHighestRoleID[0]) as Role;
				
					if (!role || (role && botHighestRole && (role.position > botHighestRole.position))) {
						promises.push(deleteAutoRole(this, guildData, roleID));
						continue;
					}
				}
			}
		}

		await Promise.all(promises);

		return `${deletedGuilds} Guilds Deleted. ${deletedMessages} Messages Deleted. ${deletedRoles} Roles Deleted. ${failed} Failed Operations.`;

	}

	readonly checkVersion = async (newVersion: string): Promise<string> => {
		const data: moduleData[] = (await this.bot.getAllData(this.module.name) as unknown) as moduleData[];

		let promises = [];

		if (data.length) {
			for (const guildData of data) {
				if (guildData.version === this.module.version) continue;

				switch (guildData.version) {

					case "1.0": {
						//Migrates from 1.0 to 1.1
			
						for (const guildData of data) {
							if (guildData.version === newVersion) continue;
			
							const oldDataStruct = {
									guildID: guildData.guildID,
									roles: guildData.roles,
									autoRoles: guildData.autoRoles,
									messages: guildData.messages
								},
								newDataStruct = {
									version: newVersion,
									guildID: oldDataStruct.guildID,
									roles: guildData.roles,
									autoRoles: guildData.autoRoles,
									messages: guildData.messages,
									savedRoles: {
										enabled: false,
										roles: []
									}
								}
			
							promises.push(await this.bot.updateModuleData(this.module.name, newDataStruct, guildData.guildID));
							break;
						}
					}
				}
			}
		}

		await Promise.all(promises);

		return `${data.length} Guild(s) Versions Migrated.`;
	}

}