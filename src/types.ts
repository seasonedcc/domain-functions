import { Failure, Success } from './composable/types.ts'

/**
 * A successful domain function result.
 */
type SuccessResult<T = void> = Success<T> & {
  inputErrors: []
  environmentErrors: []
}

/**
 * A failed domain function result.
 */
type ErrorResult = Failure & {
  inputErrors: SchemaError[]
  environmentErrors: SchemaError[]
}

/**
 * Items in the inputErrors and environmentErrors array returned by failed domain functions.
 */
type SchemaError = {
  path: string[]
  message: string
}

/**
 * The properties of the ErrorResult which carry information about what made the domain function fail.
 */
type ErrorData = Omit<ErrorResult, 'success'>

/**
 * The content of the Promise a domain function returns.
 */
type Result<T = void> = SuccessResult<T> | ErrorResult

/**
 * A domain function.
 * It carries the output type which can be further unpacked with UnpackData and other type helpers.
 */
type DomainFunction<Output = unknown> = {
  (input?: unknown, environment?: unknown): Promise<Result<Output>>
}

/**
 * Unpacks the result of a domain function.
 * @example
 * type MyDF = DomainFunction<{ a: string }>
 * type MyResult = UnpackResult<MyDF>
 * //   ^? SuccessResult<{ a: string }> | ErrorResult
 */
type UnpackResult<F extends DomainFunction> = Awaited<ReturnType<F>>

/**
 * Unpacks the data type of a successful domain function.
 * @example
 * type MyDF = DomainFunction<{ a: string }>
 * type MyData = UnpackSuccess<MyDF>
 * //   ^? SuccessResult<{ a: string }>
 */
type UnpackSuccess<F extends DomainFunction> = Extract<
  UnpackResult<F>,
  { success: true }
>

/**
 * Unpacks the data type of a successful domain function.
 * @example
 * type MyDF = DomainFunction<{ a: string }>
 * type MyData = UnpackData<MyDF>
 * //   ^? { a: string }
 */
type UnpackData<F extends DomainFunction> = UnpackSuccess<F>['data']

/**
 * Unpacks a list of DomainFunctions into a tuple of their data types.
 * @example
 * type MyDFs = [
 *  DomainFunction<{ a: string }>,
 *  DomainFunction<{ b: number }>,
 * ]
 * type MyData = UnpackAll<MyDFs>
 * //   ^? [{ a: string }, { b: number }]
 */
type UnpackAll<List, output extends unknown[] = []> = List extends [
  DomainFunction<infer first>,
  ...infer rest,
]
  ? UnpackAll<rest, [...output, first]>
  : output

type UnpackDFObject<Obj extends Record<string, DomainFunction>> =
  | { [K in keyof Obj]: UnpackData<Obj[K]> }
  | never

/**
 * A parsing error when validating the input or environment schemas.
 * This will be transformed into a `SchemaError` before being returned from the domain function.
 * It is usually not visible to the end user unless one wants to write an adapter for a schema validator.
 */
type ParserIssue = { path: PropertyKey[]; message: string }

/**
 * The result of input or environment validation.
 * See the type `Result` for the return values of domain functions.
 * It is usually not visible to the end user unless one wants to write an adapter for a schema validator.
 */
type ParserResult<T> =
  | {
      success: true
      data: T
    }
  | { success: false; error: { issues: ParserIssue[] } }

/**
 * The object used to validate either input or environment when creating domain functions.
 */
type ParserSchema<T extends unknown = unknown> = {
  safeParseAsync: (a: unknown) => Promise<ParserResult<T>>
}

export type {
  AtLeastOne,
  ErrorWithMessage,
  Last,
  MergeObjs,
  TupleToUnion,
} from './composable/types.ts'
export type {
  DomainFunction,
  ErrorData,
  ErrorResult,
  ParserIssue,
  ParserResult,
  ParserSchema,
  Result,
  SchemaError,
  SuccessResult,
  UnpackAll,
  UnpackData,
  UnpackDFObject,
  UnpackResult,
  UnpackSuccess,
}

