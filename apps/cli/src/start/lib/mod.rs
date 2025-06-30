mod download_template;
mod install_template;
mod utils;
mod prompt;

pub use download_template::*;
pub use install_template::*;
pub use utils::*;
pub use prompt::*;

use std::path::PathBuf;
#[derive(Debug, Clone)]
pub enum TemplateSpecifier {
    GitHub {
        name: String,
        owner: String,
        repo: String,
        branch: Option<String>,
        dir: Option<String>
    },
    Local {
        name: String,
        path: PathBuf
    },
}

impl TemplateSpecifier {
    pub fn new(spec: &str) -> Self {
        if spec.starts_with("local:") {
            let path = PathBuf::from(spec.trim_start_matches("local:"));
            let template_name = path.iter().last().unwrap().to_string_lossy().to_string();
            Self::Local {
                name: template_name,
                path
            }
        } else if spec.starts_with("gh:") {
            panic!("GitHub templates are not yet supported");
        } else {
            let mut specs = spec.split("@").into_iter();
            let dir = specs.next().unwrap().to_string();
            let branch = specs.next().unwrap_or("v1").to_string();
            let org = String::from("borrowdev");
            let repo = String::from("registry");
            let name = format!("{}-{}-{}-{}", org, repo, branch, dir.clone());
            Self::GitHub {
                name,
                owner: org,
                repo,
                branch: Some(branch),
                dir: Some(dir),
            }
        }
    }
}