const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function testModels() {
    if (!apiKey) {
        console.error("API Key not found");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-2.0-flash-exp",
        "gemini-pro"
    ];

    console.log("--- Testing Models with Simple Prompt ---");
    for (const modelName of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`✅ ${modelName}: SUCCESS`);
        } catch (e) {
            console.log(`❌ ${modelName}: FAILED - ${e.message}`);
        }
    }

    console.log("\n--- Testing Models with Grounding (googleSearch) ---");
    for (const modelName of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                tools: [{ googleSearch: {} }]
            });
            const result = await model.generateContent("What is the news today?");
            console.log(`✅ ${modelName} (Grounding): SUCCESS`);
        } catch (e) {
            console.log(`❌ ${modelName} (Grounding): FAILED - ${e.message}`);
        }
    }
}

testModels();
