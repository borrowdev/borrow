use clap::Parser;
use emojic::country_flag;
use std::{collections::HashMap, time::Duration};

#[cfg(not(debug_assertions))]
static ENDPOINT: &str = "https://api.borrow.dev";
#[cfg(debug_assertions)]
static ENDPOINT: &str = "http://localhost:8787";

#[derive(Parser, Debug)]
pub struct MsCommand {
    /// The API URL to measure latency for
    pub url: String,

    /// HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
    #[arg(short = 'm', long = "method", default_value = "GET")]
    pub method: String,

    /// Borrow API key (defaults to BORROW_API_KEY env var)
    #[arg(short = 'k', long = "api-key", env = "BORROW_API_KEY")]
    pub api_key: String,

    /// Headers to forward in the request (repeatable, format: "Key: Value")
    #[arg(long = "header", num_args = 0..)]
    pub header: Vec<String>,

    /// Request body (for POST, PUT, DELETE)
    #[arg(short = 'd', long = "body")]
    pub body: Option<String>,

    /// Publish parts of the request (comma-separated: body,query,headers)
    #[arg(short = 'p', long = "publish", value_delimiter = ',')]
    pub publish: Vec<String>,

    /// Scope of the published measurement (public or private)
    #[arg(short = 's', long = "scope", default_value = "private")]
    pub scope: String,

    /// Whether to disable video generation when 'publish' is used or 'scope' is set to 'public'
    #[arg(long = "no-video", default_value_t = false)]
    pub no_video: bool,

    /// Show region codes in output
    #[arg(short = 'v', long = "verbose")]
    pub verbose: bool,
}

pub fn handle_ms_command(cmd: MsCommand) {
    let method = cmd.method.to_uppercase();
    match method.as_str() {
        "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" => {}
        _ => {
            eprintln!(
                "Error: unsupported HTTP method '{}'. Use GET, POST, PUT, DELETE, PATCH, OPTIONS, or HEAD.",
                method
            );
            std::process::exit(1);
        }
    }

    let mut headers: HashMap<String, String> = HashMap::new();
    for h in &cmd.header {
        if let Some((key, value)) = h.split_once(':') {
            headers.insert(key.trim().to_string(), value.trim().to_string());
        } else {
            eprintln!(
                "Error: invalid header format '{}'. Expected 'Key: Value'.",
                h
            );
            std::process::exit(1);
        }
    }

    let mut measure_request = serde_json::Map::new();
    measure_request.insert(
        "url".to_string(),
        serde_json::Value::String(cmd.url.clone()),
    );
    measure_request.insert(
        "method".to_string(),
        serde_json::Value::String(method.clone()),
    );
    measure_request.insert(
        "headers".to_string(),
        serde_json::Value::Object(
            headers
                .into_iter()
                .map(|(k, v)| (k, serde_json::Value::String(v)))
                .collect(),
        ),
    );

    if let Some(body) = &cmd.body {
        if method == "GET" {
            eprintln!("Error: --body cannot be used with GET requests.");
            std::process::exit(1);
        }
        measure_request.insert("body".to_string(), serde_json::Value::String(body.clone()));
    }

    let mut payload = serde_json::json!({
        "action": "measure",
        "enableVideo": !cmd.no_video,
        "measureRequest": measure_request,
    });

    if !cmd.publish.is_empty() {
        let valid_parts = ["body", "headers", "query"];
        for part in &cmd.publish {
            if !valid_parts.contains(&part.as_str()) {
                eprintln!(
                    "Error: invalid publish part '{}'. Valid options: body, headers, query.",
                    part
                );
                std::process::exit(1);
            }
        }
        payload["publish"] = serde_json::to_value(&cmd.publish).unwrap();
    }

    payload["scope"] = serde_json::Value::String(cmd.scope.clone());

    let client = reqwest::blocking::Client::new();
    let res = client
        .post(&format!("{ENDPOINT}/v1/ms"))
        .header("Content-Type", "application/json")
        .header("X-Borrow-Api-Key", &cmd.api_key)
        .timeout(Duration::from_mins(3))
        .json(&payload)
        .send();

    match res {
        Ok(response) => {
            let status = response.status();
            let body_text = response.text().unwrap_or_default();

            if !status.is_success() {
                eprintln!("Error ({}): {}", status, body_text);
                std::process::exit(1);
            }

            let parsed: serde_json::Value = match serde_json::from_str(&body_text) {
                Ok(v) => v,
                Err(_) => {
                    eprintln!("Error: failed to parse response: {}", body_text);
                    std::process::exit(1);
                }
            };

            if parsed["result"] == "error" {
                eprintln!(
                    "Error [{}]: {}",
                    parsed["error"].as_str().unwrap_or("UNKNOWN"),
                    parsed["message"].as_str().unwrap_or("Unknown error")
                );
                std::process::exit(1);
            }

            println!(
                "================================================================================="
            );
            println!("🏁 API latency stats for {} {}", method, cmd.url);
            if cmd.verbose {
                println!(
                    "Request body hash: {:x}",
                    md5::compute(&serde_json::to_string(&measure_request).unwrap())
                );
            }
            println!();

            let latency = &parsed["latency"];
            if let Some(obj) = latency.as_object() {
                if cmd.verbose {
                    println!(
                        "{:<34} {:<26} {:>10} {:>10} {:>10} {:>10}",
                        "🌎 REGION", "CODE", "ITERATIONS", "p50 (ms)", "p90 (ms)", "p99 (ms)"
                    );
                    println!("{}", "-".repeat(104));
                } else {
                    println!(
                        "{:<34} {:>10} {:>10} {:>10} {:>10}",
                        "🌎 REGION", "ITERATIONS", "p50 (ms)", "p90 (ms)", "p99 (ms)"
                    );
                    println!("{}", "-".repeat(78));
                }

                let mut regions: Vec<_> = obj.iter().collect();
                regions.sort_by(|a, b| {
                    let p50_a = a.1["data"]["p50"].as_f64().unwrap_or(f64::MAX);
                    let p50_b = b.1["data"]["p50"].as_f64().unwrap_or(f64::MAX);
                    p50_a
                        .partial_cmp(&p50_b)
                        .unwrap_or(std::cmp::Ordering::Equal)
                });

                let mut i = 1;
                for (region_code, entry) in regions {
                    let country = entry["metadata"]["country"].as_str().unwrap_or("??");
                    let region_name = entry["metadata"]["region"].as_str().unwrap_or("Unknown");
                    let flag = country_flag(country);
                    let label = format!("{} {}  {} ({})", i, flag, country, region_name);

                    let amount = entry["data"]["amount"].as_u64().unwrap_or(0);
                    let p50 = entry["data"]["p50"].as_f64().unwrap_or(0.0);
                    let p90 = entry["data"]["p90"].as_f64().unwrap_or(0.0);
                    let p99 = entry["data"]["p99"].as_f64().unwrap_or(0.0);

                    if cmd.verbose {
                        println!(
                            "{:<34} {:<26} {:>10} {:>10.2} {:>10.2} {:>10.2}",
                            label, region_code, amount, p50, p90, p99
                        );
                    } else {
                        println!(
                            "{:<34} {:>10} {:>10.2} {:>10.2} {:>10.2}",
                            label, amount, p50, p90, p99
                        );
                    }
                    i += 1;
                }
            } else {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&parsed).unwrap_or(body_text)
                );
            }

            println!();
            println!(
                "================================================================================="
            );

            let mut has_extra_data = false;

            if let Some(url) = parsed["url"].as_str()
                && cmd.scope == "public"
            {
                println!("🏎️  Share the results: {url}");
                has_extra_data = true;
            }

            if let Some(video_url) = parsed["videoUrl"].as_str() {
                println!("🎬 Share the video: {}", video_url);
                has_extra_data = true;
            }

            if has_extra_data {
                println!(
                    "================================================================================="
                );
            }

            println!("❤️  By Borrow.dev \u{21C0} Open-Source Tools for Web Developers");
            println!();
        }
        Err(e) => {
            eprintln!("Error: request failed: {}", e);
            std::process::exit(1);
        }
    }
}
