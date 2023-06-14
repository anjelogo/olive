import { Auth } from "./resources/auth";
import Bot from "./main";

const bot = new Bot({
	defaultImageFormat: "png",
	defaultImageSize: 1024,
	disabledModules: [],
	auth: `Bot ${Auth.token}`,
	gateway: {
		getAllUsers:	true,
		intents: 14063,
	}
});

bot.init();