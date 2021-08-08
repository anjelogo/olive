import { Auth } from "./resources/auth";
import Bot from "./main";

const bot = new Bot(Auth.token, {
	getAllUsers: true,
	defaultImageFormat: "png",
	defaultImageSize: 1024,
	intents: 14063,
	disabledModules: []
});

bot.init();