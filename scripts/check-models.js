const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Manually read .env.local because I don't want to rely on dotenv package install status in scripts folder
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function listModels() {
    if (!apiKey) {
        console.error("API Key not found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // The SDK doesn't have a direct .listModels() on the genAI object in all versions.
        // Usually, it's done via the discovery API, but let's try some common ones first.
        // Since I can't easily perform a discovery call here, I'll try to probe a few models.
        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
        console.log("Probing models...");

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Just a tiny ping
                console.log(`Model ${modelName} exists.`);
            } catch (e) {
                console.log(`Model ${modelName} NOT found.`);
            }
        }
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
