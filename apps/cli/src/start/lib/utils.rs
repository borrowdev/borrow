use std::{fs::{create_dir}, path::PathBuf};

use cli::get_root_data_dir;
use walkdir::WalkDir;

use crate::start::lib::TemplateSpecifier;

fn get_data_dir() -> PathBuf {
    get_root_data_dir().join("start")
}

pub fn get_templates_dir() -> PathBuf {
    get_data_dir().join("templates")
}

pub fn get_template_dir(specifier: TemplateSpecifier) -> PathBuf {
    match specifier {
        TemplateSpecifier::Local { name, path: _ } => get_templates_dir().join(name),
        TemplateSpecifier::GitHub { name, owner: _, repo: _, branch: _, dir: _ } => get_templates_dir().join(name),
    }
}

pub fn copy_dir(from: PathBuf, to: PathBuf) {
    println!("Copying from {} to {}", from.display(), to.display());

    for entry in WalkDir::new(&from).min_depth(0).max_depth(100) {
        let path = entry.unwrap().into_path();
        if path.is_symlink() {
            println!("Symlinks are not supported yet. Skipping {}", path.display());
            continue;
        } else if path.is_dir() {
            let relative_path = path.strip_prefix(&from).unwrap();
            let to = to.join(relative_path);
            if to.exists() {
                println!("Directory {} already exists. Skipping", to.display());
                continue;
            } else {
                println!("Creating directory {}", to.display());
            }
            create_dir(to).unwrap();
        } else {
            let relative_path = path.strip_prefix(&from).unwrap();
            let to = &to.join(relative_path);
            if to.exists() {
                println!("File {} already exists. Skipping", to.display());
                continue;
            } else {
                println!("Copying file {} to {}", path.display(), to.display());
            }
            std::fs::copy(&path, to).unwrap();
        }
    }
}
