package com.thoughtcapture.ai

import com.thoughtcapture.domain.model.ThoughtCategory
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test

class LocalFallbackStructurerTest {

    private val structurer = LocalFallbackStructurer()

    @Test
    fun `shopping keywords map to shopping category`() = runBlocking {
        val result = structurer.structure("I need to buy milk and eggs from the grocery store")
        assertEquals(ThoughtCategory.SHOPPING, result.category)
    }

    @Test
    fun `reminder keywords map to reminder category`() = runBlocking {
        val result = structurer.structure("Remind me tomorrow to call the dentist")
        assertEquals(ThoughtCategory.REMINDER, result.category)
    }
}
