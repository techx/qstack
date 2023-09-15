export async function getTags(){
    const res = await fetch("/api/ticket/tagslist");
    return JSON.parse(await res.text())
}