import { CommandInteraction, ComponentInteraction, Constants, ContainerComponent, Embed, EmbedField, Message, MessageActionRow, MessageComponentSelectMenuInteractionData, TextDisplayComponent } from "oceanic.js";
import Command from "../../../../Base/Command";
import Module from "../../../../Base/Module";
import ExtendedClient from "../../../../Base/Client";
import { Permnodes } from "../../../../resources/interfaces";
import { FollowupMessageInteractionResponse, InitialMessagedInteractionResponse } from "oceanic.js/dist/lib/util/interactions/MessageInteractionResponse";

export default class Help extends Command {
	
	constructor(bot: ExtendedClient) {

		super(bot);

		this.commands = ["help"];
		this.description = "View information about the bot";
		this.example = "help";
		this.permissions = ["main.help"];

	}

  private createContainer = (bot: ExtendedClient, interaction: (CommandInteraction | ComponentInteraction), actionRow: MessageActionRow[]) => {
    const container: ContainerComponent = {
      type: Constants.ComponentTypes.CONTAINER,
      components: [
        {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `# ${bot.user.username} 🌴`
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `**${bot.user.username}** is a multi-purpose bot that includes a variety of modules to help your community thrive! Get start by viewing a list of commands by clicking on the button below!`
        },
        ...actionRow
      ]
    }
    return container;
  }

  private actionRow = async (bot: ExtendedClient, interaction: (CommandInteraction | ComponentInteraction)):
  Promise<{
    home: MessageActionRow[],
    commands: MessageActionRow[],
    back_to_home: MessageActionRow[],
    back_from_command: MessageActionRow[],
    back_from_permission: MessageActionRow[],
  }> => {
    return {
      home: [
        {
    			type: Constants.ComponentTypes.ACTION_ROW,
    			components: [
    				{
    					type: Constants.ComponentTypes.BUTTON,
    					style: Constants.ButtonStyles.LINK,
    					url: "https://discord.gg/DEhvVXdVvv",
    					label: "Support Server"			
    				}, {
    					type: Constants.ComponentTypes.BUTTON,
    					style: Constants.ButtonStyles.LINK,
    					url: "https://discord.gg/DEhvVXdVvv",
    					label: "Website"			
    				}, {
    					type: Constants.ComponentTypes.BUTTON,
    					style: Constants.ButtonStyles.LINK,
    					url: "https://discord.gg/DEhvVXdVvv",
    					label: "Donate"			
    				}, {
    					type: Constants.ComponentTypes.BUTTON,
    					style: Constants.ButtonStyles.LINK,
    					url: this.bot.constants.config.invite.replace("{id}", this.bot.constants.config.applicationID),
    					label: "Invite"			
    				}
    			]
    		}
      ],
      commands: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              label: "View Commands",
              customID: `help_${interaction.member?.id}_commandembed`,
            },
            await this.bot.getModule("Main").hasPerm(interaction.member, "main.permnode.view") && {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              label: "View Permissions",
              customID: `help_${interaction.member?.id}_permissionembed`,
            }
          ]
        }
      ],
      back_to_home: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.SECONDARY,
              label: "Back to help",
              customID: `help_${interaction.member?.id}_help`,
            }
          ]
        }
      ],
      back_from_command: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              label: "Back to commands",
              customID: `help_${interaction.member?.id}_commandembed`,
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.SECONDARY,
              label: "Back to help",
              customID: `help_${interaction.member?.id}_help`,
            }
          ]
        }
      ],
      back_from_permission: [
        {
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [
            {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.PRIMARY,
              label: "Back to permissions",
              customID: `help_${interaction.member?.id}_permissionembed`,
            }, {
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.SECONDARY,
              label: "Back to help",
              customID: `help_${interaction.member?.id}_help`,
            }
          ], 
        }
      ]

    }
  };

	readonly execute = async (interaction: CommandInteraction): Promise<FollowupMessageInteractionResponse<CommandInteraction>> => {
    return interaction.createFollowup({
      components: [
        this.createContainer(this.bot, interaction, [
          ...(await this.actionRow(this.bot, interaction)).home,
          ...(await this.actionRow(this.bot, interaction)).commands
        ])
      ],
      flags: Constants.MessageFlags.IS_COMPONENTS_V2
    })

	}

	readonly update = async (component: ComponentInteraction): Promise<Message | void> => {

		switch (component.data.customID.split("_")[2]) {

		case "commandembed": {

			const commands: Command[] = this.bot.commands.filter((c) => !c.devOnly),
        fields: TextDisplayComponent[] = [];

			for (const command of commands) {
				const field = fields.find((f) => f.content.includes(command.category));
				if (field)
					fields[fields.indexOf(field)].content += `, \`${command.commands[0]}\``;
				else {
          fields.push({
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: `## ${command.category}:\n\`${command.commands[0]}\``
          });
				}
			}

      return component.editOriginal({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `# List of commands`
              },
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `You can view more help/information on a command using \`</help:${(await this.bot.application.getGlobalCommands()).find(g => g.name == "help")?.id}>\`.`
              },
              ...fields,
              {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: Constants.ComponentTypes.STRING_SELECT,
                    customID: `help_${component.member?.id}_commandmenu`,
                    placeholder: "Choose a command",
                    minValues: 1,
                    maxValues: 1,
                    options: commands.map((c) => ({ label: c.commands[0], value: c.commands[0], description: c.description }))
                  }
                ]
              },
              ...(await this.actionRow(this.bot, component)).back_to_home
            ]
          }
        ]
      })
		}

		case "permissionembed": {
      const fields: TextDisplayComponent[] = [];

      fields.push({
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `## Administrator\n\`*\` (All Permissions)`
      });

      for (const perm of this.bot.perms) {
        if (perm.name === "*") continue;

        const Module: string = this.bot.modules.find((m: Module) => m.name.toLowerCase() === perm.name.split(/[.\-_]/)[0].toLowerCase())
          ? this.bot.modules.find((m: Module) => m.name.toLowerCase() === perm.name.split(/[.\-_]/)[0].toLowerCase()).name
          : perm.name.split(/[.\-_]/)[0].replace(/^\w/, c => c.toUpperCase()),
          field: TextDisplayComponent | undefined = fields.find((f) => f.content.startsWith(`## ${Module}`));

        if (field) {
          field.content += perm.default ? `, *\`${perm.name}\`*` : `, \`${perm.name}\``;
        } else {
          fields.push({
            type: Constants.ComponentTypes.TEXT_DISPLAY,
            content: `## ${Module}\n\`${perm.name}\``
          });
        }
      }

      // combine all the fields into one string
      const combinedFields = fields.map((f) => f.content).join("\n");

      return component.editOriginal({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `# Permission Nodes`
              },
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `This is a list of all available permission nodes.\nYou can view more help/information on a permission using </help:${(await this.bot.application.getGlobalCommands()).find(g => g.name == "help")?.id}>.`
              },
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: combinedFields
              },
              {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: Constants.ComponentTypes.STRING_SELECT,
                    customID: `help_${component.member?.id}_modulecomponent`,
                    placeholder: "Choose a module",
                    minValues: 1,
                    maxValues: 1,
                    options: this.bot.modules.map((m) => ({ label: m.name, value: m.name }))
                  }
                ]
              },
              ...(await this.actionRow(this.bot, component)).back_to_home
            ]
          }
        ]
      })
		}

		case "commandmenu": {
      const command = this.bot.commands.find((c) => c.commands[0] === (component.data as MessageComponentSelectMenuInteractionData).values.getStrings()[0]);
    
      if (!command)
        return component.editOriginal({ content: "Could not find the command!" });
    
      const components: TextDisplayComponent[] = [
        {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `# ${command.commands[0]}`
        },
        {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `**${command.description}**`
        }
      ];

      if (command.commands.length > 1) {
        components.push({
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `**Aliases:** ${command.commands.slice(1).join(", ")}`
        });
      }

      const usage = command.commands.length > 0
        ? `${command.commands[0]}`
        : `${command.commands[0]}`;
      components.push({
        type: Constants.ComponentTypes.TEXT_DISPLAY,
        content: `**Usage:** \`${usage}\``
      });

      if (command.example) {
        components.push({
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `**Example:** \`${command.example}\``
        });
      }

      if (command.permissions) {
        const perms = [...new Set(command.permissions)];
        components.push({
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `**Permissions:** \`${perms.join("`, `")}\``
        });
      }

      return component.editOriginal({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              ...components,
              ...(await this.actionRow(this.bot, component)).back_from_command
            ]
          }
        ]
      });
		}

		case "modulecomponent": {
			const moduleName = (component.data as MessageComponentSelectMenuInteractionData).values.getStrings()[0],
				perms = this.bot.perms.filter((p) => p.name.split(/[.\-_]/)[0].toLowerCase() === moduleName.toLowerCase());

			return component.editOriginal(
				{
					components: [
						{
              type: Constants.ComponentTypes.CONTAINER,
              components: [
                {
                  type: Constants.ComponentTypes.ACTION_ROW,
                  components: [
                    {
                      type: Constants.ComponentTypes.STRING_SELECT,
                      customID: `help_${component.member?.id}_permissionmenu`,
                      placeholder: "Choose a permission",
                      minValues: 1,
                      maxValues: 1,
                      options: perms.map((p) => ({ label: p.name, value: p.name }))
                    }
                  ]
                },
                ...(await this.actionRow(this.bot, component)).back_from_permission
              ]
            }
					]
				}
			);
		}

    case "permissionmenu": {
      const permnode: Permnodes = this.bot.perms.find((p) => p.name === ((component.data as MessageComponentSelectMenuInteractionData).values.getStrings()[0])) as Permnodes;

      return component.editOriginal({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `# ${permnode.name}`
              },
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `**${permnode.description}**${permnode.default ? " (Default)" : ""}`
              },
              {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: Constants.ComponentTypes.BUTTON,
                    style: Constants.ButtonStyles.PRIMARY,
                    label: "Back to help",
                    customID: `help_${component.member?.id}_home`,
                  }
                ]
              }
            ]
          }
        ]
      });
    }

    case "home":
		case "help": {
      return component.editOriginal(
        {
          components: [
            this.createContainer(this.bot, component, [
              ...(await this.actionRow(this.bot, component)).home,
              ...(await this.actionRow(this.bot, component)).commands
            ])
          ]
        }
      );
		}
	}
}}