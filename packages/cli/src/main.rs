mod ms;
mod start;
use clap::{Parser, Subcommand};
use ms::{MsCommand, handle_ms_command};
use start::{StartCommand, handle_start_command};

#[derive(Parser, Debug)]
#[command(version, about, long_about = None, arg_required_else_help(true))]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
enum Command {
    /// Scaffold projects and components with Borrow Start.
    #[command(name = "start", subcommand, arg_required_else_help(true))]
    StartCommand(StartCommand),

    /// Measure the latency of your API around the world
    #[command(name = "ms")]
    Ms(MsCommand),
}

fn main() {
    let cli = Cli::parse();
    match cli.command {
        Command::StartCommand(start_command) => handle_start_command(start_command),
        Command::Ms(ms_command) => handle_ms_command(ms_command),
    }
}
