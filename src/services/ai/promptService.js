let currentSession = null

export async function checkPromptAPIAvailability() {
  try {
    if (!window.ai?.languageModel) {
      return { status: 'unavailable', message: 'Chrome AI API not found. Enable it in chrome://flags/#prompt-api-for-gemini-nano' }
    }

    const capabilities = await window.ai.languageModel.capabilities()

    if (capabilities.available === 'readily') {
      return { status: 'ready', message: 'Available' }
    }

    if (capabilities.available === 'after-download') {
      return { status: 'needs-download', message: 'Model needs to be downloaded' }
    }

    return { status: 'unavailable', message: 'Hardware does not meet requirements' }
  } catch (err) {
    return { status: 'error', message: err.message || 'Failed to check AI availability' }
  }
}

export async function downloadPromptModel(onProgress) {
  try {
    if (!window.ai?.languageModel) {
      return { success: false, error: 'Chrome AI API not available' }
    }

    const session = await window.ai.languageModel.create({
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          onProgress?.(e.loaded / e.total)
        })
      }
    })

    session.destroy()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || 'Download failed' }
  }
}

export async function createPromptSession(options = {}) {
  try {
    if (!window.ai?.languageModel) {
      return { session: null, error: 'Chrome AI API not available' }
    }

    currentSession = await window.ai.languageModel.create({
      systemPrompt: options.systemPrompt || 'You are a helpful file analysis assistant. Be concise and specific.',
      ...options,
    })

    return { session: currentSession, error: null }
  } catch (err) {
    return { session: null, error: err.message || 'Failed to create AI session' }
  }
}

export async function prompt(text, session = null) {
  const activeSession = session || currentSession

  if (!activeSession) {
    return { result: null, error: 'No active AI session. Create a session first.' }
  }

  try {
    const result = await activeSession.prompt(text)
    return { result, error: null }
  } catch (err) {
    return { result: null, error: err.message || 'AI prompt failed' }
  }
}

export function destroySession(session = null) {
  const target = session || currentSession
  if (target) {
    try {
      target.destroy()
    } catch {
      // Ignore destroy errors
    }
    if (target === currentSession) {
      currentSession = null
    }
  }
}

export function estimateTokens(text) {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4)
}
