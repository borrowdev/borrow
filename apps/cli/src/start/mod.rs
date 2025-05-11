mod templates;
mod lib;
use clap::Subcommand;
use templates::{StartTemplate, url_mapper::handle_url_mapper};

#[derive(Subcommand, Debug)]
pub enum StartCommand {
    #[command(subcommand, arg_required_else_help(true))]
    New(StartTemplate),
}

pub fn handle_start_command(command: StartCommand) {
    match command {
        StartCommand::New(template) => match template {
            StartTemplate::UrlMapper(args) => {
                handle_url_mapper(args);
            }
        },
    }
}
