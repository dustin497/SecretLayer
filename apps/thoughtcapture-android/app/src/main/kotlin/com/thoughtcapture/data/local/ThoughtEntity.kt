package com.thoughtcapture.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.thoughtcapture.domain.model.Thought
import com.thoughtcapture.domain.model.ThoughtCategory

@Entity(tableName = "thoughts")
data class ThoughtEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val summary: String,
    val category: String,
    val rawTranscript: String,
    val suggestedActionsJson: String,
    val createdAt: Long,
    val isProcessing: Boolean = false,
) {
    fun toDomain(): Thought = Thought(
        id = id,
        title = title,
        summary = summary,
        category = ThoughtCategory.fromApiValue(category),
        rawTranscript = rawTranscript,
        suggestedActions = if (suggestedActionsJson.isBlank()) {
            emptyList()
        } else {
            suggestedActionsJson.split(ACTION_DELIMITER)
        },
        createdAt = createdAt,
        isProcessing = isProcessing,
    )

    companion object {
        private const val ACTION_DELIMITER = "|||"

        fun fromDomain(thought: Thought): ThoughtEntity = ThoughtEntity(
            id = thought.id,
            title = thought.title,
            summary = thought.summary,
            category = thought.category.name,
            rawTranscript = thought.rawTranscript,
            suggestedActionsJson = thought.suggestedActions.joinToString(ACTION_DELIMITER),
            createdAt = thought.createdAt,
            isProcessing = thought.isProcessing,
        )
    }
}
