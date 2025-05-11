mod start;
use start::{handle_start_command, StartCommand};
use clap::{Parser, Subcommand};


#[derive(Parser, Debug)]
#[command(version, about, long_about = None, arg_required_else_help(true))]
struct Cli {
    #[command(subcommand)]
    command: Command
}

#[derive(Subcommand, Debug)]
enum Command {
    /// Subcommand for scaffolding projects and project components with Borrow Start.
    #[command(subcommand, arg_required_else_help(true))]
    StartCommand(StartCommand)
}

fn main() {
    let cli = Cli::parse();
    match cli.command {
        Command::StartCommand(start_command) => {
            handle_start_command(start_command)
        }
    }
}

