package com.thoughtcapture.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.thoughtcapture.MainActivity
import com.thoughtcapture.R
import com.thoughtcapture.ThoughtCaptureApplication
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class RecordingService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startCapture()
            ACTION_STOP -> stopCapture()
            ACTION_TOGGLE -> toggleCapture()
            else -> showIdleNotification()
        }
        return START_STICKY
    }

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }

    private fun toggleCapture() {
        if (_isRecording.value) stopCapture() else startCapture()
    }

    private fun startCapture() {
        if (_isRecording.value) return

        _isRecording.value = true
        _statusMessage.value = "Listening…"

        createNotificationChannels()
        startForeground(NOTIFICATION_ID, buildRecordingNotification())

        val app = application as ThoughtCaptureApplication
        app.container.speechTranscriber.startSession()
    }

    private fun stopCapture() {
        if (!_isRecording.value) return

        _isRecording.value = false
        _statusMessage.value = "Processing…"
        startForeground(NOTIFICATION_ID, buildProcessingNotification())

        serviceScope.launch {
            val app = application as ThoughtCaptureApplication
            val transcriber = app.container.speechTranscriber
            val structurer = app.container.thoughtStructurer
            val repository = app.container.thoughtRepository

            val transcript = transcriber.endSession()
            val placeholderId = repository.insertProcessingPlaceholder(transcript)

            try {
                val structured = structurer.structure(transcript)
                repository.finalizeThought(placeholderId, structured)
            } catch (_: Exception) {
                val fallback = app.container.localFallbackStructurer.structure(transcript)
                repository.finalizeThought(placeholderId, fallback)
            }

            _statusMessage.value = "Ready"
            startForeground(NOTIFICATION_ID, buildIdleNotification())
        }
    }

    private fun showIdleNotification() {
        createNotificationChannels()
        startForeground(NOTIFICATION_ID, buildIdleNotification())
    }

    private fun createNotificationChannels() {
        val manager = getSystemService(NotificationManager::class.java)
        val recording = NotificationChannel(
            CHANNEL_RECORDING,
            getString(R.string.notification_channel_recording),
            NotificationManager.IMPORTANCE_LOW,
        )
        val status = NotificationChannel(
            CHANNEL_STATUS,
            getString(R.string.notification_channel_status),
            NotificationManager.IMPORTANCE_LOW,
        )
        manager.createNotificationChannel(recording)
        manager.createNotificationChannel(status)
    }

    private fun buildRecordingNotification(): Notification {
        return baseNotificationBuilder()
            .setContentTitle(getString(R.string.recording_notification_title))
            .setContentText(getString(R.string.recording_notification_text))
            .setOngoing(true)
            .addAction(0, getString(R.string.action_stop_recording), stopPendingIntent())
            .build()
    }

    private fun buildProcessingNotification(): Notification {
        return baseNotificationBuilder()
            .setContentTitle(getString(R.string.processing_notification_title))
            .setOngoing(true)
            .build()
    }

    private fun buildIdleNotification(): Notification {
        return baseNotificationBuilder()
            .setContentTitle(getString(R.string.idle_notification_title))
            .setContentText(getString(R.string.idle_notification_text))
            .setOngoing(true)
            .addAction(0, getString(R.string.action_start_recording), startPendingIntent())
            .build()
    }

    private fun baseNotificationBuilder(): NotificationCompat.Builder {
        val launchIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, CHANNEL_RECORDING)
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(launchIntent)
            .setSilent(true)
    }

    private fun startPendingIntent(): PendingIntent {
        val intent = Intent(this, RecordingService::class.java).apply { action = ACTION_START }
        return PendingIntent.getService(
            this,
            1,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun stopPendingIntent(): PendingIntent {
        val intent = Intent(this, RecordingService::class.java).apply { action = ACTION_STOP }
        return PendingIntent.getService(
            this,
            2,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    companion object {
        private const val CHANNEL_RECORDING = "recording"
        private const val CHANNEL_STATUS = "status"
        private const val NOTIFICATION_ID = 1001

        private const val ACTION_START = "com.thoughtcapture.action.START"
        private const val ACTION_STOP = "com.thoughtcapture.action.STOP"
        private const val ACTION_TOGGLE = "com.thoughtcapture.action.TOGGLE"

        private val _isRecording = MutableStateFlow(false)
        val isRecording: StateFlow<Boolean> = _isRecording.asStateFlow()

        private val _statusMessage = MutableStateFlow("Ready")
        val statusMessage: StateFlow<String> = _statusMessage.asStateFlow()

        fun start(context: Context) {
            val intent = Intent(context, RecordingService::class.java).apply {
                action = ACTION_START
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, RecordingService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        fun toggleRecording(context: Context) {
            val intent = Intent(context, RecordingService::class.java).apply {
                action = ACTION_TOGGLE
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun ensureForeground(context: Context) {
            val intent = Intent(context, RecordingService::class.java)
            ContextCompat.startForegroundService(context, intent)
        }
    }
}
