package com.thoughtcapture.domain.model

data class Thought(
    val id: Long = 0,
    val title: String,
    val summary: String,
    val category: ThoughtCategory,
    val rawTranscript: String,
    val suggestedActions: List<String>,
    val createdAt: Long = System.currentTimeMillis(),
    val isProcessing: Boolean = false,
)
