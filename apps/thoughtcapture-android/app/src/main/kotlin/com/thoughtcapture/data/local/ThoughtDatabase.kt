package com.thoughtcapture.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [ThoughtEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class ThoughtDatabase : RoomDatabase() {
    abstract fun thoughtDao(): ThoughtDao

    companion object {
        fun create(context: Context): ThoughtDatabase {
            return Room.databaseBuilder(
                context.applicationContext,
                ThoughtDatabase::class.java,
                "thought_capture.db",
            ).build()
        }
    }
}
