package com.thoughtcapture.ai

import com.thoughtcapture.domain.model.Thought

interface ThoughtStructurer {
    suspend fun structure(rawTranscript: String): Thought
}
