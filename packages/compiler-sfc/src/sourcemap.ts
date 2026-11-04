import type { RawSourceMap } from '@vue/compiler-core'
import type { SourceMapSegment } from 'muggle-string'

export const decodedMappingsCache = new WeakMap<
  RawSourceMap,
  SourceMapSegment[][]
>()

export function setDecodedMappings(
  map: RawSourceMap,
  segments: SourceMapSegment[][],
): void {
  decodedMappingsCache.set(map, segments)
}

export function getDecodedMappings(
  map: RawSourceMap,
): SourceMapSegment[][] | undefined {
  return decodedMappingsCache.get(map)
}
