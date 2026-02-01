import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import {
  loadUserData,
  saveUserData,
  loadLocalData,
  saveLocalData,
  migrateLocalDataToDatabase,
  type UserSimulationData,
} from '@/lib/database/userDataService'

interface UseDataPersistenceOptions {
  /** Debounce delay in milliseconds for auto-save */
  debounceMs?: number
  /** Callback when data is loaded */
  onLoad?: (data: UserSimulationData) => void
  /** Callback for save errors */
  onSaveError?: (error: Error) => void
  /** Callback for load errors */
  onLoadError?: (error: Error) => void
}

/**
 * Hook for managing data persistence
 * - Automatically switches between localStorage and Supabase based on auth state
 * - Auto-saves with debouncing
 * - Migrates local data to database on login
 * - Falls back to localStorage when offline
 */
export function useDataPersistence(
  data: UserSimulationData,
  options: UseDataPersistenceOptions = {}
) {
  const { user, loading: authLoading } = useAuth()
  const isOnline = useOnlineStatus()
  const { debounceMs = 2000, onLoad, onSaveError, onLoadError } = options

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitializedRef = useRef(false)
  const lastSavedDataRef = useRef<string>('')

  // Load data on mount or auth change
  useEffect(() => {
    if (authLoading) return

    const loadData = async () => {
      try {
        let loadedData: UserSimulationData | null = null

        if (user && isOnline) {
          // User is logged in and online - try to migrate local data first
          await migrateLocalDataToDatabase(user.id)
          // Then load from database
          loadedData = await loadUserData(user.id)
        } else {
          // Not logged in or offline - load from localStorage
          loadedData = loadLocalData()
        }

        if (loadedData && onLoad) {
          onLoad(loadedData)
        }
        isInitializedRef.current = true
        lastSavedDataRef.current = JSON.stringify(loadedData || data)
      } catch (error) {
        console.error('Error loading data:', error)
        if (onLoadError && error instanceof Error) {
          onLoadError(error)
        }
        // Fall back to local storage on error
        try {
          const localData = loadLocalData()
          if (localData && onLoad) {
            onLoad(localData)
          }
        } catch {
          // Ignore secondary errors
        }
        isInitializedRef.current = true
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, isOnline])

  // Debounced save function
  const debouncedSave = useCallback(
    (dataToSave: UserSimulationData) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Don't save if not initialized yet
      if (!isInitializedRef.current) return

      // Check if data actually changed
      const dataString = JSON.stringify(dataToSave)
      if (dataString === lastSavedDataRef.current) return

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (user && isOnline) {
            // User is logged in and online - save to cloud
            await saveUserData(user.id, dataToSave)
          } else {
            // Not logged in or offline - save to localStorage
            saveLocalData(dataToSave)
          }
          lastSavedDataRef.current = dataString
        } catch (error) {
          console.error('Error saving data:', error)
          // On cloud save error, fallback to localStorage
          if (user && isOnline) {
            try {
              saveLocalData(dataToSave)
              lastSavedDataRef.current = dataString
            } catch {
              // Ignore secondary errors
            }
          }
          if (onSaveError && error instanceof Error) {
            onSaveError(error)
          }
        }
      }, debounceMs)
    },
    [user, isOnline, debounceMs, onSaveError]
  )

  // Auto-save when data changes
  useEffect(() => {
    if (!isInitializedRef.current || authLoading) return
    debouncedSave(data)
  }, [data, debouncedSave, authLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Force save immediately
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    try {
      if (user && isOnline) {
        await saveUserData(user.id, data)
      } else {
        saveLocalData(data)
      }
      lastSavedDataRef.current = JSON.stringify(data)
    } catch (error) {
      console.error('Error saving data:', error)
      // On cloud save error, fallback to localStorage
      if (user && isOnline) {
        try {
          saveLocalData(data)
          lastSavedDataRef.current = JSON.stringify(data)
        } catch {
          // Ignore secondary errors
        }
      }
      if (onSaveError && error instanceof Error) {
        onSaveError(error)
      }
      throw error
    }
  }, [user, isOnline, data, onSaveError])

  return {
    saveNow,
    isAuthenticated: !!user,
    isOnline,
    isInitialized: isInitializedRef.current,
  }
}
