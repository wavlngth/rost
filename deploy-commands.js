const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { token, guildId } = require('./config.json');

// Define the slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('host')
        .setDescription('Host a session')
        .addStringOption(option =>
            option.setName('session_type')
                .setDescription('Type of session')
                .setRequired(true)
                .addChoices(
                    { name: 'Training Session', value: 'Training Session' },
                    { name: 'Shift', value: 'Shift' }
                ))
        .addStringOption(option =>
            option.setName('roblox_username')
                .setDescription('Roblox username of the host')
                .setRequired(true)),

    // /settings command to configure embed color and permissions
    new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure server settings.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Set the embed color.')
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Hex color code (e.g., #FF5733)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('permissions')
                .setDescription('Set permissions for who can run the /host command.')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role with permission')
                        .setRequired(true)
                )
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Registering slash commands...');
        // Deploy commands to a specific guild
        await rest.put(Routes.applicationGuildCommands('1345414079061295114', guildId), { body: commands });
        console.log('Slash commands registered!');
    } catch (error) {
        console.error(error);
    }
})();

