require('dotenv').config();

async function listModels() {
  console.log("Fetching available models...");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.map(m => console.log(`- ${m.name} (methods: ${m.supportedGenerationMethods.join(', ')})`));
    } else {
      console.log("Error details:", data);
    }
  } catch (error) {
    console.error("FAILED TO FETCH MODELS:", error.message);
  }
}

listModels();
