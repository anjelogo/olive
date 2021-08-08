import ApplicationCommandManager from "../../../Base/Application/ApplicationCommandManager";
import { RawPacket } from "eris";
import Bot from "../../../main";
import { commandHandler, updateHandler } from "../internals/handler";
import ComponentManager from "../../../Base/Application/ComponentManger";

export const run = async (bot: Bot, event: RawPacket): Promise<void> => {
	if (event.t !== "INTERACTION_CREATE") return;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = event.d as any;

	if (data.type === 2) {
		const interaction = new ApplicationCommandManager(bot, data);
		await commandHandler(bot, interaction);
	}

	if (data.type === 3) {
		const interaction = bot.interactions.find((i) => i.id === data.message.interaction.id);
		if (!interaction) return;

		const component = new ComponentManager(interaction, data);

		await updateHandler(bot, component, data.member.user.id);
	}
};