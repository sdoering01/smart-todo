export function formatDate(date: Date): string {
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();

    return `${day}.${month}.${year}`;
}   

export function formatDateISO(date: Date): string {
    return date.toISOString().slice(0, 10);
}
