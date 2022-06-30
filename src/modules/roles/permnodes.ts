export default [
	{
		name: "roles.*",
		description: "Grants the access to all Roles module components/commands",
		default: false
	}, {
		name: "roles.reaction.modify",
		description: "Grants the ability to edit Reaction Role Messages",
		default: false
	}, {
		name: "roles.reaction.interact",
		description: "Grants the ability to interact (Add and remove roles) with Reaction Role Messages",
		default: true
	}, {
		name: "roles.list.edit",
		description: "Grants the ability to edit the list of public roles that users can get",
		default: false
	}, {
		name: "roles.add.self",
		description: "Grants the ability to add roles to self from the public roles list",
		default: true
	}, {
		name: "roles.add.self.*",
		description: "Grants the ability to add any role to self",
		default: false
	}, {
		name: "roles.remove.self",
		description: "Grants the ability to remove roles from self from the public roles list",
		default: true
	}, {
		name: "roles.remove.self.*",
		description: "Grants the ability to remove any role from self",
		default: false
	}, {
		name: "roles.add.others",
		description: "Grants the ability to add any roles to others",
		default: false
	}, {
		name: "roles.autorole.edit",
		description: "Grants the ability to edit autoRoles",
		default: false
	}, {
		name: "roles.autorole.get",
		description: "Grants the ability to get autoroles",
		default: false
	}
];