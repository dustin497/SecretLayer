package com.thoughtcapture.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.thoughtcapture.data.repository.ThoughtRepository
import com.thoughtcapture.domain.model.Thought
import com.thoughtcapture.domain.model.ThoughtCategory
import com.thoughtcapture.service.RecordingService
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class HomeUiState(
    val thoughtsByCategory: Map<ThoughtCategory, List<Thought>> = emptyMap(),
    val isRecording: Boolean = false,
    val statusMessage: String = "Ready",
)

class HomeViewModel(
    private val repository: ThoughtRepository,
) : ViewModel() {

    val uiState: StateFlow<HomeUiState> = combine(
        repository.observeThoughts(),
        RecordingService.isRecording,
        RecordingService.statusMessage,
    ) { thoughts, isRecording, status ->
        HomeUiState(
            thoughtsByCategory = thoughts
                .groupBy { it.category }
                .toSortedMap(compareBy { it.ordinal }),
            isRecording = isRecording,
            statusMessage = status,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = HomeUiState(),
    )

    class Factory(
        private val repository: ThoughtRepository,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return HomeViewModel(repository) as T
        }
    }
}
