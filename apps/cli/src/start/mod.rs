pub mod lib;
use std::{fs::remove_dir_all, path::PathBuf};

use clap::{Parser};
use lib::{download_template, install_template, TemplateSpecifier};

use crate::start::lib::{get_git_dir, get_template_dir};

#[derive(Parser, Debug)]
pub enum StartCommand {
    #[command(name = "new", arg_required_else_help(true))]
    New {
        #[arg(short, long)]
        template: String,
        #[arg(long)]
        target_dir: String,
    },

    #[command(name = "del", arg_required_else_help(true))]
    Del {
        #[arg(short, long)]
        template: String
    }
}

pub fn handle_start_command(command: StartCommand) {
    match command {
        StartCommand::New {
            template,
            target_dir
        } => {
            let template_specifier = TemplateSpecifier::new(&template);
            let template_dir = get_template_dir(&template_specifier);

            download_template(template_specifier.clone(), template_dir.clone());
            install_template(template_dir, PathBuf::from(target_dir));
        },
        StartCommand::Del { template } => {
            let template_specifier = TemplateSpecifier::new(&template);
            let template_dir = get_template_dir(&template_specifier);

            if template_dir.exists() {
                remove_dir_all(template_dir).expect("Failed to delete template directory");
                remove_dir_all(get_git_dir(&template_specifier)).expect("Failed to delete git directory for template");
            } else {
                eprintln!("Template does not exist: {}", template_dir.display());
            }
        }
    }
}
