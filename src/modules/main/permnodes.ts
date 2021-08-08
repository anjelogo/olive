export default [
	{
		name: "*",
		description: "Grants access to all module components/commands regardless of negated permissions",
		default: false
	}, {
		name: "main.*",
		description: "Grants access to all main module components/commands",
		default: false
	}, {
		name: "main.ping",
		description: "Grants access to the Ping Command",
		default: true
	}, {
		name: "main.help",
		description: "Grants access to the Help Command",
		default: true
	}, {
		name: "main.permnode.*",
		description: "Grants access to all permnode features",
		default: false
	}, {
		name: "main.permnode.edit",
		description: "Grants access to set and edit permnodes",
		default: false
	}, {
		name: "main.permnode.view",
		description: "Grants access to view permnodes",
		default: false
	}, {
		name: "main.permnode.remove",
		description: "Grants access to remove permnodes",
		default: false
	}, {
		name: "main.permnode.list",
		description: "Grants access to list permnodes",
		default: false
	}
];