use super::{prompt_placeholders, PlaceholderValue};
use std::{
    collections::HashMap,
    fs::{create_dir, read_to_string, File},
    io::{BufRead, BufReader, BufWriter, Write},
    path::PathBuf,
};

use walkdir::WalkDir;

struct TemplateConfig {
    name: String,
    description: String,
    version: String,
}

// struct FileConfig {
//     out_path: String,
// }

enum FileError {
    FileSystem,
}

fn process_template_file(
    file_path: &PathBuf,
    placeholders: &HashMap<String, PlaceholderValue>,
    out_dir: PathBuf,
) -> Result<(), FileError> {
    let Ok(input_file) = File::open(file_path) else {
        return Err(FileError::FileSystem);
    };
    
    // Get the file name and handle .template extension
    let file_name = file_path.file_name().unwrap().to_string_lossy();
    let output_file_name = if file_name.ends_with(".template") {
        // Remove .template extension but keep the rest
        file_name.strip_suffix(".template").unwrap().to_string()
    } else {
        file_name.to_string()
    };
    
    let output_file_path = out_dir.join(output_file_name);
    
    println!("Processing file: {} -> {}", file_path.display(), output_file_path.display());
    
    let Ok(output_file) = File::create(&output_file_path) else {
        return Err(FileError::FileSystem);
    };
    let read_buffer = BufReader::new(&input_file);
    let mut write_buffer = BufWriter::new(&output_file);

    for line in read_buffer.lines() {
        let line = line.unwrap();
        let mut new_line = line.clone();
        for (key, value) in placeholders {
            new_line = new_line.replace(format!("%%({key})%%").as_str(), &value.value);
        }
        write_buffer.write_all(new_line.as_bytes()).unwrap();
        write_buffer.write_all(b"\n").unwrap(); // Add newline
    }

    write_buffer.flush().unwrap();
    Ok(())
}

pub struct DefaultPlaceholderValue {
    pub description: Option<String>,
    pub default_value: Option<String>,
}

/// Placeholders are defined like this: PLACEHOLDER=DEFAULT_VALUE where
///
/// if the default value is not provided, it should be just PLACEHOLDER.
///
/// Placeholders may contain a description which is shown to the user.
///
/// Description syntax looks like this: PLACEHOLDER=DEFAULT_VALUE - Description for this value
fn parse_template_placeholders(
    placeholder_path: &PathBuf,
) -> HashMap<String, DefaultPlaceholderValue> {
    let content = read_to_string(placeholder_path).unwrap();
    println!("Parsing placeholders from {}", placeholder_path.display());
    let mut placeholders = HashMap::new();
    for line in content.lines() {
        if line.trim().is_empty() {
            continue;
        }
        let mut parts = line.split('=');
        let key = parts.next().unwrap().to_string();
        let key = key.split("-").collect::<Vec<&str>>();
        let key = key.first().unwrap().trim();
        let default_value = parts.next();
        let comment = line.split("-");
        let comment = comment.collect::<Vec<&str>>();

        let parsed_comment: Option<String>;
        if comment.len() == 2 {
            parsed_comment = Some(comment.last().unwrap().to_string().trim().to_string());
        } else {
            parsed_comment = None;
        }

        match default_value {
            Some(default_value) => {
                placeholders.insert(
                    key.to_string(),
                    DefaultPlaceholderValue {
                        description: parsed_comment,
                        default_value: Some(default_value.split("-").next().unwrap().to_string().trim().to_string()),
                    },
                );
            }
            None => {
                placeholders.insert(
                    key.to_string(),
                    DefaultPlaceholderValue {
                        description: parsed_comment,
                        default_value: None,
                    },
                );
            }
        }
    }

    placeholders
}

pub fn install_template(root_dir: PathBuf, target_dir: PathBuf) {
    let empty_placeholders = parse_template_placeholders(&root_dir.join("placeholders.borrow"));
    let placeholders = prompt_placeholders(empty_placeholders);
    
    std::fs::create_dir_all(&target_dir).unwrap();
    
    let source_dir = root_dir.join("content");
    process_template_files(source_dir, target_dir.join(root_dir.iter().last().unwrap()), &placeholders);
}

pub fn process_template_files(
    source_dir: PathBuf,
    target_dir: PathBuf,
    placeholders: &HashMap<String, PlaceholderValue>,
) {
    for entry in WalkDir::new(&source_dir).min_depth(0).max_depth(100) {
        let entry = entry.unwrap();
        if entry.file_type().is_file() {
            let file_path = entry.path().to_path_buf();

            if let Some(ext) = file_path.extension() {
                if ext == "template" {
                    let out_dir = target_dir.join(file_path.strip_prefix(&source_dir).unwrap().parent().unwrap());
                    create_dir(&out_dir).ok();
                    if let Err(_) = process_template_file(
                        &file_path,
                        placeholders,
                        out_dir
                    ) {
                        eprintln!("Error processing file {}", file_path.display());
                    }
                    continue;
                }
            };
            // Copy non-template files directly
            let target_file_path = target_dir.join(file_path.strip_prefix(&source_dir).unwrap());
            std::fs::create_dir(target_file_path.parent().unwrap()).ok();
            std::fs::copy(file_path, target_file_path).unwrap();
        }
    }
}
