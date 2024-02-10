interface Ticket {
  question: string;
  content: string;
  location: string;
  tags: Array<string>;
}

export async function getTags() {
  const res = await fetch("/api/ticket/tagslist");
  return { ok: res.ok, tags: JSON.parse(await res.text()) };
}

export async function save(ticket: Ticket) {
  const res = await fetch(`/api/ticket/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticket),
  });
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}

export async function submit(ticket: Ticket) {
  const res = await fetch(`/api/ticket/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticket),
  });
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}

export async function getTicket() {
  const res = await fetch("/api/ticket/get");
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}

export async function remove(del: boolean) {
  const res = await fetch("/api/ticket/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ del: del }),
  });
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}

export async function getStatus() {
  const res = await fetch("/api/ticket/status");
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}

export async function unclaim() {
  const res = await fetch("/api/ticket/unclaim");
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}

export async function getFeedback() {
  const res = await fetch("/api/ticket/awaiting_feedback");
  return { ok: res.ok, tickets: JSON.parse(await res.text()) };
}

export async function rate(id: number, mentor_id: number, rating: number) {
  const res = await fetch("/api/ticket/rate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: id, mentor_id: mentor_id, rating: rating }),
  });
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}

export async function resolve(mentor_id: number) {
  const res = await fetch("/api/ticket/resolve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mentor_id: mentor_id }),
  });
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}
