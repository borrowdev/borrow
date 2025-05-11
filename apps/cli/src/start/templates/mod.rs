pub mod url_mapper;
use clap::Subcommand;
use url_mapper::Args;

#[derive(Subcommand, Debug)]
pub enum StartTemplate {
    UrlMapper(Args),
}
