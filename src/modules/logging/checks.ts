import { TextChannel } from "oceanic.js";
import Module from "../../Base/Module";
import Bot from "../../main";
import Logging, { moduleData } from "./main";

export default class Checks {

	readonly bot: Bot;
	readonly module: Module;

	constructor (bot: Bot, Module: Logging) {
		this.bot = bot;
		this.module = Module;
	}

	readonly run = async (): Promise<string> => {
		const data: moduleData[] = (await this.bot.getAllData(this.module.name) as unknown) as moduleData[],
			promises = [];

		let deletedGuilds = 0,
            deletedChannels = 0,
			deletedCases = 0,
			deletedStars = 0,
			failed = 0;

		async function deleteGuild(checks: Checks, guild: string) {
			if (!guild) return;

			try {
				await checks.bot.db.get(checks.module.name).findOneAndDelete({ guildID: guild });
				deletedGuilds++;
			} catch (e) {
				failed++;
			}
		}

        async function deleteChannel(checks: Checks, guildData: moduleData, channel: string) {
            if (!channel) return;

            const i = guildData.channels.findIndex((c) => c.channelID === channel);
            if (i > -1) guildData.channels.splice(i, 1);

            try {
                await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
                deletedChannels++;
            } catch (e) {
                failed++
            }
        }

		async function deleteCaseMessage(checks: Checks, guildData: moduleData, channelID: string, messageID: string) {
			if (!messageID) return;

			const i = guildData.channels.find((c) => c.channelID === channelID)!!.cases!!.findIndex((c) => c.messageID === messageID);
			if (i > -1) guildData.channels.find((c) => c.channelID === channelID)!!.cases!!.splice(i, 1);

			try {
				await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
				deletedCases++;
			} catch (e) {
				failed++;
			}
		}

		async function deleteStarMessage(checks: Checks, guildData: moduleData, channelID: string, messageID: string) {
			if (!messageID) return;

			const i = guildData.channels.find((c) => c.channelID === channelID)!!.stars!!.findIndex((c) => c.messageID === messageID);
			if (i > -1) guildData.channels.find((c) => c.channelID === channelID)!!.stars!!.splice(i, 1);

			try {
				await checks.bot.updateModuleData(checks.module.name, guildData, guildData.guildID);
				deletedStars++;
			} catch (e) {
				failed++;
			}
		}

		if (data.length) {
			for (const guildData of data) {

				const guild = this.bot.findGuild(guildData.guildID);

				if (!guild) {
					promises.push(await deleteGuild(this, guildData.guildID));
					continue;
				}

                for (const channel of guildData.channels) {

                    const channelObj = this.bot.findChannel(guild, channel.channelID) as TextChannel;
                    if (!channelObj) {
                        promises.push(await deleteChannel(this, guildData, channel.channelID));
                    }

					if (channel.cases) {
						for (const caseData of channel.cases) {
							const caseMessage = this.bot.findMessage(channelObj, caseData.messageID);

							if (!caseMessage) {
								promises.push(await deleteCaseMessage(this, guildData, channel.channelID, caseData.messageID));
								break;
							}
						}
					}

					if (channel.stars) {
						for (const starData of channel.stars) {
							const starMessage = this.bot.findMessage(channelObj, starData.messageID);

							if (!starMessage) {
								promises.push(await deleteStarMessage(this, guildData, channel.channelID, starData.messageID));
								break;
							}
						}
					}

                }
			}
		}

		await Promise.all(promises);

		return `${deletedGuilds} Guild(s) Deleted. ${deletedChannels} Channel(s) Deleted. ${deletedCases} Case(s) Deleted. ${deletedStars} Star(s) Deleted. ${failed} Failed Operation(s).`;

	}
	
	readonly checkVersion = async (newVersion: string): Promise<string> => {
		const data: moduleData[] = (await this.bot.getAllData(this.module.name) as unknown) as moduleData[];

		let promises = [];

		if (data.length) {
			for (const guildData of data) {
				if (guildData.version === this.module.version) continue;

				switch (guildData.version) {

					case undefined:
					case "1.0": {
						//Migrates from 1.0 to 1.1
						if (guildData.version === newVersion) continue;
			
						const oldDataStruct = {
								guildID: guildData.guildID,
								channels: guildData.channels
							},
							newDataStruct = {
								version: newVersion,
								guildID: oldDataStruct.guildID,
								channels: oldDataStruct.channels
							}
			
						promises.push(await this.bot.updateModuleData(this.module.name, newDataStruct, guildData.guildID));
						break;
					}
				}
			}
		}

		await Promise.all(promises);

		return `${promises.length} Guild(s) Versions Migrated.`;
	}

}