const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not found in .env.local');
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        console.log('Fetching available models...');
        // Note: listModels is not directly available on genAI instance in some versions, 
        // but let's try to infer or use a known model to check connectivity.
        // Actually, the SDK doesn't expose listModels easily in the node client without using the model manager.
        // Let's try to generate content with a few common models and see which one works.

        const models = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-001',
            'gemini-1.5-pro',
            'gemini-1.5-pro-001',
            'gemini-1.0-pro',
            'gemini-pro'
        ];

        for (const modelName of models) {
            try {
                process.stdout.write(`Testing ${modelName}... `);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Hello');
                const response = await result.response;
                console.log('SUCCESS');
            } catch (error) {
                console.log(`FAILED: ${error.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
