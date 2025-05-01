import "mongoose-paginate-v2"; // to expose PaginateOptions in mongoose
import {PaginateOptions, PaginateResult} from "mongoose";

export function hasPagination(page?: number | null, pageSize?: number | null): boolean {
    return (page ?? 0) > 0 && (pageSize ?? 0) > 0;

}

export function getPaginateOption(page?: number, pageSize?: number, selection: string = '-isDeleted', showDetail: boolean = false): PaginateOptions {
    const paginateOptions: PaginateOptions = {
        pagination: hasPagination(page, pageSize),
        sort: {
            updatedAt: -1,
        },
        select: showDetail ? '' : selection
    };
    if (paginateOptions.pagination) {
        paginateOptions.page = page;
        paginateOptions.limit = pageSize;
        paginateOptions.collation = {
            locale: 'en',
        };
    }
    return paginateOptions;
}

export const emptyPaginatedResponse: PaginateResult<any> = {
    "docs": [],
    "totalDocs": 0,
    "offset": 0,
    "limit": 0,
    "totalPages": 1,
    "page": 1,
    "pagingCounter": 1,
    "hasPrevPage": false,
    "hasNextPage": false,
    "prevPage": null,
    "nextPage": null
}
