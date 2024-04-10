import { assertEquals, describe, it, z } from '../../test-prelude.ts'
import { df, failure, InputError, success } from '../../index.ts'
import type { DomainFunction } from '../../index.ts'

describe('first', () => {
  it('should return the result of the first successful domain function', async () => {
    const a = df.make(z.object({ id: z.number() }))(({ id }) => String(id))
    const b = df.make(z.object({ id: z.number() }))(({ id }) => id + 1)
    const c = df.make(z.object({ id: z.number() }))(({ id }) => Boolean(id))
    const d = df.first(a, b, c)
    type _R = Expect<Equal<typeof d, DomainFunction<string | number | boolean>>>

    const results = await d({ id: 1 })
    assertEquals(results, success('1'))
  })

  it('should return a successful result even if one of the domain functions fails', async () => {
    const a = df.make(
      z.object({ n: z.number(), operation: z.literal('increment') }),
    )(({ n }) => n + 1)
    const b = df.make(
      z.object({ n: z.number(), operation: z.literal('decrement') }),
    )(({ n }) => n - 1)

    const c = df.first(a, b)
    type _R = Expect<Equal<typeof c, DomainFunction<number>>>

    assertEquals(await c({ n: 1, operation: 'increment' }), success(2))
  })

  it('should return error when all of the domain functions fails', async () => {
    const a = df.make(z.object({ id: z.string() }))(({ id }) => id)
    const b = df.make(z.object({ id: z.number() }))(() => {
      throw 'Error'
    })

    const c = df.first(a, b)
    type _R = Expect<Equal<typeof c, DomainFunction<string>>>

    assertEquals(
      await c({ id: 1 }),
      failure([
        new InputError('Expected string, received number', ['id']),
        new Error(),
      ]),
    )
  })
})