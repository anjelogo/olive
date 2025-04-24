/* eslint-disable @typescript-eslint/no-var-requires */
import { Constants } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Module from "../../../Base/Module";

export const run = async (bot: ExtendedClient): Promise<void> => {

	//Load Status
	bot.editStatus("online", [{
    name: bot.constants.config.status.text,
    type: Constants.ActivityTypes.STREAMING,
    url: "https://twitch.tv/anjelogo"
  }]);

	//TODO: fix subcommands for everything ig

	bot.modules.forEach(async (m: Module) => {
		if (m.db) {

			bot.constants.utils.log(m.name, "DB found, performing checks...");
			const checks = new (require(`../../../${m.path}/checks`).default)(bot, m),
				res1 = await checks.checkVersion(m.version),
				res2 = await checks.run();
			
			bot.constants.utils.log(m.name, `Checks completed, ${res2}${res1 ? ` ${res1}` : ""}`);
		}
	});

	bot.constants.utils.log("Main", "Ready!");

};