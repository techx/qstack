export async function whoami() {
  const res = await fetch(`/api/auth/whoami`);
  return JSON.parse(await res.text());
}

export async function mpass(password: string) {
  const res = await fetch(`/api/auth/mpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password: password,
    }),
  });
  return { status: res.ok, ...JSON.parse(await res.text()) };
}
