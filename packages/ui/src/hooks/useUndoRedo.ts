import { useState, useCallback, useRef } from 'react';

export interface UndoRedoAction<T> {
  type: string;
  description: string;
  timestamp: number;
  undo: () => T;
  redo: () => T;
}

export interface UndoRedoState<T> {
  current: T;
  history: UndoRedoAction<T>[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
  debounceMs?: number;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
) {
  const { maxHistorySize = 50, debounceMs = 300 } = options;
  
  const [state, setState] = useState<UndoRedoState<T>>({
    current: initialState,
    history: [],
    currentIndex: -1,
    canUndo: false,
    canRedo: false
  });
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingAction = useRef<UndoRedoAction<T> | null>(null);

  const updateState = useCallback((newCurrent: T, newHistory: UndoRedoAction<T>[], newIndex: number) => {
    setState({
      current: newCurrent,
      history: newHistory,
      currentIndex: newIndex,
      canUndo: newIndex >= 0,
      canRedo: newIndex < newHistory.length - 1
    });
  }, []);

  const executeAction = useCallback((action: UndoRedoAction<T>) => {
    const newCurrent = action.redo();
    const newHistory = [...state.history.slice(0, state.currentIndex + 1), action];
    
    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    }
    
    const newIndex = newHistory.length - 1;
    updateState(newCurrent, newHistory, newIndex);
    
    return newCurrent;
  }, [state.history, state.currentIndex, maxHistorySize, updateState]);

  const executeWithDebounce = useCallback((action: UndoRedoAction<T>) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    pendingAction.current = action;
    
    debounceTimer.current = setTimeout(() => {
      if (pendingAction.current) {
        executeAction(pendingAction.current);
        pendingAction.current = null;
      }
    }, debounceMs);

    // Execute immediately but store for potential debouncing
    return action.redo();
  }, [debounceMs, executeAction]);

  const execute = useCallback((
    type: string,
    description: string,
    undoFn: () => T,
    redoFn: () => T,
    options: { immediate?: boolean; debounce?: boolean } = {}
  ): T => {
    const action: UndoRedoAction<T> = {
      type,
      description,
      timestamp: Date.now(),
      undo: undoFn,
      redo: redoFn
    };

    if (options.debounce && !options.immediate) {
      return executeWithDebounce(action);
    } else {
      return executeAction(action);
    }
  }, [executeAction, executeWithDebounce]);

  const undo = useCallback(() => {
    if (state.canUndo && state.currentIndex >= 0) {
      const action = state.history[state.currentIndex];
      const newCurrent = action.undo();
      const newIndex = state.currentIndex - 1;
      
      // Update the current state without adding to history
      setState(prev => ({
        ...prev,
        current: newCurrent,
        currentIndex: newIndex,
        canUndo: newIndex >= 0,
        canRedo: true
      }));
      
      return newCurrent;
    }
    return state.current;
  }, [state]);

  const redo = useCallback(() => {
    if (state.canRedo && state.currentIndex < state.history.length - 1) {
      const nextIndex = state.currentIndex + 1;
      const action = state.history[nextIndex];
      const newCurrent = action.redo();
      
      // Update the current state without adding to history
      setState(prev => ({
        ...prev,
        current: newCurrent,
        currentIndex: nextIndex,
        canUndo: true,
        canRedo: nextIndex < prev.history.length - 1
      }));
      
      return newCurrent;
    }
    return state.current;
  }, [state]);

  const clearHistory = useCallback(() => {
    updateState(state.current, [], -1);
  }, [state.current, updateState]);

  const getHistoryPreview = useCallback((maxItems: number = 10) => {
    const items = [];
    const start = Math.max(0, state.currentIndex - maxItems + 1);
    
    for (let i = start; i <= Math.min(state.currentIndex + maxItems, state.history.length - 1); i++) {
      const action = state.history[i];
      if (action) {
        items.push({
          index: i,
          type: action.type,
          description: action.description,
          timestamp: action.timestamp,
          isCurrent: i === state.currentIndex,
          canRevert: i <= state.currentIndex
        });
      }
    }
    
    return items;
  }, [state.history, state.currentIndex]);

  const jumpToIndex = useCallback((targetIndex: number) => {
    if (targetIndex < -1 || targetIndex >= state.history.length) return state.current;
    
    let newCurrent = state.current;
    
    if (targetIndex > state.currentIndex) {
      // Redo to target
      for (let i = state.currentIndex + 1; i <= targetIndex; i++) {
        newCurrent = state.history[i].redo();
      }
    } else if (targetIndex < state.currentIndex) {
      // Undo to target
      for (let i = state.currentIndex; i > targetIndex; i--) {
        newCurrent = state.history[i].undo();
      }
    }
    
    setState(prev => ({
      ...prev,
      current: newCurrent,
      currentIndex: targetIndex,
      canUndo: targetIndex >= 0,
      canRedo: targetIndex < prev.history.length - 1
    }));
    
    return newCurrent;
  }, [state]);

  return {
    // Current state
    current: state.current,
    
    // Actions
    execute,
    undo,
    redo,
    clearHistory,
    jumpToIndex,
    
    // State queries
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    
    // History inspection
    history: state.history,
    currentIndex: state.currentIndex,
    getHistoryPreview
  };
}