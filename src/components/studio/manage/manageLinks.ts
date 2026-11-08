// Tabs of /studio/manage and links between them (?tab=…&client=…)
export const MANAGE_PATH = "/studio/manage";

export const MANAGE_TABS = ["requests", "calendar", "clients", "settings"] as const;
export type ManageTab = (typeof MANAGE_TABS)[number];

export function isManageTab(value: string | null): value is ManageTab {
  return (MANAGE_TABS as readonly (string | null)[]).includes(value);
}

// Link to a tab; `client` opens that client's card in the Clients tab
export function manageTabPath(tab: ManageTab, client?: string): string {
  const params = new URLSearchParams({ tab });
  if (client) params.set("client", client);
  return `${MANAGE_PATH}?${params.toString()}`;
}
