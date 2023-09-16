export async function getTickets() {
  const res = await fetch("/api/queue/get");
  return { ok: res.ok, tickets: JSON.parse(await res.text()) };
}

export async function claimTicket(id: number) {
  const res = await fetch("/api/queue/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: id }),
  });
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}

export async function unclaimTicket(id: number) {
  const res = await fetch("/api/queue/unclaim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: id }),
  });
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}

export async function checkClaimed() {
  const res = await fetch("/api/queue/claimed");
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}
