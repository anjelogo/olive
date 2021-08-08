import { Member, Embed, User, Message, Emoji } from "eris";

export interface Interaction {
	id: string;
	application_id: string;
	type: number;
	token: string;
	data?: ApplicationCommandData;
	guild_id?: string;
	channel_id?: string;
	member?: Member;
	user?: User;
	message?: Message;
}

export interface ApplicationCommandData {
	id: string;
	name: string;
	options: ApplicationCommandOption[];
}

export interface ApplicationCommandOption {
	name: string;
	type: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)
	value?: unknown;
	options?: ApplicationCommandOption[]
}

export interface InteractionResponse {
	content?: string | null;
	embeds?: Embed[];
	components?: ApplicationComponents[];
	hidden?: boolean;
	flags?: number;
}

export interface ApplicationInteractionCallback {
	type: number;
	data: {
		content?: string | null;
		embeds?: Embed[];
		components?: ApplicationComponents[];
		flags?: number;
	}
}

export interface ApplicationComponents {
	type: (1 | 2 | 3);
	style?: (1 | 2 | 3 | 4 | 5);
	label?: string;
	emoji?: Emoji;
	custom_id?: string;
	url?: string;
	disabled?: boolean;
	components?: (ApplicationComponents | SelectMenuStructure)[];
}

export interface SelectMenuStructure extends ApplicationComponents {
	options: SelectOptionStructure[]
	placeholder?: string;
	min_values?: number;
	max_values?: number;
	disabled?: boolean;
}

export interface SelectOptionStructure {
	label: string;
	value: string;
	description?: string;
	emoji?: Partial<Emoji>;
	default?: boolean;
}

export interface ApplicationCommand {
	name: string;
	description: string;
	options?: ApplicationCommandOptionStructure[];
	default_permission?: boolean;
}

export interface ApplicationCommandOptionStructure {
	type: number;
	name: string;
	description: string;
	required?: boolean;
	choices?: ApplicationCommandOptionChoice[];
	options?: ApplicationCommandOptionStructure[];
}

export interface ApplicationCommandOptionChoice {
	name: string;
	value: string | number;
}