import { db } from "./db";

export const BANK_DEFAULTS = {
  BANK_NAME: "Төрийн банк",
  BANK_ACCOUNT: "MN960034340004342702",
  BANK_RECEIVER: "Garidebook",
};

export async function getSetting(key: string, fallback = ""): Promise<string> {
  try {
    const s = await db.setting.findUnique({ where: { key } });
    return s?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function bankInfo() {
  const [name, account, receiver] = await Promise.all([
    getSetting("BANK_NAME", BANK_DEFAULTS.BANK_NAME),
    getSetting("BANK_ACCOUNT", BANK_DEFAULTS.BANK_ACCOUNT),
    getSetting("BANK_RECEIVER", BANK_DEFAULTS.BANK_RECEIVER),
  ]);
  return { bankName: name, account, receiver };
}
