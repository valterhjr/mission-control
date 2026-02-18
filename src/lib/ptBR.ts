// Traduções PT-BR para Mission Control
export const t = {
  // Geral
  title: 'Mission Control',
  dashboard: 'Painel de Controle',
  agents: 'Meus Agentes',
  tasks: 'Tarefas',
  config: 'Configurações',
  logs: 'Logs',
  quickCommands: 'Comandos Rápidos',

  // Agentes
  agentName: 'Nome',
  agentId: 'ID do Agente',
  agentStatus: 'Status',
  agentLoad: 'Carga',
  agentTokens: 'Tokens',
  agentLastActivity: 'Última Atividade',
  agentOnline: 'Online',
  agentOffline: 'Offline',
  agentOnlineFor: (min: number) => `Agente online há ${min}min`,
  createAgent: 'Criar Agente',
  editAgent: 'Editar Agente',
  activate: 'Ativar',
  deactivate: 'Desativar',
  testConnection: 'Testar Conexão',
  save: 'Salvar',
  agentFunction: 'Função',
  primaryModel: 'Modelo Principal',
  workspace: 'Workspace',
  apiKeys: 'Chaves API',
  skills: 'Skills',
  heartbeatInterval: 'Heartbeat (s)',
  subAgents: 'Sub-agentes',

  // Kanban
  backlog: 'Backlog',
  inProgress: 'Em Progresso',
  review: 'Revisão',
  done: 'Concluído',

  // Logs
  realtimeLogs: 'Logs em Tempo Real',
  filterAll: 'Todos',
  filterTools: 'Ferramentas',
  filterAssistant: 'Assistente',
  filterUser: 'Usuário',

  // Config
  openclawConfig: 'Configurações OpenClaw (config.yaml)',
  models: 'Modelos',
  defaultAgents: 'Agentes Padrão',
  maintenance: 'Manutenção',
  cronJobs: 'Cron Jobs',
  validate: 'Validar',
  applyConfig: 'Aplicar Config',
  restartGateway: 'Reiniciar Gateway',

  // Comandos Rápidos
  healthCheckAll: 'Health Check Todos',
  restartAgent: 'Reiniciar Agente',
  clearMemory: 'Limpar Memória',
  runCron: 'Rodar Cron',
  approveTools: 'Aprovar Tools',
  quickChat: 'Chat Rápido',

  // Alertas
  criticalError: (agent: string) => `Erro crítico no agente ${agent}`,
  apiError: 'Erro: falha na API',

  // Badges
  badgeWeb: 'Web',
  badgeShell: 'Shell',
  badgeFiles: 'Arquivos',

  // Geral
  loading: 'Carregando...',
  noData: 'Sem dados',
  error: 'Erro',
  success: 'Sucesso',
  confirm: 'Confirmar',
  cancel: 'Cancelar',
};
