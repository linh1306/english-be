
import { Query } from "./types";

export function parseQuery(query: Query<any, any, any>, defaultSort: object = {}) {
    const page = query.page && Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = query.limit && Number(query.limit) > 0 ? Number(query.limit) : 10;
    const orderBy = query.orderBy as any;

    return {
        skip: (page - 1) * limit,
        take: limit,
        orderBy: orderBy
            ? (Array.isArray(orderBy)
                ? orderBy.map((o) => {
                    if (o.startsWith('-')) return { [o.substring(1)]: 'desc' };
                    return { [o]: 'asc' };
                })
                : [orderBy].map((o: string) => {
                    if (o.startsWith('-')) return { [o.substring(1)]: 'desc' };
                    return { [o]: 'asc' };
                }))
            : defaultSort,
    };
}
