export default defineEventHandler(async (event) => {
  const url = getQuery(event).url as string | undefined
  if (!url) throw createError({ statusCode: 400, message: 'url required' })

  let hostname = ''
  try { hostname = new URL(url).hostname } catch {
    throw createError({ statusCode: 400, message: 'Invalid URL' })
  }

  try {
    const html = await $fetch<string>(url, {
      responseType: 'text',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; quickNote/1.0)' },
      timeout: 8000,
    })

    const og = (prop: string) => {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i'),
        new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
      ]
      for (const re of patterns) {
        const m = html.match(re)
        if (m?.[1]) return m[1].trim()
      }
      return ''
    }

    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const favicon = `https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`

    return {
      url,
      title: og('title') || titleTag?.[1]?.trim() || hostname,
      description: og('description'),
      image: og('image'),
      favicon,
    }
  } catch {
    return {
      url,
      title: hostname,
      description: '',
      image: '',
      favicon: `https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`,
    }
  }
})
