package com.thoughtcapture

import android.app.Application
import com.thoughtcapture.di.AppContainer

class ThoughtCaptureApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
