import { expect } from 'vitest'
import { given } from '../../helpers'

given('astar')('Playground', async ({ networks: { astar }, keyring: { alice } }) => {
  expect(astar).toBeTruthy()
  expect(alice).toBeTruthy()
  // do somethig
})
