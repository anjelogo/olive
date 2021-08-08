import ApplicationCommandManager from "./ApplicationCommandManager";
import Bot from "../../main";

export default class ComponentManager {

	readonly bot: Bot;
	readonly id: string;
	readonly token: string;
	readonly name: string;
	readonly root: ApplicationCommandManager;
	readonly value: string;
	readonly values: string[];

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
	constructor(interaction: ApplicationCommandManager, payload: any) {
		this.bot = interaction.bot;
		this.id = payload.id;
		this.token = payload.token;
		this.name = payload.data.custom_id;
		this.root = interaction;
		this.value = payload.data.value;
		this.values = payload.data.values;
	}

	readonly defer = async (): Promise<ComponentManager> => {
		const callbackResponse = {
			type: 5, //https://discord.com/developers/docs/interactions/slash-commands#interaction-response-object-interaction-callback-type
		};

		try {
			await this.bot.requestHandler.request("POST", `/interactions/${this.id}/${this.token}/callback`, true, callbackResponse as unknown as { [s: string]: unknown; });

			return this;
		} catch (e) {
			throw console.error(e);
		}
	}

	readonly ack = async (): Promise<ComponentManager> => {
		const callbackResponse = {
			type: 6, //https://discord.com/developers/docs/interactions/slash-commands#interaction-response-object-interaction-callback-type
		};

		try {
			await this.bot.requestHandler.request("POST", `/interactions/${this.id}/${this.token}/callback`, true, callbackResponse as unknown as { [s: string]: unknown; });

			return this;
		} catch (e) {
			throw console.error(e);
		}
	}

	readonly update = async (): Promise<ComponentManager> => {
		const callbackResponse = {
			type: 7, //https://discord.com/developers/docs/interactions/slash-commands#interaction-response-object-interaction-callback-type
		};

		try {
			await this.bot.requestHandler.request("POST", `/interactions/${this.id}/${this.token}/callback`, true, callbackResponse as unknown as { [s: string]: unknown; });

			return this;
		} catch (e) {
			throw console.error(e);
		}
	}

}