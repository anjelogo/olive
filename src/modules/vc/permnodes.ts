export default [
  {
    name: "vc.*",
    description: "Grants access to all Private VC module components/commands",
    default: false
  }, {
    name: "vc.view",
    description: "Grants the ability to view and use the voicechannel command",
    default: true
  }, {
    name: "vc.create",
    description: "Grants the ability to create private voice channels",
    default: true
  }, {
    name: "vc.join",
    description: "Grants the ability to join private voice channels",
    default: true
  }, {
    name: "vc.lock",
    description: "Grants the ability to lock private voice channels",
    default: true
  }, {
    name: "vc.unlock",
    description: "Grants the ability to unlock private voice channels",
    default: true
  }, {
    name: "vc.edit",
    description: "Grants the ability to edit/set private voice channel values",
    default: true
  }, {
    name: "vc.edit.owner",
    description: "Grants the ability to edit/set private voice channel owners",
    default: true
  }, {
    name: "vc.edit.name",
    description: "Grants the ability to edit/set private voice channel names",
    default: true
  }, {
    name: "vc.edit.category",
    description: "Grants the ability to edit/set private voice channel categories",
    default: false
  }
];