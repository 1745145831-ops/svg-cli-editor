export interface PluginConfigEntry {
  readonly module: string;
  readonly options?: Readonly<Record<string, unknown>>;
  readonly enabled?: boolean;
}

export interface PluginConfig {
  readonly plugins: readonly PluginConfigEntry[];
}
