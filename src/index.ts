import ExtendedClient from "./Base/Client";

const client = new ExtendedClient({
	defaultImageFormat: "png",
	defaultImageSize: 1024,
	disabledModules: [],
	auth: `Bot ${process.env.TOKEN}`,
	gateway: {
		getAllUsers:	true,
		intents: 14063,
	}
});

client.init();