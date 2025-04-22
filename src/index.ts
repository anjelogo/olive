import { Auth } from "./resources/auth";
import ExtendedClient from "./Base/Client";

const client = new ExtendedClient({
	defaultImageFormat: "png",
	defaultImageSize: 1024,
	disabledModules: [],
	auth: `Bot ${Auth.token}`,
	gateway: {
		getAllUsers:	true,
		intents: 14063,
	}
});

client.init();