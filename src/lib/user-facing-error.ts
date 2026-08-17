const technicalErrorPattern = /failed query|params:|drizzle|sqlstate|er_[a-z_]+|next_redirect|insert into|update `|delete from|select .* from/i;

export function getUserFacingError(error: unknown, fallback = "操作失败，请稍后重试") {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.trim();
  if (!message || message.length > 120 || technicalErrorPattern.test(message) || /[\r\n]/.test(message)) return fallback;
  return /[\u3400-\u9fff]/.test(message) ? message : fallback;
}

export function isDuplicateDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; errno?: unknown; cause?: unknown };
  if (candidate.code === "ER_DUP_ENTRY" || candidate.errno === 1062) return true;
  return candidate.cause !== error && isDuplicateDatabaseError(candidate.cause);
}
