/**
 * VegaUtils - Vega-Lite embedding utilities
 * Dynamic import wrapper for Vega-Embed to handle SSR compatibility
 */

export const VegaEmbed = async (selector: string, spec: any, options?: any) => {
  try {
    // Dynamic import to avoid SSR issues
    const embed = await import('vega-embed')
    return embed.default(selector, spec, options)
  } catch (error) {
    console.error('Error loading vega-embed:', error)
    throw error
  }
}