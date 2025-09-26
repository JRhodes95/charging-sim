import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { add } from 'date-fns'
import { useChargingState } from './use-charging-state'
import { estimateChargeDurationSeconds } from '../lib/utils'
import type { CarState } from './use-car-state'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('use-charging-state', () => {
  let mockCarState: CarState
  let mockIncrementCharge: vi.Mock

  beforeEach(() => {
    vi.useFakeTimers()

    mockCarState = {
      model: 'Test Car',
      nickname: 'Test',
      stateOfCharge: 50.0
    }

    mockIncrementCharge = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  // Phase 1: Pure Function Tests
  describe('estimateChargeDurationSeconds', () => {
    it('calculates correct duration for normal charging scenario', () => {
      const result = estimateChargeDurationSeconds(50, 85)
      expect(result).toBe(350) // (85 - 50) / 0.1 = 350 seconds
    })

    it('calculates correct duration for small charge differences', () => {
      const result = estimateChargeDurationSeconds(99, 100)
      expect(result).toBe(10) // (100 - 99) / 0.1 = 10 seconds
    })

    it('handles zero charge difference', () => {
      const result = estimateChargeDurationSeconds(85, 85)
      expect(result).toBe(0)
    })

    it('handles decimal charge percentages', () => {
      const result = estimateChargeDurationSeconds(50.5, 75.3)
      expect(result).toBeCloseTo(248, 1) // (75.3 - 50.5) / 0.1 = 248 seconds
    })

    it('handles negative charge difference (target lower than current)', () => {
      const result = estimateChargeDurationSeconds(80, 70)
      expect(result).toBe(-100) // (70 - 80) / 0.1 = -100 seconds
    })
  })

  // Helper function to create hook with default props
  const createHook = (carState = mockCarState, incrementCharge = mockIncrementCharge) => {
    return renderHook(() => useChargingState({ carState, incrementCharge }))
  }

  // Phase 2: Basic Hook State Management
  describe('Basic State Management', () => {
    it('starts with unplugged state', () => {
      const { result } = createHook()

      expect(result.current.chargingState).toEqual({
        status: 'unplugged'
      })
    })

    it('plugInCar transitions from unplugged to idle', async () => {
      const { result } = createHook()
      const { toast } = await import('sonner')

      act(() => {
        result.current.plugInCar()
      })

      expect(result.current.chargingState).toEqual({
        status: 'idle'
      })
      expect(toast.success).toHaveBeenCalledWith('Car plugged in')
    })

    it('unplugCar transitions to unplugged from any state', async () => {
      const { result } = createHook()
      const { toast } = await import('sonner')

      // First plug in to get to idle state
      act(() => {
        result.current.plugInCar()
      })

      // Then unplug
      act(() => {
        result.current.unplugCar()
      })

      expect(result.current.chargingState).toEqual({
        status: 'unplugged'
      })
    })

    it('unplugCar shows warning toast when was charging', async () => {
      const { result } = createHook()
      const { toast } = await import('sonner')

      // First plug in and trigger override to get to charging state
      act(() => {
        result.current.plugInCar()
      })

      act(() => {
        result.current.triggerOverride()
      })

      // Clear previous toast calls
      vi.clearAllMocks()

      // Now unplug while charging
      act(() => {
        result.current.unplugCar()
      })

      expect(toast.info).toHaveBeenCalledWith('Car unplugged - charging stopped')
    })

    it('triggerOverride creates charging-override state with correct times', () => {
      const { result } = createHook()
      const mockDate = new Date('2024-01-01T12:00:00Z')
      vi.setSystemTime(mockDate)

      act(() => {
        result.current.triggerOverride()
      })

      expect(result.current.chargingState.status).toBe('charging-override')

      if (result.current.chargingState.status === 'charging-override') {
        expect(result.current.chargingState.charge.startTime).toEqual(mockDate)
        expect(result.current.chargingState.charge.endTime).toEqual(
          add(mockDate, { minutes: 60 })
        )
      }
    })

    it('cancelOverrideCharge transitions to idle', async () => {
      const { result } = createHook()
      const { toast } = await import('sonner')

      // First trigger override
      act(() => {
        result.current.triggerOverride()
      })

      // Clear previous calls
      vi.clearAllMocks()

      // Then cancel
      act(() => {
        result.current.cancelOverrideCharge()
      })

      expect(result.current.chargingState).toEqual({
        status: 'idle'
      })
      expect(toast.info).toHaveBeenCalledWith('Charging stopped')
    })

    it('cancelScheduledCharge transitions to schedule-suspended', async () => {
      const { result } = createHook()
      const { toast } = await import('sonner')
      const mockDate = new Date('2024-01-01T12:00:00Z')
      vi.setSystemTime(mockDate)

      act(() => {
        result.current.cancelScheduledCharge()
      })

      expect(result.current.chargingState.status).toBe('schedule-suspended')

      if (result.current.chargingState.status === 'schedule-suspended') {
        const expectedSuspendedUntil = new Date('2024-01-02T06:00:00Z') // Tomorrow at 6 AM
        expect(result.current.chargingState.suspendedUntil).toEqual(expectedSuspendedUntil)
      }

      expect(toast.warning).toHaveBeenCalledWith('Scheduled charging suspended until tomorrow 6 AM')
    })
  })

  // Phase 3: Basic State Flow Tests (Simplified - timer logic will be replaced)
  describe('Basic State Flow', () => {
    it('returns functions for all state transitions', () => {
      const { result } = createHook()

      expect(typeof result.current.unplugCar).toBe('function')
      expect(typeof result.current.plugInCar).toBe('function')
      expect(typeof result.current.triggerOverride).toBe('function')
      expect(typeof result.current.cancelOverrideCharge).toBe('function')
      expect(typeof result.current.cancelScheduledCharge).toBe('function')
    })

    it('maintains state consistency through transitions', () => {
      const { result } = createHook()

      // Test transition chain: unplugged -> idle -> charging-override -> unplugged
      expect(result.current.chargingState.status).toBe('unplugged')

      act(() => {
        result.current.plugInCar()
      })
      expect(result.current.chargingState.status).toBe('idle')

      act(() => {
        result.current.triggerOverride()
      })
      expect(result.current.chargingState.status).toBe('charging-override')

      act(() => {
        result.current.unplugCar()
      })
      expect(result.current.chargingState.status).toBe('unplugged')
    })
  })

  // Phase 4: Basic Edge Cases (Simplified)
  describe('Basic Edge Cases', () => {
    it('handles rapid state changes correctly', () => {
      const { result } = createHook()

      // Rapid sequence of state changes
      act(() => {
        result.current.plugInCar() // unplugged -> idle
        result.current.triggerOverride() // idle -> charging-override
        result.current.unplugCar() // charging-override -> unplugged
        result.current.plugInCar() // unplugged -> idle
        result.current.cancelScheduledCharge() // idle -> schedule-suspended
      })

      expect(result.current.chargingState.status).toBe('schedule-suspended')
    })

    it('maintains override charge timing data correctly', () => {
      const { result } = createHook()
      const mockDate = new Date('2024-01-01T12:00:00Z')
      vi.setSystemTime(mockDate)

      act(() => {
        result.current.triggerOverride()
      })

      expect(result.current.chargingState.status).toBe('charging-override')

      if (result.current.chargingState.status === 'charging-override') {
        expect(result.current.chargingState.charge.startTime).toEqual(mockDate)
        expect(result.current.chargingState.charge.endTime).toEqual(
          add(mockDate, { minutes: 60 })
        )
      }
    })

    it('provides access to charging state and all control functions', () => {
      const { result } = createHook()

      expect(result.current.chargingState).toBeDefined()
      expect(result.current.unplugCar).toBeDefined()
      expect(result.current.plugInCar).toBeDefined()
      expect(result.current.triggerOverride).toBeDefined()
      expect(result.current.cancelOverrideCharge).toBeDefined()
      expect(result.current.cancelScheduledCharge).toBeDefined()
    })
  })
})