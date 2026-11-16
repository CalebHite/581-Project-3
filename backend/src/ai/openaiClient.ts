/*
 * Name:         openaiClient.ts
 * Description:  Lazily-created OpenAI client. Not used in Sprint 2; reserved for
 *               later AI features (e.g. automatic background removal, req. 41).
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial scaffold.
 * Preconditions:  OPENAI_API_KEY is set in the environment (backend/.env).
 * Postconditions: Returns a shared OpenAI client instance.
 * Errors:       Throws if the key is missing.
 */
import OpenAI from 'openai';

let client: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}
