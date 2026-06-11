package com.thoughtcapture

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.media.session.MediaButtonReceiver
import com.thoughtcapture.service.RecordingService
import com.thoughtcapture.ui.home.HomeScreen
import com.thoughtcapture.ui.home.HomeViewModel
import com.thoughtcapture.ui.theme.ThoughtCaptureTheme

class MainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { results ->
        val micGranted = results[Manifest.permission.RECORD_AUDIO] == true
        if (micGranted) {
            RecordingService.ensureForeground(this)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestNeededPermissions()

        val mediaButtonReceiver = ComponentName(this, com.thoughtcapture.receiver.MediaButtonReceiver::class.java)
        MediaButtonReceiver.handleIntent(
            this,
            Intent(Intent.ACTION_MEDIA_BUTTON).apply {
                component = mediaButtonReceiver
            },
        )

        val app = application as ThoughtCaptureApplication
        val factory = HomeViewModel.Factory(app.container.thoughtRepository)

        setContent {
            ThoughtCaptureTheme {
                HomeScreen(
                    onToggleRecording = {
                        RecordingService.toggleRecording(this)
                    },
                    viewModel = viewModel(factory = factory),
                )
            }
        }
    }

    override fun onStart() {
        super.onStart()
        if (hasMicPermission()) {
            RecordingService.ensureForeground(this)
        }
    }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (event?.action == KeyEvent.ACTION_DOWN) {
            when (keyCode) {
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                KeyEvent.KEYCODE_HEADSETHOOK,
                -> {
                    RecordingService.toggleRecording(this)
                    return true
                }
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun requestNeededPermissions() {
        val needed = buildList {
            if (!hasMicPermission()) add(Manifest.permission.RECORD_AUDIO)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                !hasNotificationPermission()
            ) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.BLUETOOTH_CONNECT,
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                add(Manifest.permission.BLUETOOTH_CONNECT)
            }
        }

        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        }
    }

    private fun hasMicPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO,
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun hasNotificationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
    }
}
