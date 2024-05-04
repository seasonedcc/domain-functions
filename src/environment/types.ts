import { Internal } from '../internal/types.ts'
import { Composable, PipeReturn, SequenceReturn } from '../types.ts'

type CommonEnvironment<
  Fns extends Composable[],
  Env extends [unknown?] = [unknown?],
> = Fns extends [] ? Env
  : Fns extends [
    Composable<(...args: infer CParameters) => any>,
    ...infer RestFns,
  ]
    ? GetEnv<CParameters> extends [unknown?]
      ? Internal.IsIncompatible<Env, GetEnv<CParameters>> extends true
        ? Internal.IncompatibleArguments<Env, GetEnv<CParameters>>
      : CommonEnvironment<
        Extract<RestFns, Composable[]>,
        Extract<Internal.CommonSubType<Env, GetEnv<CParameters>>, [unknown?]>
      >
    : never
  : never

type SequenceReturnWithEnvironment<Fns extends Composable[]> = SequenceReturn<
  PipeArgumentsWithEnvironment<Fns>
> extends Composable<(...args: any[]) => infer CReturn>
  ? CommonEnvironment<Fns> extends { 'Incompatible arguments ': true }
    ? CommonEnvironment<Fns>
  : Composable<
    (...args: SetEnv<Parameters<Fns[0]>, CommonEnvironment<Fns>>) => CReturn
  >
  : PipeArgumentsWithEnvironment<Fns>

type PipeReturnWithEnvironment<Fns extends Composable[]> = PipeReturn<
  PipeArgumentsWithEnvironment<Fns>
> extends Composable<(...args: any[]) => infer CReturn>
  ? CommonEnvironment<Fns> extends { 'Incompatible arguments ': true }
    ? CommonEnvironment<Fns>
  : Composable<
    (...args: SetEnv<Parameters<Fns[0]>, CommonEnvironment<Fns>>) => CReturn
  >
  : PipeArgumentsWithEnvironment<Fns>

type PipeArgumentsWithEnvironment<
  Fns extends any[],
  Arguments extends any[] = [],
> = Fns extends [Composable<(...a: infer PA) => infer OA>, ...infer restA]
  ? restA extends [
    Composable<
      (
        firstParameter: infer FirstBParameter,
        secondParameter: any,
        ...b: infer PB
      ) => any
    >,
    ...unknown[],
  ]
    ? Internal.IsNever<Awaited<OA>> extends true
      ? Internal.FailToCompose<never, FirstBParameter>
    : Awaited<OA> extends FirstBParameter
      ? Internal.EveryElementTakes<PB, undefined> extends true
        ? PipeArgumentsWithEnvironment<
          restA,
          [...Arguments, Composable<(...a: PA) => OA>]
        >
      : Internal.EveryElementTakes<PB, undefined>
    : Internal.FailToCompose<Awaited<OA>, FirstBParameter>
  : [...Arguments, Composable<(...a: PA) => OA>]
  : never

type GetEnv<Params extends unknown[]> = Params extends [
  unknown,
  infer envMandatory,
] ? [envMandatory]
  : Params extends Partial<[unknown, infer envOptional]> ? [envOptional?]
  : Params extends [...Partial<[unknown]>] ? [unknown?]
  : Params extends [...infer AnyArg] ? [AnyArg[1]]
  : never

type SetEnv<
  Params extends unknown[],
  Env extends [unknown?] = [unknown?],
> = Params extends [infer firstMandatory, ...any] ? [firstMandatory, ...Env]
  : Params extends [...Partial<[infer firstOptional, ...any]>]
    ? [firstOptional?, ...Env]
  : never

export type {
  CommonEnvironment,
  GetEnv,
  PipeReturnWithEnvironment,
  SequenceReturnWithEnvironment,
  SetEnv,
}