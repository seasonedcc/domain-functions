import { describe, it, assertEquals } from './test-prelude.ts'
import { z } from './test-prelude.ts'

import { mdf } from './constructor.ts'
import { sequence } from './domain-functions.ts'
import type { DomainFunction } from './types.ts'
import type { Equal, Expect } from './types.test.ts'

describe('sequence', () => {
  it('should compose domain functions from left-to-right saving the results sequentially', async () => {
    const a = mdf(z.object({ id: z.number() }))(({ id }) => ({
      id: id + 2,
    }))
    const b = mdf(z.object({ id: z.number() }))(({ id }) => ({
      result: id - 1,
    }))

    const c = sequence(a, b)
    type _R = Expect<
      Equal<typeof c, DomainFunction<[{ id: number }, { result: number }]>>
    >

    assertEquals(await c({ id: 1 }), {
      success: true,
      data: [{ id: 3 }, { result: 2 }],
      errors: [],
      inputErrors: [],
      environmentErrors: [],
    })
  })

  it('should use the same environment in all composed functions', async () => {
    const a = mdf(
      z.undefined(),
      z.object({ env: z.number() }),
    )((_input, { env }) => ({
      inp: env + 2,
    }))
    const b = mdf(
      z.object({ inp: z.number() }),
      z.object({ env: z.number() }),
    )(({ inp }, { env }) => ({ result: inp + env }))

    const c = sequence(a, b)
    type _R = Expect<
      Equal<typeof c, DomainFunction<[{ inp: number }, { result: number }]>>
    >

    assertEquals(await c(undefined, { env: 1 }), {
      success: true,
      data: [{ inp: 3 }, { result: 4 }],
      errors: [],
      inputErrors: [],
      environmentErrors: [],
    })
  })

  it('should fail on the first environment parser failure', async () => {
    const envParser = z.object({ env: z.number() })
    const a = mdf(
      z.undefined(),
      envParser,
    )((_input, { env }) => ({
      inp: env + 2,
    }))
    const b = mdf(
      z.object({ inp: z.number() }),
      envParser,
    )(({ inp }, { env }) => inp + env)

    const c = sequence(a, b)
    type _R = Expect<Equal<typeof c, DomainFunction<[{ inp: number }, number]>>>

    assertEquals(await c(undefined, {}), {
      success: false,
      errors: [],
      inputErrors: [],
      environmentErrors: [{ message: 'Required', path: ['env'] }],
    })
  })

  it('should fail on the first input parser failure', async () => {
    const firstInputParser = z.undefined()

    const a = mdf(
      firstInputParser,
      z.object({ env: z.number() }),
    )((_input, { env }) => ({
      inp: env + 2,
    }))
    const b = mdf(
      z.object({ inp: z.number() }),
      z.object({ env: z.number() }),
    )(({ inp }, { env }) => inp + env)

    const c = sequence(a, b)
    type _R = Expect<Equal<typeof c, DomainFunction<[{ inp: number }, number]>>>

    assertEquals(await c({ inp: 'some invalid input' }, { env: 1 }), {
      success: false,
      errors: [],
      inputErrors: [
        { message: 'Expected undefined, received object', path: [] },
      ],
      environmentErrors: [],
    })
  })

  it('should fail on the second input parser failure', async () => {
    const a = mdf(
      z.undefined(),
      z.object({ env: z.number() }),
    )(() => ({
      inp: 'some invalid input',
    }))
    const b = mdf(
      z.object({ inp: z.number() }),
      z.object({ env: z.number() }),
    )(({ inp }, { env }) => inp + env)

    const c = sequence(a, b)
    type _R = Expect<Equal<typeof c, DomainFunction<[{ inp: string }, number]>>>

    assertEquals(await c(undefined, { env: 1 }), {
      success: false,
      errors: [],
      inputErrors: [
        { message: 'Expected number, received string', path: ['inp'] },
      ],
      environmentErrors: [],
    })
  })

  it('should compose more than 2 functions', async () => {
    const a = mdf(z.object({ aNumber: z.number() }))(({ aNumber }) => ({
      aString: String(aNumber),
    }))
    const b = mdf(z.object({ aString: z.string() }))(({ aString }) => ({
      aBoolean: aString == '1',
    }))
    const c = mdf(z.object({ aBoolean: z.boolean() }))(({ aBoolean }) => ({
      anotherBoolean: !aBoolean,
    }))

    const d = sequence(a, b, c)
    type _R = Expect<
      Equal<
        typeof d,
        DomainFunction<
          [
            { aString: string },
            { aBoolean: boolean },
            { anotherBoolean: boolean },
          ]
        >
      >
    >

    assertEquals(await d({ aNumber: 1 }), {
      success: true,
      data: [{ aString: '1' }, { aBoolean: true }, { anotherBoolean: false }],
      errors: [],
      inputErrors: [],
      environmentErrors: [],
    })
  })
})
