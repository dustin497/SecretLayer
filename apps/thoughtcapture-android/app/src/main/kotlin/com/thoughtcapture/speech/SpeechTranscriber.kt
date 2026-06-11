package com.thoughtcapture.speech

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Session-based speech recognizer for live capture while the user speaks.
 * Prefers on-device recognition when available (Google Speech Services).
 */
class SpeechTranscriber(
    private val context: Context,
) {
    private var recognizer: SpeechRecognizer? = null
    private val transcriptParts = mutableListOf<String>()
    private var stopDeferred: CompletableDeferred<String>? = null

    fun startSession() {
        transcriptParts.clear()
        if (!SpeechRecognizer.isRecognitionAvailable(context)) return

        val speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
        recognizer = speechRecognizer

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM,
            )
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 15_000)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 10_000)
        }

        speechRecognizer.setRecognitionListener(
            object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) = Unit
                override fun onBeginningOfSpeech() = Unit
                override fun onRmsChanged(rmsdB: Float) = Unit
                override fun onBufferReceived(buffer: ByteArray?) = Unit
                override fun onEndOfSpeech() {
                    // Continuous listening: restart until session is stopped.
                    if (stopDeferred == null) {
                        speechRecognizer.startListening(intent)
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) = Unit

                override fun onPartialResults(partial: Bundle?) {
                    val text = partial
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull()
                        .orEmpty()
                    if (text.isNotBlank() && transcriptParts.lastOrNull() != text) {
                        if (transcriptParts.isNotEmpty() && !text.startsWith(transcriptParts.last())) {
                            transcriptParts.add(text)
                        } else if (transcriptParts.isEmpty()) {
                            transcriptParts.add(text)
                        } else {
                            transcriptParts[transcriptParts.lastIndex] = text
                        }
                    }
                }

                override fun onResults(results: Bundle?) {
                    val text = results
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull()
                        .orEmpty()
                    if (text.isNotBlank()) {
                        if (transcriptParts.isEmpty()) {
                            transcriptParts.add(text)
                        } else {
                            transcriptParts[transcriptParts.lastIndex] = text
                        }
                    }

                    val deferred = stopDeferred
                    if (deferred != null) {
                        speechRecognizer.destroy()
                        recognizer = null
                        deferred.complete(transcriptParts.joinToString(" ").ifBlank { text })
                    } else {
                        speechRecognizer.startListening(intent)
                    }
                }

                override fun onError(error: Int) {
                    val deferred = stopDeferred
                    if (deferred != null) {
                        speechRecognizer.destroy()
                        recognizer = null
                        deferred.complete(
                            transcriptParts.joinToString(" ").ifBlank {
                                "Could not transcribe audio (error $error)"
                            },
                        )
                    } else if (error != SpeechRecognizer.ERROR_NO_MATCH) {
                        speechRecognizer.startListening(intent)
                    }
                }
            },
        )

        speechRecognizer.startListening(intent)
    }

    suspend fun endSession(): String = withContext(Dispatchers.Main) {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            return@withContext "Speech recognition unavailable"
        }

        val current = recognizer
        if (current == null) {
            return@withContext transcriptParts.joinToString(" ")
        }

        val deferred = CompletableDeferred<String>()
        stopDeferred = deferred
        current.stopListening()
        deferred.await()
    }

    fun cancelSession() {
        stopDeferred?.complete(transcriptParts.joinToString(" "))
        stopDeferred = null
        recognizer?.destroy()
        recognizer = null
        transcriptParts.clear()
    }
}
