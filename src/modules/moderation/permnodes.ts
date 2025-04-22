export default [
	{
		name: "moderation.*",
		description: "Grants access to all Moderation module components/commands",
		default: false
	}, {
		name: "moderation.punish.*",
		description: "Grants the ability to punish members",
		default: false
	}, {
		name: "moderation.punish.ban",
		description: "Grants the ability to ban members",
		default: false
	}, {
		name: "moderation.punish.unban",
		description: "Grants the ability to unban members",
		default: false
	}, {
		name: "moderation.punish.kick",
		description: "Grants the ability to kick members",
		default: false
	}, {
		name: "moderation.punish.timeout",
		description: "Grants the ability to timeout members",
		default: false
	}, {
		name: "moderation.punish.mute",
		description: "Grants the ability to mute members",
		default: false
	}, {
		name: "moderation.punish.resolve",
		description: "Grants the ability to resolve punishments",
		default: false
	}, {
		name: "moderation.punish.excempt",
		description: "Grants the ability to be excempt from punishments (Bot Punishments Only)",
		default: false
	}, {
		name: "moderation.history.*",
		description: "Grants the ability to all moderation history abilities",
		default: false
	}, {
		name: "moderation.history.view",
		description: "Grants the ability to view the moderation history of a member",
		default: false
	}, {
		name: "moderation.history.clear",
		description: "Grants the ability to clear the moderation history of a member",
		default: false
	}, {
		name: "moderation.case.*",
		description: "Grants the ability to view the moderation case of a member",
		default: false
	}, {
		name: "moderation.case.view",
		description: "Grants the ability to view the moderation case of a member",
		default: false
	}, {
		name: "moderation.case.delete",
		description: "Grants the ability to delete the moderation case of a member",
		default: false
	}, {
		name: "moderation.case.resolve",
		description: "Grants the ability to delete the moderation case of a member",
		default: false
	}, {
		name: "moderation.settings.view",
		description: "Grants the ability to view the moderation settings of a guild",
		default: false
	}, {
		name: "moderation.settings.edit",
		description: "Grants the ability to edit the moderation settings of a guild",
		default: false
	}
];