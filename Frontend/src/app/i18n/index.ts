export type Lang = 'en' | 'ja';

const T: Record<Lang, Record<string, string>> = {
  en: {
    // Nav / Header
    live: 'LIVE',
    sessionName: 'Marketing Q2 Session',
    sessionCost: 'Session cost',
    viewManager: 'Manager',
    viewDev: 'Dev',

    // Sidebar
    agents: 'AGENTS',
    session: 'SESSION',
    duration: 'Duration',
    events: 'Events',
    toolCalls: 'Tool calls',
    approvals: 'Approvals',

    // Agent states
    state_thinking: 'THINKING',
    state_waiting: 'AWAITING',
    state_idle: 'IDLE',
    state_error: 'ERROR',
    state_tool_call: 'TOOL CALL',

    // Agent roles
    role_researcher: 'Data Analysis',
    role_analyst: 'Business Intelligence',
    role_writer: 'Content Creation',
    role_reviewer: 'Quality Assurance',
    role_developer: 'Software Engineering',

    // Right panel
    smartActivity: 'SMART ACTIVITY',
    ceoLanguage: '→ CEO Language',
    cost: 'COST',
    tokens: 'TOKENS',
    totalUsed: 'total used',
    currentSession: 'USD · current session',
    budget: 'budget',
    eventsLabel: 'EVENTS',
    viewReplay: 'View Replay →',

    // Event types
    evt_waiting: 'AWAITING',
    evt_running: 'RUNNING',
    evt_error: 'ERROR',
    evt_done: 'COMPLETED',
    evt_idle: 'IDLE',

    // Canvas
    virtualOffice: 'Virtual Office',
    managerViewLabel: 'Manager View · Real-time',

    // Landing
    landing_badge: 'Now in Beta · CrewAI supported',
    landing_h1a: 'The only AI observability',
    landing_h1b: 'your CEO can read.',
    landing_desc: 'Watch your AI agents work in real-time inside a 2D virtual office. Enterprise-grade observability meets pixel art visualization.',
    landing_cta: 'Start Free Trial →',
    landing_demo: 'Watch Demo',
    landing_trust: 'Trusted by AI teams at Series A–C companies · No credit card required',
    product: 'Product',
    pricing: 'Pricing',
    docs: 'Docs',
    changelog: 'Changelog',
    login: 'Log in',
    getStarted: 'Get started',
  },
  ja: {
    // Nav / Header
    live: 'ライブ',
    sessionName: 'マーケティング Q2',
    sessionCost: 'セッションコスト',
    viewManager: '管理者',
    viewDev: '開発者',

    // Sidebar
    agents: 'エージェント',
    session: 'セッション',
    duration: '実行時間',
    events: 'イベント',
    toolCalls: 'ツール呼出',
    approvals: '承認',

    // Agent states
    state_thinking: '思考中',
    state_waiting: '承認待ち',
    state_idle: '待機中',
    state_error: 'エラー',
    state_tool_call: 'ツール実行',

    // Agent roles
    role_researcher: 'データ分析',
    role_analyst: 'ビジネス分析',
    role_writer: 'コンテンツ作成',
    role_reviewer: '品質保証',
    role_developer: 'ソフトウェア開発',

    // Right panel
    smartActivity: 'スマート活動',
    ceoLanguage: '→ CEO言語',
    cost: 'コスト',
    tokens: 'トークン',
    totalUsed: '合計使用量',
    currentSession: 'USD · 現在のセッション',
    budget: '予算',
    eventsLabel: 'イベント',
    viewReplay: '再生 →',

    // Event types
    evt_waiting: '承認待ち',
    evt_running: '実行中',
    evt_error: 'エラー',
    evt_done: '完了',
    evt_idle: '待機中',

    // Canvas
    virtualOffice: 'バーチャルオフィス',
    managerViewLabel: '管理者ビュー · リアルタイム',

    // Landing
    landing_badge: 'ベータ版公開中 · CrewAI対応',
    landing_h1a: 'CEOも読める唯一の',
    landing_h1b: 'AI可観測性ツール。',
    landing_desc: 'AIエージェントが2Dバーチャルオフィスでリアルタイムに作業する様子を確認。エンタープライズグレードの可観測性とピクセルアートの融合。',
    landing_cta: '無料トライアル →',
    landing_demo: 'デモを見る',
    landing_trust: 'シリーズA〜CのAIチームに信頼されています · クレジットカード不要',
    product: 'プロダクト',
    pricing: '料金',
    docs: 'ドキュメント',
    changelog: '更新履歴',
    login: 'ログイン',
    getStarted: '始める',
  },
};

export function t(lang: Lang, key: string): string {
  return T[lang]?.[key] ?? T.en[key] ?? key;
}
