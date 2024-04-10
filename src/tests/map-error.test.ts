import { assertEquals, describe, it } from '../test-prelude.ts'
import type { Result, Composable } from '../index.ts'
import { composable, mapError } from '../index.ts'

const faultyAdd = composable((a: number, b: number) => {
  if (a === 1) throw new Error('a is 1')
  return a + b
})

const cleanError = (err: Error) => ({
  ...err,
  message: err.message + '!!!',
})
describe('mapError', () => {
  it('maps over the error results of an Composable function', async () => {
    const fn = mapError(faultyAdd, (errors) => errors.map(cleanError))
    const res = await fn(1, 2)

    type _FN = Expect<
      Equal<typeof fn, Composable<(a: number, b: number) => number>>
    >
    type _R = Expect<Equal<typeof res, Result<number>>>

    assertEquals(res.success, false)
    assertEquals(res.errors![0].message, 'a is 1!!!')
  })

  it('fails when mapper fail', async () => {
    const fn = mapError(faultyAdd, () => {
      throw new Error('Mapper also has problems')
    })
    const res = await fn(1, 2)

    type _FN = Expect<
      Equal<typeof fn, Composable<(a: number, b: number) => number>>
    >
    type _R = Expect<Equal<typeof res, Result<number>>>

    assertEquals(res.success, false)
    assertEquals(res.errors![0].message, 'Mapper also has problems')
  })
})