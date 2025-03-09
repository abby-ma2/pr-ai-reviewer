import { type ChatBot } from "./chatbots/index.js";
import type { Options } from "./option.js";
/**
 * Class that holds context information for a pull request
 * Stores pull request related data and handles chatbot creation
 */
export declare class PullRequestContext {
    /** Repository owner name */
    owner: string;
    /** Pull request title */
    title: string;
    /** Pull request description (optional) */
    description?: string;
    /** Summary of the pull request (optional) */
    summary?: string;
    /** Repository name */
    repo: string;
    /** Pull request number (optional) */
    pullRequestNumber?: number;
    /**
     * Creates an instance of PullRequestContext
     *
     * @param owner Repository owner name
     * @param title Pull request title
     * @param repo Repository name
     * @param description Pull request description (optional)
     * @param pullRequestNumber Pull request number (optional)
     */
    constructor(owner: string, title: string, repo: string, description?: string, pullRequestNumber?: number);
    /**
     * Creates a chatbot with the specified model and options
     *
     * @param model The AI model name to use
     * @param apiKey API key for the model service
     * @param options Configuration options for the chatbot
     * @returns A configured ChatBot instance
     */
    createChatbot(model: string, apiKey: string, options: Options): ChatBot;
}
