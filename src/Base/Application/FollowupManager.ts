import Bot from "../../main";
import { InteractionResponse } from "./types";
import ApplicationCommandManager from "./ApplicationCommandManager";

export default class FollowupManager {

	readonly id: string;
	readonly token: string;
	readonly bot: Bot;

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
	constructor(bot: Bot, payload: any) {
		this.id = payload.id;
		this.token = payload.token;
		this.bot = bot;
	}

	get root(): ApplicationCommandManager | undefined {
		const followups = this.bot.interactions.map((i) => ({ id: i.id, followups: i.followups.map((fl) => fl.id) })),
			iid = followups.find((fl) => fl.followups.includes(this.id));

		if (!iid) return;

		return this.bot.interactions.find((i) => i.id === iid.id);
	}

	readonly delete = async (): Promise<void> => {
		try {
			await this.bot.requestHandler.request("POST", `/webhooks/${this.bot.user.id}/${this.token}/messages/${this.id}`, true);
		} catch (e) {
			throw console.error(e);
		}

	}

	readonly edit = async (input: InteractionResponse | string, options?: InteractionResponse): Promise<FollowupManager> => {
		let obj: InteractionResponse = {};

		if (typeof input === "string") {
			obj.content = input;
		} else {
			obj = input;
		}

		if (options) {
			obj.embeds = options.embeds;
			obj.components = options.components;
		}

		const callbackResponse: InteractionResponse = {
			content: obj.content
		};

		if (obj.embeds) callbackResponse.embeds = obj.embeds;
		if (obj.components) callbackResponse.components = obj.components;

		try {
			await this.bot.requestHandler.request("POST", `/webhooks/${this.bot.user.id}/${this.token}/messages/${this.id}`, true, callbackResponse as unknown as { [s: string]: unknown; });

			return this;
		} catch (e) {
			throw console.error(e);
		}

	}

}