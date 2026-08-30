export class GeminiConfigurationError extends Error {
  constructor(message = "Gemini resume extraction is not configured.") {
    super(message);
    this.name = "GeminiConfigurationError";
  }
}
