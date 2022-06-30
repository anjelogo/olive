import Module from "../../Base/Module";
import Bot from "../../main";
import Main, { moduleData } from "./main";

export default class Checks {

	readonly bot: Bot;
	readonly module: Module;

	constructor (bot: Bot, Module: Main) {
		this.bot = bot;
		this.module = Module;
	}

	readonly run = async (): Promise<string> => {
		const data: moduleData[] = (await this.bot.getAllData(this.module.name) as unknown) as moduleData[],
			promises = [];

		let deletedGuilds = 0,
            deletedChannels = 0,
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

		if (data.length) {
			for (const guildData of data) {

				const guild = this.bot.findGuild(guildData.guildID);

				if (!guild) {
					promises.push(await deleteGuild(this, guildData.guildID));
					continue;
				}

                for (const channel of guildData.channels) {

                    const channelObj = this.bot.findChannel(guild, channel.channelID);
                    if (!channelObj) {
                        promises.push(await deleteChannel(this, guildData, channel.channelID));
                    }

                }
			}
		}

		await Promise.all(promises);

		return `${deletedGuilds} Guild(s) Deleted. ${deletedChannels} Channel(s) Deleted. ${failed} Failed Operation(s).`;

	}

}