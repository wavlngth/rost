const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { token, guildId, messages } = require('./config.json');
const fs = require('fs');

// Initialize the client
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Initialize settings file if it doesn't exist
if (!fs.existsSync('./settings.json')) {
    fs.writeFileSync('./settings.json', JSON.stringify({}, null, 2));
}

// Load settings from the settings file
const loadSettings = () => JSON.parse(fs.readFileSync('./settings.json'));

// Log in to Discord
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Command cooldown tracking
const cooldowns = new Map();

// Handle interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const settings = loadSettings();
    const now = Date.now();

    // Log the command usage
    console.log(`${interaction.user.tag} used /${interaction.commandName} at ${new Date(now).toISOString()}`);

    // /host command with cooldown
    if (interaction.commandName === 'host') {
        const sessionType = interaction.options.getString('session_type');
        const robloxUser = interaction.options.getString('roblox_username');

        // Check cooldown
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id);
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return interaction.reply(`Please wait ${timeLeft} more second(s) before using this command again.`);
            }
        }

        // Set cooldown (10 seconds cooldown for example)
        cooldowns.set(interaction.user.id, now + 10000);

        // Check if user has permission to use the command
        const requiredRole = settings[interaction.guildId]?.hostPermissionRole;
        if (requiredRole && !interaction.member.roles.cache.has(requiredRole)) {
            return interaction.reply('You do not have permission to run this command.');
        }

        const embed = new EmbedBuilder()
            .setTitle(messages.hostTitle.replace('{sessionType}', sessionType))
            .setDescription(messages.hostDescription.replace('{sessionType}', sessionType).replace('{robloxUser}', robloxUser))
            .setColor(settings[interaction.guildId]?.embedColor || 0x00ff00) // Default color if not set
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // /settings command
    if (interaction.commandName === 'settings') {
        const subCommand = interaction.options.getSubcommand();

        // /settings color
        if (subCommand === 'color') {
            const color = interaction.options.getString('color');
            if (!/^#[0-9A-F]{6}$/i.test(color)) {
                return interaction.reply('Please provide a valid hex color code (e.g., #FFFFFF).');
            }

            // Save the color to the settings file
            settings[interaction.guildId] = settings[interaction.guildId] || {};
            settings[interaction.guildId].embedColor = color;
            fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));

            return interaction.reply(`Embed color has been set to ${color}`);
        }

        // /settings permissions
        if (subCommand === 'permissions') {
            const role = interaction.options.getRole('role');
            if (!role) {
                return interaction.reply('Please specify a role to set permissions for.');
            }

            // Save the role to the settings file
            settings[interaction.guildId] = settings[interaction.guildId] || {};
            settings[interaction.guildId].hostPermissionRole = role.id;
            fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));

            return interaction.reply(`Role ${role.name} now has permission to run the /host command.`);
        }

        // /settings description
        if (subCommand === 'description') {
            // Ensure the user has administrator permissions
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                return interaction.reply('You need Administrator permissions to use this command.');
            }

            const sessionType = interaction.options.getString('session_type');
            const description = interaction.options.getString('description');

            // Update the description for the session type
            if (sessionType === 'Training Session') {
                messages.hostDescription = description;
            } else if (sessionType === 'Shift') {
                messages.hostDescription = description;
            }

            fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
            return interaction.reply(`Embed description for ${sessionType} has been updated.`);
        }
    }

    // /help command
    if (interaction.commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('Help - Available Commands')
            .setDescription('Here are the available commands you can use:')
            .addFields(
                { name: '/host', value: 'Host a session.' },
                { name: '/settings', value: 'Configure server settings, like embed color and permissions.' },
                { name: '/help', value: 'Get information about available commands.' }
            )
            .setColor(settings[interaction.guildId]?.embedColor || 0x00ff00);
        await interaction.reply({ embeds: [embed] });
    }
});

// Register slash commands
client.once('ready', async () => {
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
            .addSubcommand(subcommand =>
                subcommand
                    .setName('description')
                    .setDescription('Set the embed description for a session type.')
                    .addStringOption(option =>
                        option.setName('session_type')
                            .setDescription('Type of session (Shift or Training Session)')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Training Session', value: 'Training Session' },
                                { name: 'Shift', value: 'Shift' }
                            )
                    )
                    .addStringOption(option =>
                        option.setName('description')
                            .setDescription('New description for the session type')
                            .setRequired(true)
                    )
            ),

        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Get a list of available commands.')
    ];

    // Register commands for your guild
    const guild = await client.guilds.fetch(guildId);
    guild.commands.set(commands.map(command => command.toJSON()));
});

// Log in to Discord
client.login(token);
