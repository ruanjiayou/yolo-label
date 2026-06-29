// 计算文件 SHA-256 hash
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 计算文件 MD5 hash（Bun 原生）
async function calculateMD5(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  // Bun 内置 MD5
  const hash = Bun.CryptoHasher.hash('md5', new Uint8Array(buffer))
  return Buffer.from(hash).toString('hex')
}

// 计算文件快速 hash（Bun 原生，更快）
async function calculateBunHash(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer())
  // Bun 内置哈希，返回 number
  const hash = Bun.hash(buffer)
  return hash.toString(16)
}