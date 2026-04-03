use std::path::PathBuf;

use dirs::data_dir;

pub fn get_root_data_dir() -> PathBuf {
    let data_dir = data_dir();
    match data_dir {
        Some(path) => path.join("borrow"),
        None => PathBuf::from("./.borrow"),
    }
}
