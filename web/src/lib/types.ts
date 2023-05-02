export type ApiTask = {
    id: number;
    title: string;
    description?: string;
    date?: string;  // yyyy-mm-dd (https://en.wikipedia.org/wiki/ISO_8601)
    time?: string;  // hh:mm
    location?: string;
    nextTaskIds: number[];
}

// Like ApiTask, but without id (since it's unknown at this point) and with previousTaskIds
export type ApiCreateTask = Omit<ApiTask, 'id'> & { previousTaskIds: number[] };

// Like ApiCreateTask, but may include only some of the fields
export type ApiUpdateTask = Partial<ApiCreateTask>;
