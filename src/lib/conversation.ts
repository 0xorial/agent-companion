import { ChatMessage, Conversation } from "@/types/agent";

/** Walk parentId chain from headId up to the root, returning messages in chronological order. */
export function getActivePath(conv: Conversation): ChatMessage[] {
  const path: ChatMessage[] = [];
  let cur = conv.headId ? conv.nodes[conv.headId] : null;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    path.unshift(cur);
    cur = cur.parentId ? conv.nodes[cur.parentId] ?? null : null;
  }
  return path;
}

/** Get all direct children of a message id within the conversation. */
export function getChildren(conv: Conversation, parentId: string | null): ChatMessage[] {
  return Object.values(conv.nodes)
    .filter((n) => (n.parentId ?? null) === parentId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/** Get all root messages (parentId is null/undefined). */
export function getRoots(conv: Conversation): ChatMessage[] {
  return getChildren(conv, null);
}

/** Build a flat conversation from a linear list of messages (no branches). */
export function fromLinear(messages: ChatMessage[]): {
  nodes: Record<string, ChatMessage>;
  headId: string | null;
} {
  const nodes: Record<string, ChatMessage> = {};
  let prev: string | null = null;
  for (const m of messages) {
    nodes[m.id] = { ...m, parentId: prev };
    prev = m.id;
  }
  return { nodes, headId: prev };
}

/** Append a message after the current head. */
export function appendMessage(conv: Conversation, msg: ChatMessage): Conversation {
  const node: ChatMessage = { ...msg, parentId: conv.headId ?? null };
  return {
    ...conv,
    nodes: { ...conv.nodes, [node.id]: node },
    headId: node.id,
    updatedAt: Date.now(),
  };
}

/** Find the deepest descendant of a node along the most-recently-updated branch. */
export function deepestDescendant(conv: Conversation, fromId: string): string {
  let curId = fromId;
  while (true) {
    const kids = getChildren(conv, curId);
    if (kids.length === 0) return curId;
    // pick most recent child
    curId = kids[kids.length - 1].id;
  }
}
