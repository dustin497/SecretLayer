package com.thoughtcapture.ai

import com.thoughtcapture.BuildConfig
import com.thoughtcapture.domain.model.Thought
import com.thoughtcapture.domain.model.ThoughtCategory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

class GroqThoughtStructurer(
    private val httpClient: OkHttpClient = OkHttpClient(),
    private val json: Json = Json { ignoreUnknownKeys = true },
) : ThoughtStructurer {

    override suspend fun structure(rawTranscript: String): Thought {
        if (BuildConfig.GROQ_API_KEY.isBlank()) {
            return LocalFallbackStructurer().structure(rawTranscript)
        }

        val prompt = """
            You structure voice notes into clean, actionable items.
            Return ONLY valid JSON with keys: title, summary, category, suggestedActions.
            category must be one of: TASK, IDEA, REMINDER, PROJECT_NOTE, SHOPPING, UNCATEGORIZED.
            suggestedActions is an array of short next-step strings (0-3 items).

            Raw transcript:
            $rawTranscript
        """.trimIndent()

        val body = JSONObject()
            .put("model", BuildConfig.GROQ_MODEL)
            .put("temperature", 0.2)
            .put(
                "messages",
                JSONArray()
                    .put(
                        JSONObject()
                            .put("role", "system")
                            .put("content", "You are a calm, minimal thought-capture assistant."),
                    )
                    .put(
                        JSONObject()
                            .put("role", "user")
                            .put("content", prompt),
                    ),
            )
            .put("response_format", JSONObject().put("type", "json_object"))
            .toString()

        val request = Request.Builder()
            .url("https://api.groq.com/openai/v1/chat/completions")
            .addHeader("Authorization", "Bearer ${BuildConfig.GROQ_API_KEY}")
            .addHeader("Content-Type", "application/json")
            .post(body.toRequestBody("application/json".toMediaType()))
            .build()

        return withContext(Dispatchers.IO) {
            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext LocalFallbackStructurer().structure(rawTranscript)
                }

                val responseBody = response.body?.string().orEmpty()
                val content = JSONObject(responseBody)
                    .getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content")

                val structured = json.decodeFromString<StructuredThoughtResponse>(content)
                structured.toDomain(rawTranscript)
            }
        }
    }
}

class LocalFallbackStructurer : ThoughtStructurer {
    override suspend fun structure(rawTranscript: String): Thought {
        val trimmed = rawTranscript.trim()
        val firstSentence = trimmed.substringBefore('.').take(80).ifBlank { "Voice note" }
        val category = when {
            trimmed.contains("buy", ignoreCase = true) ||
                trimmed.contains("grocery", ignoreCase = true) -> ThoughtCategory.SHOPPING

            trimmed.contains("remind", ignoreCase = true) ||
                trimmed.contains("tomorrow", ignoreCase = true) -> ThoughtCategory.REMINDER

            trimmed.contains("idea", ignoreCase = true) -> ThoughtCategory.IDEA
            else -> ThoughtCategory.UNCATEGORIZED
        }

        return Thought(
            title = firstSentence,
            summary = trimmed,
            category = category,
            rawTranscript = trimmed,
            suggestedActions = emptyList(),
        )
    }
}
