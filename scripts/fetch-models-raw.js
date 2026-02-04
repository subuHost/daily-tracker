const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

function fetchModels(version) {
    return new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
        console.log(`Fetching from ${url}...`);

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject({ status: res.statusCode, data });
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    if (!apiKey) {
        console.error("No API key");
        return;
    }

    try {
        console.log("--- V1 Models ---");
        const v1 = await fetchModels('v1');
        console.log(v1.models.map(m => m.name));
    } catch (e) {
        console.error("V1 Failed:", e.status, e.data);
    }

    try {
        console.log("\n--- V1BETA Models ---");
        const beta = await fetchModels('v1beta');
        console.log(beta.models.map(m => m.name));
    } catch (e) {
        console.error("Beta Failed:", e.status, e.data);
    }
}

run();
