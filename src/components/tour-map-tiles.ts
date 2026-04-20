export type BaseLayer = 'Base' | 'Satellite' | 'gray' | 'midnight' | 'Hybrid'

export const buildTileUrl = (layer: BaseLayer): string => {
  const envUrl = import.meta.env.VITE_MAP_TILE_URL as string | undefined
  const ext = layer === 'Satellite' || layer === 'Hybrid' ? 'jpeg' : 'png'
  if (envUrl && /\/(Base|Satellite|gray|midnight|Hybrid)\//.test(envUrl)) {
    return envUrl
      .replace(/\/(Base|Satellite|gray|midnight|Hybrid)\//, `/${layer}/`)
      .replace(/\.(png|jpeg)(\?|$)/, `.${ext}$2`)
  }
  return `/tiles?layer=${layer}&z={z}&x={x}&y={y}`
}
