/**
 * Zustand状态管理
 */
import { create } from 'zustand';
import type { PluginConfig, OperationLog, AppStatus, AppStats, SessionLog } from '../../shared/types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../../shared/constants';

interface AppStore {
  // 状态
  status: AppStatus;
  config: PluginConfig;
  stats: AppStats;
  logs: OperationLog[];
  sessionLogs: SessionLog[];
  currentSessionId: string | null;
  
  // 操作
  setStatus: (status: AppStatus) => void;
  updateConfig: (config: Partial<PluginConfig>) => void;
  updateStats: (stats: Partial<AppStats>) => void;
  addLog: (log: OperationLog) => void;
  clearLogs: () => void;
  reset: () => void;
  
  // Session管理
  createSession: () => string;
  setCurrentSession: (sessionId: string | null) => void;
  loadSessionLogs: () => Promise<void>;
  saveSessionLogs: () => Promise<void>;
  getCurrentSession: () => SessionLog | null;
  getSessionById: (sessionId: string) => SessionLog | null;
}

const defaultConfig: PluginConfig = {
  aiModel: {
    type: 'gemini',
    apiKey: '',
  },
  candidateCount: DEFAULT_CONFIG.CANDIDATE_COUNT,
  jobDescription: '候选人-工作经历，要和B端、SaaS、工具产品、AI产品相关；不要和纯to C产品、垂直医疗、垂直教育、大客户定制产品相关。',
  delayRange: {
    min: DEFAULT_CONFIG.DELAY_MIN,
    max: DEFAULT_CONFIG.DELAY_MAX,
  },
  enableMouseSimulation: false,
  features: {
    autoGreet: true,
    autoRequestResume: false,
    autoAcceptResume: false,
  },
};

export const useAppStore = create<AppStore>((set, get) => ({
  status: 'idle',
  config: defaultConfig,
  stats: {
    processed: 0,
    matched: 0,
    greeted: 0,
    skipped: 0,
  },
  logs: [],
  sessionLogs: [],
  currentSessionId: null,
  
  setStatus: status => {
    set({ status });
    // 如果状态变为completed或error，保存当前session
    if (status === 'completed' || status === 'error') {
      const state = get();
      if (state.currentSessionId) {
        state.saveSessionLogs();
      }
    }
  },
  
  updateConfig: config =>
    set(state => ({
      config: { ...state.config, ...config },
    })),
  
  updateStats: stats => {
    set(state => ({
      stats: { ...state.stats, ...stats },
    }));
    // 同时更新当前session的统计
    const state = get();
    if (state.currentSessionId) {
      state.saveSessionLogs();
    }
  },
  
  addLog: log => {
    set(state => ({
      logs: [log, ...state.logs],
    }));
    // 同时更新当前session的日志
    const state = get();
    if (state.currentSessionId) {
      state.saveSessionLogs();
    }
  },
  
  clearLogs: () => set({ logs: [] }),
  
  reset: () => {
    const state = get();
    // 保存当前session（如果存在）
    if (state.currentSessionId && state.logs.length > 0) {
      state.saveSessionLogs();
    }
    set({
      status: 'idle',
      stats: {
        processed: 0,
        matched: 0,
        greeted: 0,
        skipped: 0,
      },
      logs: [],
      currentSessionId: null,
    });
  },
  
  // Session管理
  createSession: () => {
    const sessionId = `session_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const newSession: SessionLog = {
      sessionId,
      startTime: new Date().toISOString(),
      status: 'running',
      stats: {
        processed: 0,
        matched: 0,
        greeted: 0,
        skipped: 0,
      },
      logs: [],
    };
    
    set(state => ({
      currentSessionId: sessionId,
      sessionLogs: [newSession, ...state.sessionLogs].slice(0, 50), // 最多保存50次运行记录
      logs: [],
      stats: {
        processed: 0,
        matched: 0,
        greeted: 0,
        skipped: 0,
      },
    }));
    
    // 保存到storage
    get().saveSessionLogs();
    
    return sessionId;
  },
  
  setCurrentSession: (sessionId: string | null) => {
    const state = get();
    if (sessionId === null) {
      set({ currentSessionId: null, logs: [] });
      return;
    }
    
    const session = state.getSessionById(sessionId);
    if (session) {
      set({
        currentSessionId: sessionId,
        logs: session.logs,
        stats: session.stats,
        status: session.status,
      });
    }
  },
  
  loadSessionLogs: async () => {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.SESSION_LOGS,
        STORAGE_KEYS.CURRENT_SESSION_ID,
      ]);
      
      const sessionLogs = (result[STORAGE_KEYS.SESSION_LOGS] || []) as SessionLog[];
      const currentSessionId = result[STORAGE_KEYS.CURRENT_SESSION_ID] as string | null;
      
      set({ sessionLogs, currentSessionId });
      
      // 如果有当前session，加载其日志
      if (currentSessionId) {
        const session = sessionLogs.find(s => s.sessionId === currentSessionId);
        if (session) {
          set({
            logs: session.logs,
            stats: session.stats,
            status: session.status,
          });
        }
      }
    } catch (error) {
      console.error('[AppStore] Failed to load session logs:', error);
    }
  },
  
  saveSessionLogs: async () => {
    try {
      const state = get();
      if (!state.currentSessionId) return;
      
      // 更新当前session
      const currentSession: SessionLog = {
        sessionId: state.currentSessionId,
        startTime: state.sessionLogs.find(s => s.sessionId === state.currentSessionId)?.startTime || new Date().toISOString(),
        endTime: state.status === 'completed' || state.status === 'error' ? new Date().toISOString() : undefined,
        status: state.status,
        stats: { ...state.stats },
        logs: [...state.logs],
      };
      
      // 更新sessionLogs数组
      const updatedSessionLogs = state.sessionLogs.map(s =>
        s.sessionId === state.currentSessionId ? currentSession : s
      );
      
      // 如果session不存在，添加到数组开头
      if (!updatedSessionLogs.find(s => s.sessionId === state.currentSessionId)) {
        updatedSessionLogs.unshift(currentSession);
      }
      
      // 限制最多50条记录
      const limitedSessionLogs = updatedSessionLogs.slice(0, 50);
      
      set({ sessionLogs: limitedSessionLogs });
      
      // 保存到storage
      await chrome.storage.local.set({
        [STORAGE_KEYS.SESSION_LOGS]: limitedSessionLogs,
        [STORAGE_KEYS.CURRENT_SESSION_ID]: state.currentSessionId,
      });
    } catch (error) {
      console.error('[AppStore] Failed to save session logs:', error);
    }
  },
  
  getCurrentSession: () => {
    const state = get();
    if (!state.currentSessionId) return null;
    return state.getSessionById(state.currentSessionId);
  },
  
  getSessionById: (sessionId: string) => {
    const state = get();
    return state.sessionLogs.find(s => s.sessionId === sessionId) || null;
  },
}));

