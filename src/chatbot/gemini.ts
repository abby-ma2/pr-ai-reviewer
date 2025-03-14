import { debug, warning } from "@actions/core"
import { type GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai"
import type { PullRequestContext } from "../context.js"
import type { Options } from "../option.js"
import { type ChatBot, getModelName } from "./index.js"

const defaultModel = "gemini-2.0-flash-lite"
const apiKey = process.env.GOOGLE_API_KEY || ""

export class GeminiClient implements ChatBot {
  private client: GoogleGenerativeAI
  private model: GenerativeModel
  private options: Options

  constructor(options: Options) {
    this.options = options
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = this.client.getGenerativeModel({
      systemInstruction: {
        text: options.systemPrompt // System prompt for the model
      },
      model: getModelName(options.model) || defaultModel
    })

    if (this.options.debug) {
      debug("Gemini client initialized")
      debug(`Using model: ${this.model}`)
    }
  }

  async create(ctx: PullRequestContext, prompt: string): Promise<string> {
    try {
      // Call the Gemini API
      const result = await this.model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1
          // maxOutputTokens: 2000,
        }
      })

      return result.response.text()
    } catch (error) {
      warning(
        `Failed to review code for: ${error instanceof Error ? error.message : String(error)}`
      )

      // Retry logic
      if (this.options.retries > 0) {
        this.options.retries--
        return this.create(ctx, prompt)
      }

      return "Failed to review this file due to an API error."
    }
  }
}
