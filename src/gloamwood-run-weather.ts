/**
 * A run owns its weather seed independently from the map and evolution seeds.
 * Those systems remain deterministic for their existing tests; this one small
 * presentation seed changes when the player begins another run.
 */
export const GLOAMWOOD_WEATHER_SEED_PARAM = 'weatherSeed'

export function resolveGloamwoodWeatherRunSeed(
  requestedSeed: string | null | undefined,
  nextEntropy: () => string,
) {
  const explicit = requestedSeed?.trim()
  return explicit ? `weather-seed:${explicit}` : `weather-run:${nextEntropy()}`
}
