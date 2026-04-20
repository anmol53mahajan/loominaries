const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const PRIMARY_GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.1-8b-instant'
const FALLBACK_GROQ_MODEL = import.meta.env.VITE_GROQ_FALLBACK_MODEL || 'llama-3.3-70b-versatile'
const RETRIABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])

class AIServiceError extends Error {
  constructor(message, { code = 'AI_UNKNOWN_ERROR', status = 500, retriable = false, details } = {}) {
    super(message)
    this.name = 'AIServiceError'
    this.code = code
    this.status = status
    this.retriable = retriable
    this.details = details
  }
}

function buildPrompt({ agenda, portfolio, userQuery, mode }) {
  const systemPrompt = [
    'You are a senior MUN strategist.',
    'Always provide diplomatic, realistic, and data-backed guidance.',
    'Align recommendations with the country portfolio stance and geopolitical constraints.',
    'Use clear structure with headings and bullet points when useful.',
    'Avoid extreme or unrealistic claims. Keep advice practical for real MUN committee debates.',
    '',
    `Agenda: ${agenda}`,
    `Portfolio (Country): ${portfolio}`,
    `Interaction mode: ${mode}`,
  ].join('\n')

  return [systemPrompt, '', `User request: ${userQuery}`].join('\n')
}

function buildSpeechAnalysisPrompt({ agenda, portfolio, speakerCountry, verbatim }) {
  return [
    'You are a senior MUN strategist and debate analyst.',
    'Analyze the speech for weaknesses, inconsistencies, logical fallacies, and MUN rule issues.',
    'Return ONLY valid JSON with this exact shape: {"pois": ["..."], "poos": ["..."] }.',
    'The pois array must contain exactly 3 sharp trap POIs that force yes/no answers, expose lack of evidence, or challenge policy contradictions.',
    'The poos array must contain logical fallacies, contradictions, or procedural/MUN-rule issues.',
    'Do not include any extra prose, markdown, headings, or code fences.',
    '',
    `Agenda: ${agenda}`,
    `Portfolio (Country): ${portfolio}`,
    `Speaker Country: ${speakerCountry}`,
    '',
    'Speech to analyze:',
    verbatim,
  ].join('\n')
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function requestGroqCompletion({ apiKey, model, messages, temperature, maxTokens }) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw mapHttpError(response.status, null)
    }

    throw new AIServiceError('Invalid AI response format.', {
      code: 'AI_INVALID_RESPONSE_FORMAT',
      status: 502,
      retriable: true,
    })
  }

  if (!response.ok) {
    throw mapHttpError(response.status, data)
  }

  return data
}

function extractTextFromGroqResponse(data) {
  const text = data?.choices?.[0]?.message?.content?.trim()

  if (!text) {
    throw new AIServiceError('AI returned an empty response.', {
      code: 'AI_EMPTY_RESPONSE',
      status: 502,
      retriable: true,
      details: data,
    })
  }

  return text
}

function mapHttpError(status, data) {
  const providerMessage = (data?.error?.message || '').toLowerCase()

  if (status === 404 && providerMessage.includes('model')) {
    return new AIServiceError('Configured Groq model is not available for chat completions.', {
      code: 'AI_MODEL_NOT_FOUND',
      status,
      retriable: false,
      details: data,
    })
  }

  if (status === 401 || status === 403) {
    return new AIServiceError('Invalid AI API key or unauthorized request.', {
      code: 'AI_INVALID_KEY',
      status,
      retriable: false,
      details: data,
    })
  }

  if (status === 429) {
    return new AIServiceError('AI rate limit reached. Please retry shortly or use a lower-traffic model.', {
      code: 'AI_RATE_LIMIT',
      status,
      retriable: true,
      details: data,
    })
  }

  if (status >= 500) {
    return new AIServiceError('AI service temporarily unavailable.', {
      code: 'AI_SERVICE_UNAVAILABLE',
      status,
      retriable: true,
      details: data,
    })
  }

  return new AIServiceError('AI request failed.', {
    code: 'AI_REQUEST_FAILED',
    status,
    retriable: false,
    details: data,
  })
}

export async function callAI({ agenda, portfolio, userQuery, mode = 'chat' }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  if (!apiKey) {
    throw new AIServiceError('Missing AI API key.', {
      code: 'AI_CONFIG_MISSING_KEY',
      status: 500,
      retriable: false,
    })
  }

  if (!agenda?.trim() || !portfolio?.trim() || !userQuery?.trim()) {
    throw new AIServiceError('Agenda, portfolio, and query are required.', {
      code: 'AI_INVALID_INPUT',
      status: 400,
      retriable: false,
    })
  }

  const prompt = buildPrompt({
    agenda: agenda.trim(),
    portfolio: portfolio.trim(),
    userQuery: userQuery.trim(),
    mode,
  })

  const modelsToTry = [PRIMARY_GROQ_MODEL, FALLBACK_GROQ_MODEL].filter(
    (model, index, allModels) => model && allModels.indexOf(model) === index,
  )

  let lastError = null

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const data = await requestGroqCompletion({
          apiKey,
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are a senior MUN strategist. Always provide diplomatic, realistic, and data-backed guidance. Align with portfolio stance and keep outputs practical for real committee debates.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          maxTokens: 800,
        })

        return extractTextFromGroqResponse(data)
      } catch (error) {
        if (error instanceof AIServiceError) {
          lastError = error
        } else {
          lastError = new AIServiceError('Unable to reach AI service.', {
            code: 'AI_NETWORK_ERROR',
            status: 503,
            retriable: true,
            details: error,
          })
        }

        if (attempt < 2) {
          await sleep(350 * (attempt + 1))
          continue
        }

        break
      }

      if (lastError?.status === 404) {
        break
      }

      if (lastError?.retriable && RETRIABLE_STATUS_CODES.has(lastError.status) && attempt < 2) {
        await sleep(500 * (attempt + 1))
        continue
      }
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new AIServiceError('AI request failed.', {
    code: 'AI_REQUEST_FAILED',
    status: 500,
    retriable: true,
  })
}

export async function analyzeSpeech({ agenda, portfolio, speakerCountry, verbatim }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  if (!apiKey) {
    throw new AIServiceError('Missing AI API key.', {
      code: 'AI_CONFIG_MISSING_KEY',
      status: 500,
      retriable: false,
    })
  }

  if (!agenda?.trim() || !portfolio?.trim() || !speakerCountry?.trim() || !verbatim?.trim()) {
    throw new AIServiceError('Agenda, portfolio, speaker country, and speech are required.', {
      code: 'AI_INVALID_INPUT',
      status: 400,
      retriable: false,
    })
  }

  const prompt = buildSpeechAnalysisPrompt({
    agenda: agenda.trim(),
    portfolio: portfolio.trim(),
    speakerCountry: speakerCountry.trim(),
    verbatim: verbatim.trim(),
  })

  const modelsToTry = [PRIMARY_GROQ_MODEL, FALLBACK_GROQ_MODEL].filter(
    (model, index, allModels) => model && allModels.indexOf(model) === index,
  )

  let lastError = null

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const data = await requestGroqCompletion({
          apiKey,
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are a senior MUN strategist and debate analyst. Return only JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          maxTokens: 700,
        })

        return extractTextFromGroqResponse(data)
      } catch (error) {
        if (error instanceof AIServiceError) {
          lastError = error
        } else {
          lastError = new AIServiceError('Unable to reach AI service.', {
            code: 'AI_NETWORK_ERROR',
            status: 503,
            retriable: true,
            details: error,
          })
        }

        if (attempt < 2) {
          await sleep(350 * (attempt + 1))
          continue
        }

        break
      }
    }

    if (lastError?.status === 404) {
      break
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new AIServiceError('AI request failed.', {
    code: 'AI_REQUEST_FAILED',
    status: 500,
    retriable: true,
  })
}

export { AIServiceError }
