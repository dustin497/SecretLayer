package com.thoughtcapture.domain.model

enum class ThoughtCategory(val displayName: String) {
    TASK("Task"),
    IDEA("Idea"),
    REMINDER("Reminder"),
    PROJECT_NOTE("Project Note"),
    SHOPPING("Shopping"),
    UNCATEGORIZED("Uncategorized"),
    ;

    companion object {
        fun fromApiValue(value: String): ThoughtCategory {
            return entries.firstOrNull {
                it.name.equals(value, ignoreCase = true) ||
                    it.displayName.equals(value, ignoreCase = true)
            } ?: UNCATEGORIZED
        }
    }
}
