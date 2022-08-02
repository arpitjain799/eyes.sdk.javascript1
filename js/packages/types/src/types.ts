export type MaybeArray<T> = T | T[]

export declare type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
