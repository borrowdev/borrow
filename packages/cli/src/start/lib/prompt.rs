use std::collections::HashMap;

use inquire::{Confirm, Text};

use super::DefaultPlaceholderValue;

pub struct PlaceholderValue {
    pub value: String,
    pub default_value: Option<String>,
    pub description: Option<String>,
}

pub fn prompt_placeholders(
    template_placeholders: HashMap<String, DefaultPlaceholderValue>,
) -> HashMap<String, PlaceholderValue> {
    let mut placeholders = HashMap::new();
    for (key, value) in template_placeholders.iter() {
        let default_value = value.default_value.clone();
        let description = value.description.clone();

        let prompt_message = match &description {
            Some(desc) => format!("{}", desc),
            None => format!("Enter value for placeholder '{}'", key),
        };
        
        let mut result = String::new();
        let prompt_fail_message = "Failed to prompt for placeholder";
        match &default_value {
            Some(default) => {
                if default == "false" || default == "true" {
                    let bool_result = Confirm::new(&prompt_message)
                        .with_default(default == "true")
                        .prompt()
                        .expect(prompt_fail_message);

                    if bool_result {
                        result = String::from("true");
                    } else {
                        result = String::from("false");
                    }
                } else {
                    result = Text::new(&prompt_message)
                    .with_default(default)
                    .prompt()
                    .expect(prompt_fail_message);
                }
            },
            None => { 
                result = Text::new(&prompt_message)
                .prompt()
                .expect(prompt_fail_message);
            }
        };

        placeholders.insert(
            key.to_owned(),
            PlaceholderValue {
                value: result,
                default_value: default_value,
                description: description,
            },
        );
    }

    placeholders
}
