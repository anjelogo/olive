export default [
  {
    name: "logging.*",
    description: "Grants access to all Logging module components/commands",
    default: false
  }, {
    name: "logging.channel.modify",
    description: "Grants the ability to create logging channels",
    default: false
  }, {
    name: "logging.channel.delete",
    description: "Grants the ability to delete logging channels",
    default: false
  }
];