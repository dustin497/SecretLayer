package com.thoughtcapture.data.repository

import com.thoughtcapture.data.local.ThoughtDao
import com.thoughtcapture.data.local.ThoughtEntity
import com.thoughtcapture.domain.model.Thought
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class ThoughtRepository(
    private val thoughtDao: ThoughtDao,
) {
    fun observeThoughts(): Flow<List<Thought>> {
        return thoughtDao.observeAll().map { entities ->
            entities.map(ThoughtEntity::toDomain)
        }
    }

    suspend fun insertProcessingPlaceholder(rawTranscript: String): Long {
        val placeholder = ThoughtEntity(
            title = "Processing…",
            summary = "",
            category = "UNCATEGORIZED",
            rawTranscript = rawTranscript,
            suggestedActionsJson = "",
            createdAt = System.currentTimeMillis(),
            isProcessing = true,
        )
        return thoughtDao.insert(placeholder)
    }

    suspend fun finalizeThought(id: Long, thought: Thought) {
        thoughtDao.update(
            ThoughtEntity.fromDomain(
                thought.copy(id = id, isProcessing = false),
            ),
        )
    }

    suspend fun deleteThought(id: Long) {
        thoughtDao.deleteById(id)
    }
}
