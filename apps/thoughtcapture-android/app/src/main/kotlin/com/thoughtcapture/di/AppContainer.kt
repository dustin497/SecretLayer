package com.thoughtcapture.di

import android.content.Context
import com.thoughtcapture.ai.GroqThoughtStructurer
import com.thoughtcapture.ai.LocalFallbackStructurer
import com.thoughtcapture.ai.ThoughtStructurer
import com.thoughtcapture.data.local.ThoughtDatabase
import com.thoughtcapture.data.repository.ThoughtRepository
import com.thoughtcapture.speech.SpeechTranscriber

class AppContainer(context: Context) {
    private val database = ThoughtDatabase.create(context)

    val thoughtRepository = ThoughtRepository(database.thoughtDao())
    val speechTranscriber = SpeechTranscriber(context)
    val thoughtStructurer: ThoughtStructurer = GroqThoughtStructurer()
    val localFallbackStructurer = LocalFallbackStructurer()
}
