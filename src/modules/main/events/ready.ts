/* eslint-disable @typescript-eslint/no-var-requires */
import Bot from "../../../main";
import Module from "../../../Base/Module";

export const run = async (bot: Bot): Promise<void> => {

	//Load Status
	bot.editStatus(bot.constants.config.status);

	//TODO: fix subcommands for everything ig

	bot.modules.forEach(async (m: Module) => {
		if (m.db) {

			bot.constants.utils.log(m.name, "DB found, performing checks...");
			const checks = new (require(`../../../${m.path}/checks`).default)(bot, m),
				res = await checks.run(),
				res2 = await checks.checkVersion(m.version);
			bot.constants.utils.log(m.name, `Checks completed, ${res}${res2 ? ` ${res2}` : ""}`);
		}
	});

	bot.constants.utils.log("Main", "Ready!");

};