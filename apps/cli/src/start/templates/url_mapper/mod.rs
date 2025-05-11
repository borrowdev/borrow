use clap::{Parser, ValueEnum};

#[derive(Clone, Debug)]
enum Template {
    CloudflareSupabaseTypescript,
}

impl ValueEnum for Template {
    fn value_variants<'a>() -> &'a [Self] {
        &[Self::CloudflareSupabaseTypescript]
    }
    fn to_possible_value(&self) -> Option<clap::builder::PossibleValue> {
        match self {
            Self::CloudflareSupabaseTypescript => Some(clap::builder::PossibleValue::new(
                "cloudflare-supabase-typescript",
            )),
        }
    }
}

#[derive(Parser, Debug)]
pub struct Args {
    #[arg(short, long, value_enum)]
    pub template: Template,
}

pub fn handle_url_mapper(args: Args) {}
