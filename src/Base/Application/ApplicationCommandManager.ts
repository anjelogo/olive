import { Guild, Member, TextChannel } from "eris";
import { Interaction, InteractionResponse, ApplicationInteractionCallback, ApplicationCommandOption } from "./types";
import Bot from "../../main";
import FollowupManager from "./FollowupManager";

export default class ApplicationCommandManager {

	public data: unknown;
	public options: ApplicationCommandOption[] | null

	public readonly token: string;
	public readonly id: string;
	public readonly name: string;
	public readonly bot: Bot;
	public readonly followups: FollowupManager[];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private readonly _member: any | null;
	private readonly guildID: string | undefined;
	private readonly channelID: string | undefined;
	private editable: boolean;

	constructor(bot: Bot, interaction: Interaction) {
		this.token = interaction.token;
		this.id = interaction.id;
		this.name = (interaction.data && interaction.data.name) as string ?? null;
		this.options = (interaction.data && interaction.data.options) ?? null;
		this.bot = bot;
		this.guildID = interaction.guild_id;
		this.channelID = interaction.channel_id;
		this._member = interaction.member ?? null;
		this.editable = false;
		this.followups = [];
	}

	get guild(): Guild | undefined {
		const id = this.guildID,
			guild = this.bot.findGuild(id);

		return guild;
	}

	get channel(): TextChannel | undefined {
		if (!this.guild) return undefined;

		const id = this.channelID,
			channel = this.bot.findChannel(this.guild, id);

		if (!channel) return undefined;

		return channel as TextChannel;
	}

	get member(): Member | undefined {
		if (!this.guild) return undefined;

		const member = this.bot.findMember(this.guild, this._member.user.id);

		return member;
	}

	readonly getOption = (option: string): ApplicationCommandOption | undefined => {
		if (!this.options) return undefined;

		const result = this.options.find((o) => o.name === option);

		return result;
	}

	readonly defer = async (options?: { type: number }): Promise<FollowupManager | ApplicationCommandManager> => {
		const callbackResponse = {
			type: (options && options.type) ? options.type : 5, //https://discord.com/developers/docs/interactions/slash-commands#interaction-response-object-interaction-callback-type
		};

		try {
			if (this.editable)
				await this.bot.requestHandler.request("PATCH", `/webhooks/${this.bot.user.id}/${this.token}/messages/@original`, true, callbackResponse as unknown as { [s: string]: unknown; });
			else
				await this.bot.requestHandler.request("POST", `/interactions/${this.id}/${this.token}/callback`, true, callbackResponse as unknown as { [s: string]: unknown; });

			this.editable = true;
			if (!this.bot.interactions.map((i) => i.token).includes(this.token)) this.bot.interactions.push(this);

			return this;
		} catch (e) {
			throw console.error(e);
		}
	}

	readonly reply = async (input: InteractionResponse | string, options?: InteractionResponse): Promise<FollowupManager | ApplicationCommandManager> => {
		let obj: InteractionResponse = {};

		if (typeof input === "string") {
			obj.content = input;
		} else {
			obj = input;
		}

		if (options) {
			obj.embeds = options.embeds;
			obj.components = options.components;
			obj.hidden = options.hidden;
		}

		if (this.editable) return await this.edit(obj);

		const callbackResponse: ApplicationInteractionCallback = {
			type: 4, //https://discord.com/developers/docs/interactions/slash-commands#interaction-response-object-interaction-callback-type
			data: {
				content: obj.content
			}
		};

		if (obj.embeds) callbackResponse.data.embeds = obj.embeds;
		if (obj.components) callbackResponse.data.components = obj.components;
		if (obj.hidden) callbackResponse.data.flags = 1 << 6; //Hides Initial Reaction to user only

		try {
			await this.bot.requestHandler.request("POST", `/interactions/${this.id}/${this.token}/callback`, true, callbackResponse as unknown as { [s: string]: unknown; });

			this.editable = true;
			if (!this.bot.interactions.map((i) => i.token).includes(this.token)) this.bot.interactions.push(this);

			return this;
		} catch (e) {
			throw console.error(e);
		}
	};

	readonly deny = async (input: InteractionResponse | string, options?: InteractionResponse): Promise<FollowupManager | ApplicationCommandManager> => {
		let obj: InteractionResponse = {};

		if (typeof input === "string") {
			obj.content = `${this.bot.constants.emojis.x} ${input}`;
		} else {
			obj = input;
		}

		if (options) {
			obj.embeds = options.embeds;
			obj.components = options.components;
			obj.hidden = true;
		}

		return await this.reply(obj);
	};

	readonly edit = async (input: InteractionResponse | string, options?: InteractionResponse): Promise<FollowupManager | ApplicationCommandManager> => {
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

		if (!this.editable) return this.reply(input);

		const callbackResponse: InteractionResponse = {
			content: obj.content
		};

		if (obj.embeds) callbackResponse.embeds = obj.embeds;
		if (obj.components) callbackResponse.components = obj.components;

		try {
			await this.bot.requestHandler.request("PATCH", `/webhooks/${this.bot.user.id}/${this.token}/messages/@original`, true, callbackResponse as unknown as { [s: string]: unknown; });

			if (!this.bot.interactions.map((i) => i.token).includes(this.token)) this.bot.interactions.push(this);

			return this;
		} catch (e) {
			throw console.error(e);
		}
	};

	readonly followup = async (input: InteractionResponse | string, options?: InteractionResponse): Promise<FollowupManager> => {
		let obj: InteractionResponse = {};

		if (typeof input === "string") {
			obj.content = input;
		} else {
			obj = input;
		}

		if (options) {
			obj.embeds = options.embeds;
			obj.components = options.components;
			obj.hidden = options.hidden;
		}

		if (!this.editable) throw new Error("Cannot followup to this message!");

		const callbackResponse: InteractionResponse = {
			content: obj.content
		};

		if (obj.embeds) callbackResponse.embeds = obj.embeds;
		if (obj.components) callbackResponse.components = obj.components;
		if (obj.hidden) callbackResponse.flags = 64;

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const res: any = await this.bot.requestHandler.request("POST", `/webhooks/${this.bot.user.id}/${this.token}`, true, callbackResponse as unknown as { [s: string]: unknown; });

			const data = {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				id: (await (res.json() as unknown) as any).id,
				token: this.token
			};

			if (!this.bot.interactions.map((i) => i.token).includes(this.token)) this.bot.interactions.push(this);
			const followup = new FollowupManager(this.bot, data);

			this.followups.push(followup);
			return followup;
		} catch (e) {
			throw console.error(e);
		}
	};

	readonly delete = (): void => {
		if (!this.editable) return;

		if (!this.bot.interactions.map((i) => i.token).includes(this.token)) this.bot.interactions.push(this);

		try {
			this.bot.requestHandler.request("POST", `/webhooks/${this.bot.user.id}/${this.token}/messages/@original`, true);
		} catch (e) {
			throw console.error(e);
		}
	}

}