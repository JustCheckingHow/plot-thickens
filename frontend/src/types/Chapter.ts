
export type Chapter = {
    text: string;
    title: string;
    character_summary: string;
    order: number;
    location_summary: string;
    character_relationship_graph: string;
    comments: {
        [key: string]: string;
    }
}