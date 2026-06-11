package com.thoughtcapture.ai

import com.thoughtcapture.domain.model.Thought
import com.thoughtcapture.domain.model.ThoughtCategory
import kotlinx.serialization.Serializable

@Serializable
data class StructuredThoughtResponse(
    val title: String,
    val summary: String,
    val category: String,
    val suggestedActions: List<String> = emptyList(),
) {
    fun toDomain(rawTranscript: String): Thought = Thought(
        title = title.trim().ifBlank { "Untitled thought" },
        summary = summary.trim(),
        category = ThoughtCategory.fromApiValue(category),
        rawTranscript = rawTranscript,
        suggestedActions = suggestedActions.map { it.trim() }.filter { it.isNotBlank() },
    )
}
