use std::path::PathBuf;
use git2::{build, FetchOptions};

use crate::start::lib::{get_git_dir, get_template_dir, TemplateSpecifier};
use super::{copy_dir};

pub fn download_template(template: TemplateSpecifier, output_dir: PathBuf) {
    match &template {
        TemplateSpecifier::Local { path, name: _  } => {
            copy_dir(path.to_owned(), output_dir)
        },
        TemplateSpecifier::GitHub { name: _, owner, repo, branch, dir } => {
            let mut git = build::RepoBuilder::new();
            let mut fetch_options = FetchOptions::new();
            fetch_options.depth(1);
            fetch_options.download_tags(git2::AutotagOption::None);
            git.branch(&branch.clone().unwrap_or(String::from("main")));
            git.fetch_options(fetch_options);
            let git_dir = get_git_dir(&template);

            let res = git.clone(
            format!(
                    "https://github.com/{}/{}.git",
                    owner,
                    repo
                ).as_str(),
            &git_dir
            );

            if let Err(e) = res {
                if e.code() == git2::ErrorCode::Exists {
                    println!("Template already exists, skipping download");
                } else {
                    panic!("Failed to clone template: {}", e.message());
                }
            }

            let template_dir = get_template_dir(&template);
            let mut from = PathBuf::from(git_dir);
            if let Some(dir) = dir {
                from.push(dir);
            }
            if !from.exists() {
                panic!("Template directory {} does not exist", from.display());
            }

            copy_dir(from, template_dir);
        }
    }
}
