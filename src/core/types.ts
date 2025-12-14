export type Body<
    Model,
    Keys extends keyof Model,
    Tags extends Partial<{ [K in Keys]: unknown }> = {}
> = {
        [K in Keys]: K extends keyof Tags
        ? Model[K] & Tags[K]
        : Model[K]
    }

export type BodyPartial<
    Model,
    Keys extends keyof Model,
    Tags extends Partial<{ [K in Keys]: unknown }> = {}
> = Partial<Body<Model, Keys, Tags>>

type OrderByOptions<T extends string> = T | `-${T}`

export type Query<
    Model,
    FilterKeys extends keyof Model = never,
    SortKeys extends string = never
> = {
    search?: string;
    page?: number;
    limit?: number;
} & {
        [K in FilterKeys]?: Model[K]
    } & (
        [SortKeys] extends [never]
        ? {}
        : { orderBy?: OrderByOptions<SortKeys>[] }
    )