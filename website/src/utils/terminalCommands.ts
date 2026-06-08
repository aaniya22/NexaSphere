import React from 'react';

export type CommandContext = {
  theme: string;
  setTheme: (theme: string) => void;
  navigate: (page: string) => void;
  closeTerminal: () => void;
  printToTerminal: (output: string | React.ReactNode) => void;
};

export const parseCommand = (input: string, context: CommandContext) => {
  const { theme, setTheme, navigate, closeTerminal, printToTerminal } = context;
  const args = input.trim().split(/\s+/);
  const command = args[0].toLowerCase();

  switch (command) {
    case 'help':
      printToTerminal(
        'Available commands:\n' +
          '  help       - Show this help message\n' +
          '  events     - Show upcoming events\n' +
          '  theme      - Change theme (usage: theme light|dark)\n' +
          '  nav <page> - Navigate to a specific page\n' +
          '  clear      - Clear terminal output\n' +
          '  exit       - Close the terminal\n' +
          '  sudo root  - ???'
      );
      break;

    case 'events':
      printToTerminal('Fetching events... Navigating to Events page.');
      setTimeout(() => {
        navigate('Events');
        closeTerminal();
      }, 500);
      break;

    case 'theme':
      if (args[1] === 'light' || args[1] === 'dark') {
        if (theme === args[1]) {
          printToTerminal(`Theme is already set to ${args[1]}.`);
        } else {
          setTheme(args[1]);
          printToTerminal(`Theme successfully changed to ${args[1]}.`);
        }
      } else {
        printToTerminal('Usage: theme light | theme dark');
      }
      break;

    case 'nav':
      if (args.length > 1) {
        // Join all args after 'nav' to support multi-word page names
        // e.g. 'nav core team' → 'core team' → matched to 'Core Team'
        const targetPage = args.slice(1).join(' ');
        const validPages = [
          'Home',
          'Activities',
          'Events',
          'Projects',
          'Roadmaps',
          'About',
          'Team',
          'Contact',
          'Core Team',
        ];

        // Case-insensitive match so 'nav core team', 'nav Core Team',
        // and 'nav CORE TEAM' all resolve correctly
        const matchedPage = validPages.find((p) => p.toLowerCase() === targetPage.toLowerCase());

        if (matchedPage) {
          printToTerminal(`Navigating to ${matchedPage}...`);
          setTimeout(() => {
            navigate(matchedPage);
            closeTerminal();
          }, 500);
        } else {
          printToTerminal(
            `Error: Unknown page '${targetPage}'. Valid pages are: ${validPages.join(', ')}`
          );
        }
      } else {
        printToTerminal('Usage: nav <page> (e.g., nav About, nav Core Team)');
      }
      break;

    case 'sudo':
      if (args[1] === 'root') {
        printToTerminal('Initiating God Mode... just kidding. But you have full power here.');
      } else {
        printToTerminal('Sorry, user is not in the sudoers file. This incident will be reported.');
      }
      break;

    case 'exit':
      printToTerminal('Exiting terminal...');
      setTimeout(() => {
        closeTerminal();
      }, 300);
      break;

    case 'clear':
      // Clear is handled specially by the component state
      break;

    case '':
      break;

    default:
      printToTerminal(`Command not found: ${command}. Type 'help' for available commands.`);
      break;
  }
};
