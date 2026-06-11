package com.thoughtcapture.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.view.KeyEvent
import com.thoughtcapture.service.RecordingService

/**
 * Captures headset media-button events from Galaxy Buds and other Bluetooth earbuds.
 *
 * Configure Galaxy Buds in Galaxy Wearable: set double-tap to Play/Pause so the
 * bud sends KEYCODE_MEDIA_PLAY_PAUSE / HEADSETHOOK events to Android.
 */
class MediaButtonReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (Intent.ACTION_MEDIA_BUTTON != intent.action) return

        val keyEvent = intent.getParcelableExtra<KeyEvent>(Intent.EXTRA_KEY_EVENT) ?: return
        if (keyEvent.action != KeyEvent.ACTION_DOWN) return

        when (keyEvent.keyCode) {
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
            KeyEvent.KEYCODE_HEADSETHOOK,
            KeyEvent.KEYCODE_MEDIA_PLAY,
            KeyEvent.KEYCODE_MEDIA_PAUSE,
            -> {
                val now = System.currentTimeMillis()
                if (now - lastTapMs < DOUBLE_TAP_WINDOW_MS) {
                    lastTapMs = 0L
                    RecordingService.toggleRecording(context)
                } else {
                    lastTapMs = now
                }
            }
        }
    }

    companion object {
        private const val DOUBLE_TAP_WINDOW_MS = 450L
        private var lastTapMs = 0L
    }
}
