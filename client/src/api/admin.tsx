
export async function getTicketStats() {
    const res = await fetch("/api/admin/ticketdata");
    return { ok: res.ok, tags: JSON.parse(await res.text()) };
}


export async function getUserStats() {
    const res = await fetch("/api/admin/userdata");
    return { ok: res.ok, tags: JSON.parse(await res.text()) };
}
  