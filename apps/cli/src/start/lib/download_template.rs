use std::{path::PathBuf};
use crate::start::lib::TemplateSpecifier;
use super::{copy_dir};

pub fn download_template(template: TemplateSpecifier, output_dir: PathBuf) {
    match template {
        TemplateSpecifier::Local { path, name: _  } => {
            copy_dir(path, output_dir)
        },
        _ => {
            panic!("Unsupported template specifier");
        }
    }
}
