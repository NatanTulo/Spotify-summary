import { describe, it, expect, beforeEach } from 'vitest'
import ImportProgressManager from './ImportProgressManager'

describe('ImportProgressManager', () => {
  let manager: ImportProgressManager

  beforeEach(() => {
    manager = ImportProgressManager.getInstance()
    // Reset state for testing
    manager.clearProgress('test-profile')
  })

  it('should start an import correctly', () => {
    manager.startImport('test-profile', 10, 1000)
    const progress = manager.getProgress('test-profile')
    
    expect(progress).toBeDefined()
    expect(progress?.profileName).toBe('test-profile')
    expect(progress?.isRunning).toBe(true)
    expect(progress?.status).toBe('preparing')
    expect(progress?.totalFiles).toBe(10)
    expect(progress?.estimatedTotalRecords).toBe(1000)
  })

  it('should update file progress', () => {
    manager.startImport('test-profile', 10, 1000)
    manager.updateFileProgress('test-profile', 'test-file.json', 1, 50, 100)
    
    const progress = manager.getProgress('test-profile')
    expect(progress?.currentFile).toBe('test-file.json')
    expect(progress?.currentRecord).toBe(50)
    expect(progress?.status).toBe('importing')
  })

  it('should calculate progress percentage correctly', () => {
    manager.startImport('test-profile', 10, 1000)
    
    // 0 progress
    expect(manager.getProgressPercentage('test-profile')).toBe(0)
    
    // 50 records in first file
    manager.updateFileProgress('test-profile', 'file1.json', 0, 50, 100)
    expect(manager.getProgressPercentage('test-profile')).toBe(5) // (50 / 1000) * 100
    
    // Complete first file (100 records)
    manager.completeFile('test-profile')
    expect(manager.getProgressPercentage('test-profile')).toBe(10) // (100 / 1000) * 100
    
    // 50 records in second file (total 150)
    manager.updateFileProgress('test-profile', 'file2.json', 1, 50, 100)
    expect(manager.getProgressPercentage('test-profile')).toBe(15) // (150 / 1000) * 100
  })

  it('should handle completed import', () => {
    manager.startImport('test-profile', 1, 100)
    manager.completeImport('test-profile')
    
    const progress = manager.getProgress('test-profile')
    expect(progress?.isRunning).toBe(false)
    expect(progress?.status).toBe('completed')
    expect(manager.getProgressPercentage('test-profile')).toBe(100)
  })

  it('should handle errors', () => {
    manager.startImport('test-profile', 1, 100)
    manager.errorImport('test-profile', 'Test error message')
    
    const progress = manager.getProgress('test-profile')
    expect(progress?.isRunning).toBe(false)
    expect(progress?.status).toBe('error')
    expect(progress?.error).toBe('Test error message')
  })
})
