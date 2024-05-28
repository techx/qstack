export async function whoami() {
  const res = await fetch(`/api/auth/whoami`);
  return JSON.parse(await res.text());
}

export interface UserInfo {
  name: string;
  email: string;
  role: string;
  password: string;
  location: string;
  zoomlink: string;
  discord: string;
}

export async function updateUser(user: UserInfo) {
  const res = await fetch(`/api/auth/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  return { ok: res.ok, ...JSON.parse(await res.text()) };
}
